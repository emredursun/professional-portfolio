#!/usr/bin/env node

/**
 * Renders the blog's link-preview cards: `npm run blog:og`.
 *
 * Run it after writing or changing a post (the build tells you when): it
 * renders every missing or stale card in a local Chromium with the site's own
 * fonts, writes blog/og/<id>.png and blog/og/manifest.json, and removes cards
 * no post needs. Commit the result. The build only checks and copies these
 * files (scripts/blog/og.js), so it never needs a browser.
 *
 * Needs Playwright's Chromium (`npx playwright install chromium`), like
 * generate-cv.js.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import sharp from 'sharp';
import { loadPosts } from './blog/content.js';
import { OG_SIZE, ogCards, syncOgImages } from './blog/og.js';
import { BLOG_LANGUAGES } from './blog/strings.js';
import { renderOgCard } from './blog/templates/og-card.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// The same @font-face rules the blog ships, so cards match the site.
const FONT_STYLESHEETS = [
  '@fontsource-variable/bricolage-grotesque/wght.css',
  '@fontsource/newsreader/400.css',
];

/**
 * The Fontsource stylesheets with each woff2 inlined as a data URI (and the
 * woff fallbacks dropped), so the card renders without any file access.
 * @param {string} root
 */
function fontCss(root = ROOT) {
  return FONT_STYLESHEETS.map((sheet) => {
    const file = path.join(root, 'node_modules', sheet);
    const dir = path.dirname(file);
    return fs
      .readFileSync(file, 'utf8')
      .replace(/,\s*url\(\.\/files\/[^)]+\.woff\)\s*format\('woff'\)/g, '')
      .replace(/url\(\.\/files\/([^)]+\.woff2)\)/g, (_, name) => {
        const data = fs.readFileSync(path.join(dir, 'files', name)).toString('base64');
        return `url(data:font/woff2;base64,${data})`;
      });
  }).join('\n');
}

async function main(root = ROOT) {
  const posts = loadPosts(path.join(root, 'blog', 'content'));
  const languages = BLOG_LANGUAGES.filter((lang) => posts.some((post) => post.lang === lang));
  const css = fontCss(root);
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: OG_SIZE, deviceScaleFactor: 1 });
    const render = async (card) => {
      await page.setContent(renderOgCard({ card, fontCss: css }), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const shot = await page.screenshot({ type: 'png' });
      return sharp(shot)
        .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
        .toBuffer();
    };
    const { rendered, removed } = await syncOgImages({
      ogDir: path.join(root, 'blog', 'og'),
      cards: ogCards(posts, languages),
      render,
    });
    process.stdout.write(
      `blog:og rendered ${rendered.length} (${rendered.join(', ') || 'none'}), removed ${removed.length}\n`,
    );
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
