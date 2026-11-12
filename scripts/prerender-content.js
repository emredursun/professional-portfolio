#!/usr/bin/env node
/* global document -- page.evaluate() callbacks run in the browser */

/**
 * Put each page's rendered content into its HTML file.
 *
 * Runs after scripts/prerender-routes.js (postbuild), which gave every route
 * its own file with its own <head> but the same body: the intro curtain, with
 * the content left to JavaScript. Google renders that JavaScript, but later
 * and not always; Bing, link previews and AI crawlers mostly do not. Google's
 * guidance is to serve the content in the HTML (static rendering).
 *
 * Each route is loaded in the built app (vite preview, reduced motion, so no
 * intro and no motion) at a desktop and a phone width, because the app lays
 * out differently on each (App.tsx: isMobileView below 1024 px). Both
 * snapshots go between the prerender markers in the file's #root, each in a
 * wrapper that index.css shows only at its width. The visitor sees the page at
 * once; index.tsx then waits for the translations and lets React replace it
 * with the same page, live.
 *
 * Needs Playwright's Chromium (`npx playwright install chromium`).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadConstants } from './lib/load-constants.js';
import { listRoutes } from './generate-sitemap.js';
import { LANGUAGES } from './lib/route-meta.js';
import { outputFileFor } from './prerender-routes.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4192;
const PARALLEL = 6;

/**
 * /quality keeps the app shell (the intro curtain): it reads /quality.json,
 * which CI writes after the build from the e2e and Lighthouse results. A
 * snapshot would say "the report isn't available", which reads to Google as a
 * soft 404.
 */
const SHELL_ROUTES = ['/quality'];

/**
 * Routes whose phone layout is snapshotted too. On a phone every other page
 * scrolls past the sidebar to its content as it loads (App.tsx scrollToTop),
 * which a static page cannot do: the visitor would see the sidebar and then a
 * jump, and the hand-over leaves nothing that counts as a largest contentful
 * paint (Lighthouse NO_LCP). Those pages keep the curtain on phones; their
 * text is still in the HTML, in the desktop snapshot.
 */
const MOBILE_ROUTES = ['/about'];

export const START = '<!--prerender:start-->';
export const END = '<!--prerender:end-->';

/** The two layouts the app renders, matching App.tsx's 1024 px breakpoint. */
export const VIEWPORTS = {
  desktop: { width: 1280, height: 900 },
  mobile: { width: 390, height: 844 },
};

/**
 * @param {string} html
 * @param {{ desktop: string, mobile?: string }} snapshots
 *
 * Replace what sits between the prerender markers with the snapshots. Without
 * a phone snapshot, the phone layout keeps what was there: the intro curtain.
 */
export function injectContent(html, { desktop, mobile }) {
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('no prerender markers in #root');
  }
  // prerender-routes.js rewrites every route file from the template on each
  // build, so what sits here is always the curtain.
  const shell = html.slice(start + START.length, end);
  const body =
    `<div class="prerender-desktop">${desktop}</div>` +
    `<div class="prerender-mobile">${mobile ?? shell}</div>`;
  return html.slice(0, start + START.length) + body + html.slice(end);
}

/** The <title> of a prerendered file: the app sets the same once it is ready. */
export function titleOf(html) {
  const match = html.match(/<title>([^<]*)<\/title>/);
  if (!match) throw new Error('page has no <title>');
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function snapshot(browser, url, viewport, title) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (error) => problems.push(error.message));
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    // SEO.tsx sets the title only once every namespace has loaded, so a
    // matching title means the page shows text, not i18n keys.
    await page.waitForFunction((expected) => document.title === expected, title, {
      timeout: 30_000,
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    if (problems.length) throw new Error(problems.join('; '));
    return await page.evaluate(() => {
      const root = document.getElementById('root');
      const copy = root.cloneNode(true);
      // The print-only CV (PrintableResume) is on every page but never shown
      // on screen: as static HTML it would repeat the whole CV on all pages.
      copy.querySelectorAll('.print-container').forEach((table) => table.parentElement.remove());
      // On phones, overlays (a service panel, a project) render into <body>.
      const portals = [...document.body.children]
        .filter((el) => el !== root && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName))
        .map((el) => el.cloneNode(true));
      // The Content-Security-Policy (style-src 'self') blocks style
      // attributes in HTML, and reports each one in the console. React sets
      // them from script, where they apply; here they would only be errors.
      for (const el of [copy, ...portals]) {
        el.querySelectorAll('[style]').forEach((node) => node.removeAttribute('style'));
        // Lazy images wait for the page's scroll container, which only
        // exists once React lays the page out; in the static copy they would
        // all start loading at once (/projects: every thumbnail). They are
        // below the fold, and React puts them back when it takes over.
        el.querySelectorAll('img[loading="lazy"]').forEach((img) => {
          img.removeAttribute('src');
          img.removeAttribute('srcset');
        });
        el.removeAttribute('style');
      }
      return copy.innerHTML + portals.map((el) => el.outerHTML).join('');
    });
  } finally {
    await context.close();
  }
}

async function renderFile(browser, baseUrl, distDir, { file, urlPath, phone }) {
  const target = path.join(distDir, file);
  const html = fs.readFileSync(target, 'utf8');
  const title = titleOf(html);
  const url = `${baseUrl}${urlPath}`;
  const desktop = await snapshot(browser, url, VIEWPORTS.desktop, title);
  const mobile = phone ? await snapshot(browser, url, VIEWPORTS.mobile, title) : undefined;
  fs.writeFileSync(target, injectContent(html, { desktop, mobile }), 'utf8');
}

/**
 * @param {{ distDir?: string, port?: number }} [options]
 * @returns {Promise<string[]>} files written, relative to distDir
 */
export async function prerenderContent({ distDir = DIST, port = PORT } = {}) {
  const constants = await loadConstants();
  const routes = listRoutes(constants).filter((route) => !SHELL_ROUTES.includes(route));
  const jobs = routes.flatMap((route) =>
    LANGUAGES.map((lang) => {
      const file = outputFileFor(lang, route);
      return {
        file,
        urlPath: `/${file.replace(/\.html$/, '')}`,
        phone: MOBILE_ROUTES.includes(route),
      };
    }),
  );

  const { preview } = await import('vite');
  const { chromium } = await import('@playwright/test');
  const server = await preview({
    root: ROOT,
    build: { outDir: distDir },
    // Any free port from here up: two builds (worktrees) can run at once.
    preview: { port, strictPort: false },
    logLevel: 'warn',
  });
  const browser = await chromium.launch();
  const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, '');
  try {
    const queue = [...jobs];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          await renderFile(browser, baseUrl, distDir, job);
        } catch (error) {
          throw new Error(`${job.urlPath}: ${error.message}`);
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL }, worker));
    return jobs.map((job) => job.file);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
}

async function main() {
  try {
    const files = await prerenderContent();
    console.log(`🧱 Prerendered the content of ${files.length} pages into dist/`);
  } catch (error) {
    console.error('❌ Error prerendering page content:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
