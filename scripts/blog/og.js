/**
 * Link-preview images: one card per post and language, and one per
 * language for the blog's other pages.
 *
 * They are rendered while writing (`npm run blog:og`), in a local browser
 * with the site's own fonts, and committed to blog/og/. The build never
 * renders them: it checks that every card exists and is current, then copies
 * it into /assets/ under a content hash. That keeps deploys byte-identical
 * and the build free of a browser.
 *
 * "Current" means the hash in blog/og/manifest.json matches the card's
 * inputs: its text, the language's strings, the template files and the font
 * versions. A change to any of them marks the card stale and fails the build
 * until the images are rendered again.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OG_SIZE } from './config.js';
import { strings } from './strings.js';

export { OG_SIZE };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const MANIFEST = 'manifest.json';

// Everything the card's look depends on besides its text.
const TEMPLATE_FILES = ['templates/og-card.js', 'templates/status.js', 'templates/mark.js'];
const FONT_PACKAGES = ['@fontsource-variable/bricolage-grotesque', '@fontsource/newsreader'];

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Computed once per process: the template sources and the font versions. */
const DESIGN_KEY = sha256(
  JSON.stringify({
    // LF only, so a Windows checkout with CRLF would hash the same as CI.
    templates: TEMPLATE_FILES.map((file) =>
      fs.readFileSync(path.join(HERE, file), 'utf8').split('\r\n').join('\n'),
    ),
    fonts: FONT_PACKAGES.map(
      (name) =>
        JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8'))
          .version,
    ),
  }),
);

/**
 * The cards the blog needs: one per published post, one per language.
 * @param {object[]} posts      Published posts (drafts already removed).
 * @param {string[]} languages  Languages that have a blog.
 * @returns {{ id: string, kind: 'post' | 'site', lang: string, title: string, status?: string, topic?: string }[]}
 */
export function ogCards(posts, languages) {
  return [
    ...posts.map((post) => ({
      id: `${post.slug}.${post.lang}`,
      kind: 'post',
      lang: post.lang,
      title: post.title,
      status: post.status,
      topic: post.topic,
    })),
    ...languages.map((lang) => ({
      id: `_site.${lang}`,
      kind: 'site',
      lang,
      title: strings(lang).tagline,
    })),
  ];
}

/** The hash a committed card must carry to count as current. */
export function ogHash(card) {
  const { id, ...content } = card;
  return sha256(JSON.stringify({ id, content, strings: strings(card.lang), design: DESIGN_KEY }));
}

function readManifest(ogDir) {
  const file = path.join(ogDir, MANIFEST);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * The committed card for every id, or a build error naming every card that
 * is missing or out of date.
 * @param {{ ogDir: string, cards: ReturnType<typeof ogCards> }} options
 * @returns {Map<string, Buffer>}
 */
export function readOgImages({ ogDir, cards }) {
  const manifest = readManifest(ogDir);
  const problems = cards.filter(
    (card) =>
      manifest[card.id] !== ogHash(card) || !fs.existsSync(path.join(ogDir, `${card.id}.png`)),
  );
  if (problems.length > 0) {
    throw new Error(
      `blog: link-preview images missing or out of date: ${problems.map((card) => card.id).join(', ')}. Run \`npm run blog:og\`.`,
    );
  }
  return new Map(
    cards.map((card) => [card.id, fs.readFileSync(path.join(ogDir, `${card.id}.png`))]),
  );
}

/**
 * Brings blog/og/ in line with `cards`: renders the missing and stale ones
 * with `render(card)`, removes images no card needs, and rewrites the
 * manifest (sorted, so it diffs cleanly).
 * @param {{ ogDir: string, cards: ReturnType<typeof ogCards>, render: (card: ReturnType<typeof ogCards>[number]) => Promise<Buffer> }} options
 * @returns {Promise<{ rendered: string[], removed: string[] }>}
 */
export async function syncOgImages({ ogDir, cards, render }) {
  fs.mkdirSync(ogDir, { recursive: true });
  const manifest = readManifest(ogDir);
  const wanted = new Set(cards.map((card) => card.id));
  const rendered = [];
  for (const card of cards) {
    const file = path.join(ogDir, `${card.id}.png`);
    if (manifest[card.id] === ogHash(card) && fs.existsSync(file)) continue;
    fs.writeFileSync(file, await render(card));
    rendered.push(card.id);
  }
  const removed = fs
    .readdirSync(ogDir)
    .filter((name) => name.endsWith('.png') && !wanted.has(name.slice(0, -'.png'.length)))
    .sort();
  removed.forEach((name) => fs.rmSync(path.join(ogDir, name)));
  const next = Object.fromEntries(
    [...cards].sort((a, b) => (a.id < b.id ? -1 : 1)).map((card) => [card.id, ogHash(card)]),
  );
  fs.writeFileSync(path.join(ogDir, MANIFEST), `${JSON.stringify(next, null, 2)}\n`);
  return { rendered, removed: removed.map((name) => name.slice(0, -'.png'.length)) };
}
