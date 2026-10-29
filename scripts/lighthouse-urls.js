#!/usr/bin/env node

/**
 * The URLs Lighthouse measures in CI: the portfolio pages from a
 * lighthouserc file, plus blog pages picked from what the build wrote.
 *
 *   npx lhci autorun --config=lighthouserc.mobile.json \
 *     $(node scripts/lighthouse-urls.js lighthouserc.mobile.json)
 *
 * The blog's pages come from dist, never a fixed list, so CI keeps working
 * when the sample posts are replaced by real ones, or a language or the Now
 * page is missing. Per language: the index, one post, and the Now page in
 * English, as before (the blog budget in the config applies to all of them).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const POST_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/;

/** The first post a language's blog folder holds (sorted, so stable). */
function firstPost(distDir, prefix) {
  const dir = path.join(distDir, `${prefix}blog`);
  if (!fs.existsSync(dir)) return undefined;
  // Only files named like a post slug: the output goes unquoted into a
  // shell command line, so nothing else may reach it.
  const name = fs
    .readdirSync(dir)
    .filter((file) => POST_FILE.test(file) && file !== 'now.html')
    .sort()[0];
  return name && `/${prefix}blog/${name.slice(0, -'.html'.length)}`;
}

/**
 * @param {{ config: { ci: { collect: { url: string[] } } }, distDir: string }} options
 * @returns {string[]}
 */
export function lighthouseUrls({ config, distDir }) {
  const portfolio = config.ci.collect.url.filter((url) => !url.includes('/blog'));
  const origin = new URL(portfolio[0]).origin;
  if (!fs.existsSync(path.join(distDir, 'blog.html'))) {
    throw new Error('lighthouse-urls: no dist/blog.html; build first');
  }
  const has = (file) => fs.existsSync(path.join(distDir, file));
  const blog = [
    '/blog',
    firstPost(distDir, ''),
    has('blog/now.html') && '/blog/now',
    has('tr/blog.html') && '/tr/blog',
    firstPost(distDir, 'tr/'),
    firstPost(distDir, 'nl/'),
  ].filter(Boolean);
  return [...portfolio, ...blog.map((page) => `${origin}${page}`)];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const configFile = process.argv[2] ?? 'lighthouserc.json';
    const config = JSON.parse(fs.readFileSync(path.join(ROOT, configFile), 'utf8'));
    const urls = lighthouseUrls({ config, distDir: path.join(ROOT, 'dist') });
    // One lhci flag per URL; they replace the config's list for this run.
    process.stdout.write(`${urls.map((url) => `--collect.url=${url}`).join(' ')}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
