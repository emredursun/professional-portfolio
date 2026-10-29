/**
 * Loads blog posts from blog/content/<slug>/<lang>.md.
 *
 * The folder name is the slug and the file name the language, so neither is
 * repeated in the frontmatter and the two can never disagree. Folders and
 * files are read in sorted order so the build output never depends on the
 * file system's listing order. Drafts are dropped here, before anything is
 * rendered or written.
 *
 * A folder holds one post in up to three languages. English is the original
 * and required (it is the x-default); a Turkish or Dutch file is a
 * translation of it and must agree on what the post is (date, kind, topic,
 * status). Each says which English version it follows, so a page can tell
 * readers when the English has changed since.
 */

import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from './frontmatter.js';
import { validatePost } from './schema.js';
import { BLOG_LANGUAGES } from './strings.js';
import { lastChange } from './templates/format.js';

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Names the blog's own files use next to the posts: blog/feed.xml,
// blog/now.html and blog/topic/; "site" would share the asset name of the
// blog pages' own link-preview card (og-site-<lang>).
export const RESERVED_SLUGS = new Set(['feed', 'now', 'topic', 'site']);
// Turkish and Dutch words run longer than English ones, so fewer per minute.
const WORDS_PER_MINUTE = { en: 220, nl: 200, tr: 180 };
// What a translation must share with the English original. The re-check
// date too: it is the same evidence, so every version must age together.
const SHARED = {
  publishedAt: (post) => post.publishedAt,
  kind: (post) => post.kind,
  topic: (post) => post.topic,
  status: (post) => post.status,
  'evidence.recheckedAt': (post) => post.evidence.recheckedAt,
};

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Reading time from prose only: code is skimmed, not read. */
function readingMinutes(body, lang) {
  // A fence is three or more backticks or tildes, closed by the same run.
  const prose = body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE[lang]));
}

function readFile(dir, slug, name) {
  const file = `blog/content/${slug}/${name}`;
  const lang = name.slice(0, -'.md'.length);
  // Anything but <lang>.md fails, so tr.MD or nl.markdown cannot drop a
  // translation silently.
  if (!name.endsWith('.md') || !BLOG_LANGUAGES.includes(lang)) {
    throw new Error(`${file}: not a post file (use ${BLOG_LANGUAGES.join('.md, ')}.md)`);
  }
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'), file);
  return { ...validatePost(data, file), slug, lang, file, body };
}

/** Throws unless a translation agrees with its original and says which version it follows. */
function checkTranslation(post, original) {
  if (post.lang === 'en') {
    if (post.translation) throw new Error(`${post.file}: translation is only for tr.md and nl.md`);
    return;
  }
  if (!post.translation) {
    throw new Error(`${post.file}: translation is required (from, assistedByAi)`);
  }
  for (const [key, read] of Object.entries(SHARED)) {
    if (read(post) !== read(original)) {
      throw new Error(`${post.file}: ${key} must match ${original.file} (${read(original)})`);
    }
  }
  if (post.translation.from > lastChange(original)) {
    throw new Error(
      `${post.file}: translation.from is after the last change to ${original.file} (${lastChange(original)})`,
    );
  }
}

/** @param {string} dir  Absolute path of the post folder. */
function readPostFolder(dir) {
  const slug = path.basename(dir);
  if (!SLUG.test(slug)) {
    throw new Error(`blog: "${slug}" is not a valid post folder name (use lowercase-with-dashes)`);
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`blog: "${slug}" is reserved for a blog file; choose another folder name`);
  }
  const files = fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .sort(byName)
    .map((name) => readFile(dir, slug, name));

  const original = files.find((post) => post.lang === 'en');
  if (!original) {
    throw new Error(`blog/content/${slug}/en.md: missing; every post needs its English version`);
  }
  // A draft translation is still being written and may lag the English;
  // the schema checked it, the rest waits until it is published.
  files.filter((post) => !post.draft).forEach((post) => checkTranslation(post, original));
  if (original.draft) return [];

  const published = files.filter((post) => !post.draft);
  const translations = Object.freeze(
    BLOG_LANGUAGES.filter((lang) => published.some((post) => post.lang === lang)),
  );
  return published.map((post) =>
    Object.freeze({
      ...post,
      translations,
      englishIsNewer: post.lang !== 'en' && lastChange(original) > post.translation.from,
      minutes: readingMinutes(post.body, post.lang),
    }),
  );
}

/**
 * Published posts, in slug then language order.
 * @param {string} contentDir
 */
export function loadPosts(contentDir) {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(byName)
    .flatMap((name) => readPostFolder(path.join(contentDir, name)));
}
