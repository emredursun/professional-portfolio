// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { buildQualityReport, readInputs } from '../scripts/write-quality.js';

const lhr = (pathname: string, performance: number) => ({
  finalDisplayedUrl: `http://localhost:4181${pathname}`,
  categories: {
    performance: { score: performance },
    accessibility: { score: 1 },
    'best-practices': { score: 1 },
    seo: { score: 1 },
  },
});

const strictFirebase = {
  hosting: {
    headers: [{ source: '/**', headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' https://plausible.io" }] }],
  },
};

const inputs = {
  vitest: { numPassedTests: 106, numFailedTests: 0 },
  coverage: { total: { lines: { pct: 88.54 } } },
  playwright: {
    stats: { expected: 107, unexpected: 0, flaky: 1, skipped: 13 },
    suites: [
      {
        title: 'interactions.spec.ts',
        suites: [
          {
            title: 'accessibility',
            specs: [
              { title: '/about has no axe violations', tests: [{ status: 'expected' }, { status: 'expected' }] },
              { title: 'the not-found page has no axe violations', tests: [{ status: 'expected' }] },
            ],
          },
        ],
        specs: [{ title: 'theme toggles', tests: [{ status: 'expected' }] }],
      },
    ],
  },
  lighthouse: [lhr('/about', 0.93), lhr('/about', 0.97), lhr('/about', 0.91), lhr('/contact', 0.5)],
  audit: { metadata: { vulnerabilities: { total: 0 } } },
  firebase: strictFirebase,
  version: { commit: 'abcdef1234567', shortCommit: 'abcdef1', builtAt: '2026-10-24T12:00:00.000Z' },
};

describe('buildQualityReport', () => {
  it('summarises every check from the CI reports', () => {
    expect(buildQualityReport(inputs)).toEqual({
      commit: 'abcdef1234567',
      shortCommit: 'abcdef1',
      builtAt: '2026-10-24T12:00:00.000Z',
      unit: { passed: 106, failed: 0, coverage: 89 },
      e2e: { passed: 107, failed: 0, flaky: 1, skipped: 13 },
      a11y: { scans: 3, violations: 0 },
      lighthouse: { performance: 93, accessibility: 100, bestPractices: 100, seo: 100 },
      security: { runtimeAdvisories: 0, strictCsp: true },
    });
  });

  it('counts failed axe scans as violations', () => {
    const failing = structuredClone(inputs);
    failing.playwright.suites[0].suites![0].specs[0].tests[1].status = 'unexpected';
    expect(buildQualityReport(failing).a11y).toEqual({ scans: 2, violations: 1 });
  });

  it('does not call a CSP with inline scripts strict', () => {
    const loose = structuredClone(inputs);
    loose.firebase.hosting.headers[0].headers[0].value = "script-src 'self' 'unsafe-inline'";
    expect(buildQualityReport(loose).security.strictCsp).toBe(false);
  });

  it('refuses to report Lighthouse for a page that was not measured', () => {
    expect(() => buildQualityReport({ ...inputs, lighthouse: [lhr('/contact', 0.9)] })).toThrow(/\/about/);
  });
});

describe('readInputs', () => {
  it('names every missing report instead of writing a partial one', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-'));
    try {
      expect(() => readInputs(empty)).toThrow(/reports\/vitest\.json.*\.lighthouseci/);
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  it('reads the reports from a CI workspace', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'quality-'));
    try {
      const write = (file: string, data: unknown) => {
        fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
        fs.writeFileSync(path.join(root, file), JSON.stringify(data));
      };
      write('reports/vitest.json', inputs.vitest);
      write('coverage/coverage-summary.json', inputs.coverage);
      write('reports/playwright.json', inputs.playwright);
      write('reports/audit.json', inputs.audit);
      write('firebase.json', inputs.firebase);
      write('dist/version.json', inputs.version);
      write('.lighthouseci/lhr-1.json', inputs.lighthouse[0]);
      expect(buildQualityReport(readInputs(root)).lighthouse.performance).toBe(93);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
