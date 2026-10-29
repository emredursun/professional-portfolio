#!/usr/bin/env node

/**
 * Builds the Field Notes blog: one static HTML file per post and language.
 *
 * Runs in postbuild, after `vite build` has produced the blog's hashed CSS,
 * fonts and client script (the second entry in vite.config.ts) and after
 * prerender-routes, which never touches the blog's files. English pages are
 * written to dist/blog/<slug>.html, Turkish and Dutch ones to
 * dist/tr/blog/<slug>.html and dist/nl/blog/<slug>.html. Firebase's cleanUrls
 * serves them at /blog/<slug> and /tr/blog/<slug>, and because firebase.json
 * has no rewrite for those paths, any other blog path gets the real 404 page.
 * docs/adr/0001-static-blog-build.md has the why.
 *
 * Output depends only on the content and the Vite manifest: no clock, no
 * file-system listing order, no platform path separators.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { emitAsset } from './blog/assets.js';
import { ogCards, readOgImages } from './blog/og.js';
import { BLOG_LAUNCHED } from './blog/config.js';
import { loadPosts } from './blog/content.js';
import { loadNow } from './blog/now.js';
import { createHighlight } from './blog/highlight.js';
import { readBlogAssets } from './blog/manifest.js';
import { renderMarkdown } from './blog/markdown.js';
import { renderFeed } from './blog/feed.js';
import { TOPICS } from './blog/schema.js';
import { BLOG_LANGUAGES } from './blog/strings.js';
import { renderArticlePage } from './blog/templates/article.js';
import { byNewest, outputDir } from './blog/templates/format.js';
import { renderIndexPage } from './blog/templates/index.js';
import { renderTopicPage } from './blog/templates/topic.js';
import { renderNowPage } from './blog/templates/now.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// The woff2 of each face a page's largest text uses (measured with
// Lighthouse: the index's intro paragraph is Newsreader, an article's title
// Bricolage). Each page preloads the one its LCP element needs; Turkish pages
// also preload the extended Latin file, which holds ğ, ş and İ.
const PRELOAD_FONTS = {
  reading: /\/newsreader-latin-400-normal-[\w-]+\.woff2$/,
  display: /\/bricolage-grotesque-latin-wght-normal-[\w-]+\.woff2$/,
  readingExt: /\/newsreader-latin-ext-400-normal-[\w-]+\.woff2$/,
  displayExt: /\/bricolage-grotesque-latin-ext-wght-normal-[\w-]+\.woff2$/,
};

// The only files the blog writes, for each language prefix ('', tr/, nl/):
// blog.html, blog/<slug>.html, blog/feed.xml and blog/topic/<topic>.html.
const NAME = '[a-z0-9]+(?:-[a-z0-9]+)*';
const OUTPUT = new RegExp(
  `^(?:(?:tr|nl)/)?blog(?:\\.html|/${NAME}\\.html|/feed\\.xml|/topic/${NAME}\\.html)$`,
);

/**
 * Writes one blog file. Slugs are validated when posts load; this is the
 * second guard, so nothing can land outside the blog's files whatever the input.
 * @param {string} distDir
 * @param {string} file     POSIX path relative to distDir.
 * @param {string} content
 * @returns {string} file
 */
