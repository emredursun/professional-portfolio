/**
 * Finds the blog's hashed client files in Vite's build manifest.
 *
 * The blog's CSS, fonts and small script go through the normal Vite build as
 * a second entry (vite.config.ts), so they get content-hashed names and the
 * immutable cache headers /assets/** already has. The manifest maps the entry
 * to those names. It lives in dist/.vite/, which firebase.json never deploys.
 *
 * The blog entry must not import shared chunks: if it did, an article page
 * would download part of the portfolio's React bundle.
 */

import fs from 'fs';
import path from 'path';

export const BLOG_ENTRY = 'blog/client/article.ts';
const FONT = /\.(woff2?|ttf|otf)$/i;

/** @param {string} file */
function toUrl(file) {
  if (!/^assets\/[\w.-]+$/.test(file)) {
    throw new Error(`blog: unexpected asset path "${file}" (expected assets/<file>)`);
  }
  return `/${file}`;
}

/**
 * @param {string} distDir
 * @returns {{ script: string, styles: string[], fonts: string[] }}
 */
export function readBlogAssets(distDir) {
  const manifestPath = path.join(distDir, '.vite', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`blog: ${manifestPath} not found; run vite build first`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entry = manifest[BLOG_ENTRY];
  if (!entry) throw new Error(`blog: the Vite manifest has no entry for ${BLOG_ENTRY}`);
  if ((entry.imports ?? []).length > 0) {
    throw new Error(`blog: ${BLOG_ENTRY} imports a shared chunk (${entry.imports.join(', ')})`);
  }
  return {
    script: toUrl(entry.file),
    styles: (entry.css ?? []).map(toUrl),
    fonts: (entry.assets ?? []).filter((file) => FONT.test(file)).map(toUrl),
  };
}
