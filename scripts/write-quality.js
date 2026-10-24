#!/usr/bin/env node

/**
 * Quality report
 *
 * Writes dist/quality.json for the /quality page from the reports the CI run
 * has just produced: Vitest and its coverage summary, the Playwright run
 * (including its axe scans), Lighthouse, the runtime dependency audit, the
 * CSP in firebase.json and the build stamp. Every number on the page comes
 * from here - nothing is typed in by hand.
 *
 * It refuses to write a partial report: if any input is missing, the page
 * shows "not available" rather than a claim the run did not make.
 *
 * Usage (CI, after the Lighthouse step):
 *   node scripts/write-quality.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const INPUTS = {
    vitest: 'reports/vitest.json',
    coverage: 'coverage/coverage-summary.json',
    playwright: 'reports/playwright.json',
    audit: 'reports/audit.json',
    firebase: 'firebase.json',
    version: 'dist/version.json',
};

const median = values => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

/** Every Playwright test result, flattened out of nested suites. */
function playwrightTests(suites = []) {
    return suites.flatMap(suite => [
        ...(suite.specs ?? []).flatMap(spec => spec.tests.map(test => ({ title: spec.title, status: test.status }))),
        ...playwrightTests(suite.suites),
    ]);
}

/** Median Lighthouse category scores (0-100) for one page. */
function lighthouseScores(lhrs, page) {
    const runs = lhrs.filter(lhr => new URL(lhr.finalDisplayedUrl ?? lhr.finalUrl).pathname === page);
    if (!runs.length) throw new Error(`No Lighthouse runs for ${page}`);
    const score = category => Math.round(median(runs.map(lhr => lhr.categories[category].score)) * 100);
    return {
        performance: score('performance'),
        accessibility: score('accessibility'),
        bestPractices: score('best-practices'),
        seo: score('seo'),
    };
}

/** True when the production CSP allows no inline scripts. */
function hasStrictCsp(firebase) {
    const csp = firebase.hosting.headers
        .flatMap(rule => rule.headers)
        .find(header => header.key === 'Content-Security-Policy')?.value ?? '';
    const scriptSrc = csp.split(';').map(part => part.trim()).find(part => part.startsWith('script-src')) ?? '';
    return Boolean(scriptSrc) && !scriptSrc.includes("'unsafe-inline'") && !scriptSrc.includes("'unsafe-eval'");
}

/**
 * Assemble the report from parsed inputs. Pure, so it can be tested.
 */
export function buildQualityReport({ vitest, coverage, playwright, lighthouse, audit, firebase, version }) {
    const tests = playwrightTests(playwright.suites);
    const axe = tests.filter(test => /axe violations/.test(test.title));

    return {
        commit: version.commit,
        shortCommit: version.shortCommit,
        builtAt: version.builtAt,
        unit: {
            passed: vitest.numPassedTests,
            failed: vitest.numFailedTests,
            coverage: Math.round(coverage.total.lines.pct),
        },
        e2e: {
            passed: playwright.stats.expected,
            failed: playwright.stats.unexpected,
            flaky: playwright.stats.flaky,
            skipped: playwright.stats.skipped,
        },
        a11y: {
            scans: axe.filter(test => test.status === 'expected').length,
            violations: axe.filter(test => test.status === 'unexpected').length,
        },
        lighthouse: lighthouseScores(lighthouse, '/about'),
        security: {
            runtimeAdvisories: gatedAdvisories(audit),
            strictCsp: hasStrictCsp(firebase),
        },
    };
}

/**
 * Advisories at the level the CI gate fails on (`--audit-level=moderate`).
 * Counting low/info too would show a red ✗ for a build the gate accepted.
 */
function gatedAdvisories(audit) {
    const { moderate = 0, high = 0, critical = 0 } = audit.metadata.vulnerabilities;
    return moderate + high + critical;
}

/** Every number the page renders must be a real number, or the report is not written. */
export function assertComplete(report) {
    const bad = [];
    const walk = (value, at) => {
        if (typeof value === 'number' && !Number.isFinite(value)) bad.push(at);
        else if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => walk(child, `${at}.${key}`));
    };
    walk(report, 'report');
    if (Number.isNaN(Date.parse(report.builtAt))) bad.push('report.builtAt');
    if (bad.length) throw new Error(`Incomplete quality report: ${bad.join(', ')}`);
    return report;
}

/**
 * Read every input from disk, or say exactly which ones are missing.
 *
 * @returns {{ vitest: any, coverage: any, playwright: any, audit: any, firebase: any, version: any, lighthouse: any[] }}
 */
export function readInputs(root = ROOT) {
    const missing = Object.values(INPUTS).filter(file => !fs.existsSync(path.join(root, file)));
    const lhciDir = path.join(root, '.lighthouseci');
    const lhrFiles = fs.existsSync(lhciDir) ? fs.readdirSync(lhciDir).filter(file => /^lhr-.*\.json$/.test(file)) : [];
    if (!lhrFiles.length) missing.push('.lighthouseci/lhr-*.json');
    if (missing.length) throw new Error(`Missing inputs for the quality report: ${missing.join(', ')}`);

    const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    return {
        ...Object.fromEntries(Object.entries(INPUTS).map(([key, file]) => [key, read(file)])),
        lighthouse: lhrFiles.map(file => read(path.join('.lighthouseci', file))),
    };
}

function main() {
    try {
        const report = assertComplete(buildQualityReport(readInputs()));
        fs.writeFileSync(path.join(ROOT, 'dist', 'quality.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
        console.log(`✅ quality.json: unit ${report.unit.passed}, e2e ${report.e2e.passed}, a11y ${report.a11y.scans} scans, perf ${report.lighthouse.performance}`);
    } catch (error) {
        console.error('❌ Error writing quality.json:', error.message);
        process.exit(1);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
