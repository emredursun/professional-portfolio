#!/usr/bin/env node

/**
 * Render the CV as a PDF per language from the built site.
 *
 * The site already has a print layout (components/PrintableResume.tsx) that
 * the "Download CV" button used to open through the browser's print dialog -
 * a dialog many visitors close, and whose output depends on their browser.
 * This renders that same layout with headless Chromium after `vite build`, so
 * the button can hand out a real file that always matches the site's content.
 *
 * Output: dist/cv/Emre-Dursun-CV-<lang>.pdf. Needs a Chromium for Playwright
 * (`npx playwright install chromium`); CI installs it before this step.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4190;

/** Locale -> page that renders it. The print layout is mounted on every page. */
export const CV_PAGES = { en: '/resume', nl: '/nl/resume', tr: '/tr/resume' };

export const cvFileName = lang => `Emre-Dursun-CV-${lang}.pdf`;

async function renderPdf(context, baseUrl, lang, route, outputDir) {
    const page = await context.newPage();
    const problems = [];
    page.on('pageerror', error => problems.push(error.message));

    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    // The print layout mounts on the first idle callback; wait until it holds
    // translated text, not i18n keys or an empty shell.
    await page.locator('.print-container').waitFor({ state: 'attached', timeout: 30_000 });
    await page.waitForFunction(
        () => {
            const text = document.querySelector('.print-container')?.textContent ?? '';
            return text.includes('Emre Dursun') && !/\b(resume|common|about):/.test(text);
        },
        undefined,
        { timeout: 30_000 },
    );
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);

    if (problems.length) {
        throw new Error(`Page errors while rendering the ${lang} CV: ${problems.join('; ')}`);
    }

    const file = path.join(outputDir, cvFileName(lang));
    await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.close();
    return file;
}

export async function generateCvs({ distDir = DIST, port = PORT } = {}) {
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
        throw new Error('dist/ has no build - run `npm run build` first');
    }

    const { preview } = await import('vite');
    const { chromium } = await import('@playwright/test');

    const server = await preview({ root: ROOT, build: { outDir: distDir }, preview: { port, strictPort: true }, logLevel: 'warn' });
    const browser = await chromium.launch();
    try {
        // Reduced motion skips the intro curtain, as the e2e suite does.
        const context = await browser.newContext({ reducedMotion: 'reduce' });
        const outputDir = path.join(distDir, 'cv');
        fs.mkdirSync(outputDir, { recursive: true });

        const files = [];
        for (const [lang, route] of Object.entries(CV_PAGES)) {
            files.push(await renderPdf(context, `http://localhost:${port}`, lang, route, outputDir));
        }
        return files;
    } finally {
        await browser.close();
        await new Promise(resolve => server.httpServer.close(resolve));
    }
}

/**
 * Names of the CV PDFs missing from a build. firebase.json runs this as a
 * predeploy check: production links to the PDFs unconditionally, and without
 * them Firebase would answer with 404.html - which the button's download
 * attribute saves as "Emre-Dursun-CV-en.pdf".
 */
export function missingCvs(distDir = DIST) {
    return Object.keys(CV_PAGES)
        .map(cvFileName)
        .filter(file => !fs.existsSync(path.join(distDir, 'cv', file)));
}

async function main() {
    if (process.argv.includes('--check')) {
        const missing = missingCvs();
        if (missing.length) {
            console.error(`❌ Missing from dist/cv: ${missing.join(', ')}. Run \`npm run generate:cv\` before deploying.`);
            process.exit(1);
        }
        console.log('✅ CV PDFs present');
        return;
    }

    try {
        const files = await generateCvs();
        files.forEach(file => {
            const kb = Math.round(fs.statSync(file).size / 1024);
            console.log(`📄 ${path.relative(ROOT, file)} (${kb} KB)`);
        });
        console.log('✅ CV PDFs generated');
    } catch (error) {
        console.error('❌ Error generating CV PDFs:', error.message);
        process.exit(1);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