export function writeOutput(distDir, file, content) {
  const target = path.resolve(distDir, file);
  if (!OUTPUT.test(file) || !target.startsWith(path.resolve(distDir) + path.sep)) {
    throw new Error(`blog: refusing to write "${file}" (only the blog's pages and feeds)`);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  return file;
}

/** The two newest other posts in the same language, for the end of an article. */
function relatedTo(post, posts) {
  return [...posts]
    .sort(byNewest)
    .filter((other) => other.lang === post.lang && other.slug !== post.slug)
    .slice(0, 2);
}

async function prepareAssets(distDir, themeInitPath, codeCss) {
  const vite = readBlogAssets(distDir);
  const codeRules = codeCss();
  return Object.freeze({
    ...vite,
    themeInit: emitAsset(distDir, 'theme-init', 'js', fs.readFileSync(themeInitPath, 'utf8')),
    codeCss: codeRules ? emitAsset(distDir, 'code', 'css', codeRules) : undefined,
    preload: Object.fromEntries(
      Object.entries(PRELOAD_FONTS).map(([face, pattern]) => [
        face,
        vite.fonts.find((font) => pattern.test(font)),
      ]),
    ),
  });
}

/** English posts that have no version in `lang` yet. */
function untranslated(lang, all) {
  if (lang === 'en') return [];
  return all.filter((post) => post.lang === 'en' && !post.translations.includes(lang));
}

/** The topics that have posts, and so a topic page, in `lang`. */
function topicsIn(lang, all) {
  return new Set(all.filter((post) => post.lang === lang).map((post) => post.topic));
}

/**
 * One page per topic that has posts in `lang`. Its alternates are the
 * languages that have the same topic page; English always does, because
 * every post has an English version on the same topic (content.js).
 */
function writeTopics({ distDir, lang, posts, all, fallback, assets, launched }) {
  const dir = `${outputDir(lang)}blog/topic`;
  const topics = topicsIn(lang, all);
  return TOPICS.filter((topic) => topics.has(topic)).map((topic) =>
    writeOutput(
      distDir,
      `${dir}/${topic}.html`,
      renderTopicPage({
        topic,
        posts: posts.filter((post) => post.topic === topic),
        fallback: fallback.filter((post) => post.topic === topic),
        assets,
        launched,
        lang,
        languages: BLOG_LANGUAGES.filter((language) => topicsIn(language, all).has(topic)),
        topics,
      }),
    ),
  );
}

/**
 * Copies every committed link-preview card into /assets/ under a content
 * hash (immutable caching), after checking each is current.
 * @returns {Record<string, string>} Card id to its /assets/ path.
 */
function emitOgImages(distDir, ogDir, cards) {
  const images = readOgImages({ ogDir, cards });
  return Object.fromEntries(
    cards.map((card) => [
      card.id,
      emitAsset(
        distDir,
        `og-${card.id.replace(/^_/, '').replace('.', '-')}`,
        'png',
        images.get(card.id),
      ),
    ]),
  );
}

/** One language's files: its index, its feed after launch, its articles and topic pages. */
function writeLanguage({ distDir, lang, posts, all, languages, now, assets, launched }) {
  const dir = `${outputDir(lang)}blog`;
  const fallback = untranslated(lang, all);
  return [
    writeOutput(
      distDir,
      `${dir}.html`,
      renderIndexPage({
        posts,
        fallback,
        topics: topicsIn(lang, all),
        now: now[lang],
        assets,
        launched,
        lang,
        languages,
      }),
    ),
    ...(now[lang]
      ? [
          writeOutput(
            distDir,
            `${dir}/now.html`,
            renderNowPage({
              entries: now[lang],
              assets,
              launched,
              lang,
              languages: languages.filter((language) => now[language]),
            }),
          ),
        ]
      : []),
    // The feed only after launch: noindex cannot reach XML (see head.js).
    ...(launched ? [writeOutput(distDir, `${dir}/feed.xml`, renderFeed(posts, lang))] : []),
    ...posts.map((post) =>
      writeOutput(
        distDir,
        `${dir}/${post.slug}.html`,
        renderArticlePage({ post, related: relatedTo(post, all), assets, launched }),
      ),
    ),
    ...writeTopics({ distDir, lang, posts, all, fallback, assets, launched }),
  ];
}

/**
 * @param {{ distDir: string, contentDir: string, nowDir?: string, ogDir?: string, themeInitPath: string, launched?: boolean }} options
 *   `ogDir`: the committed link-preview images (blog/og). Every published post
 *   then needs a current card or the build fails; without it (unit tests) all
 *   pages use the site's own image.
 * @returns {Promise<string[]>} Written files, relative to distDir, POSIX paths.
 */
export async function buildBlog({
  distDir,
  contentDir,
  nowDir,
  ogDir,
  themeInitPath,
  launched = BLOG_LAUNCHED,
}) {
  const posts = loadPosts(contentDir);
  if (posts.length === 0) return [];
  const now = loadNow(nowDir);

  const { highlight, css } = await createHighlight();
  const rendered = posts.map((post) => ({
    ...post,
    ...renderMarkdown(post.body, { file: post.file, highlight }),
  }));
  const languages = BLOG_LANGUAGES.filter((lang) => rendered.some((post) => post.lang === lang));
  const assets = Object.freeze({
    ...(await prepareAssets(distDir, themeInitPath, css)),
    og: ogDir ? emitOgImages(distDir, ogDir, ogCards(rendered, languages)) : {},
  });
  return languages.flatMap((lang) =>
    writeLanguage({
      distDir,
      lang,
      posts: rendered.filter((post) => post.lang === lang),
      all: rendered,
      languages,
      now,
      assets,
      launched,
    }),
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
      nowDir: path.join(root, 'blog', 'now'),
      ogDir: path.join(root, 'blog', 'og'),
      themeInitPath: path.join(root, 'blog', 'client', 'theme-init.js'),
    });
    process.stdout.write(
      `blog: ${written.length} file(s)${written.map((f) => `\n  ${f}`).join('')}\n`,
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
