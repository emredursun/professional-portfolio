#!/usr/bin/env node

/**
 * Builds the Field Notes blog: one static HTML file per post.
 *
 * Runs in postbuild, after `vite build` has produced the blog's hashed CSS,
 * fonts and client script (the second entry in vite.config.ts) and after
 * prerender-routes, which never touches dist/blog. Pages are written to
 * dist/blog/<slug>.html; Firebase's cleanUrls serves them at /blog/<slug>,
 * and because firebase.json has no rewrite for /blog, any other blog path
 * gets the real 404 page. docs/adr/0001-static-blog-build.md has the why.
 *
 * Output depends only on the content and the Vite manifest: no clock, no
 * file-system listing order, no platform path separators.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { emitAsset } from './blog/assets.js';
import { BLOG_LAUNCHED } from './blog/config.js';
import { loadPosts } from './blog/content.js';
import { createHighlight } from './blog/highlight.js';
import { readBlogAssets } from './blog/manifest.js';
import { renderMarkdown } from './blog/markdown.js';
import { renderArticlePage } from './blog/templates/article.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// The reading font's regular Latin woff2, the one the first paragraph needs.
const LCP_FONT = /\/newsreader-latin-400-normal-[\w-]+\.woff2$/;

/** Writes inside dist/blog only; a slug is validated, this is the second guard. */
export function writePage(distDir, slug, html) {
  const blogDir = path.join(distDir, 'blog');
  const target = path.resolve(blogDir, `${slug}.html`);
  if (path.dirname(target) !== path.resolve(blogDir)) {
    throw new Error(`blog: refusing to write outside dist/blog (${slug})`);
  }
  fs.mkdirSync(blogDir, { recursive: true });
  fs.writeFileSync(target, html, 'utf8');
  return `blog/${slug}.html`;
}

/**
 * @param {{ distDir: string, contentDir: string, themeInitPath: string, launched?: boolean }} options
 * @returns {Promise<string[]>} Written pages, relative to distDir, POSIX paths.
 */
export async function buildBlog({ distDir, contentDir, themeInitPath, launched = BLOG_LAUNCHED }) {
  const posts = loadPosts(contentDir);
  if (posts.length === 0) return [];

  const vite = readBlogAssets(distDir);
  const { highlight, css } = await createHighlight();
  const rendered = posts.map((post) => ({
    ...post,
    ...renderMarkdown(post.body, { file: post.file, highlight }),
  }));

  const codeRules = css();
  const assets = Object.freeze({
    ...vite,
    themeInit: emitAsset(distDir, 'theme-init', 'js', fs.readFileSync(themeInitPath, 'utf8')),
    codeCss: codeRules ? emitAsset(distDir, 'code', 'css', codeRules) : undefined,
    fontPreload: vite.fonts.find((font) => LCP_FONT.test(font)),
  });

  return rendered.map((post) =>
    writePage(distDir, post.slug, renderArticlePage({ post, assets, launched })),
  );
}

/**
 * Command-line entry: builds from the repository's folders and reports.
 * @param {string} [root]  Repository root; tests pass a temporary one.
 * @returns {Promise<number>} The process exit code.
 */
export async function main(root = ROOT) {
  try {
    const written = await buildBlog({
      distDir: path.join(root, 'dist'),
      contentDir: path.join(root, 'blog', 'content'),
      themeInitPath: path.join(root, 'blog', 'client', 'theme-init.js'),
    });
    process.stdout.write(
      `blog: ${written.length} page(s)${written.map((f) => `\n  ${f}`).join('')}\n`,
    );
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
