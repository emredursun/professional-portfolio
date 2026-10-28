/**
 * Loads blog posts from blog/content/<slug>/<lang>.md.
 *
 * The folder name is the slug and the file name the language, so neither is
 * repeated in the frontmatter and the two can never disagree. Folders and
 * files are read in sorted order so the build output never depends on the
 * file system's listing order. Drafts are dropped here, before anything is
 * rendered or written.
 */

import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from './frontmatter.js';
import { validatePost } from './schema.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Phase 1 publishes English only; Turkish and Dutch arrive with the translations.
const LANGUAGES = new Set(['en']);
const WORDS_PER_MINUTE = 220;

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Reading time from prose only: code is skimmed, not read. */
function readingMinutes(body) {
  // A fence is three or more backticks or tildes, closed by the same run.
  const prose = body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** @param {string} dir  Absolute path of the post folder. */
function readPostFolder(dir) {
  const slug = path.basename(dir);
  if (!SLUG.test(slug)) {
    throw new Error(`blog: "${slug}" is not a valid post folder name (use lowercase-with-dashes)`);
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort(byName)
    .map((name) => {
      const file = `blog/content/${slug}/${name}`;
      const lang = name.slice(0, -'.md'.length);
      if (!LANGUAGES.has(lang)) throw new Error(`${file}: only English (en.md) posts for now`);
      const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'), file);
      return Object.freeze({
        ...validatePost(data, file),
        slug,
        lang,
        file,
        body,
        minutes: readingMinutes(body),
      });
    });
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
    .flatMap((name) => readPostFolder(path.join(contentDir, name)))
    .filter((post) => !post.draft);
}
