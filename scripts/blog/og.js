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
const MAX_BYTES = 150 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// Only files named like a card are the generator's to remove.
const CARD_FILE = /^(?:_site|[a-z0-9]+(?:-[a-z0-9]+)*)\.[a-z]{2}\.png$/;

// Everything the card's look depends on besides its text: the template and
// what it renders, the renderer (fonts, size, compression) and the size.
const DESIGN_FILES = [
  'templates/og-card.js',
  'templates/status.js',
  'templates/mark.js',
  'html.js',
  'config.js',
  '../blog-og.js',
];
const FONT_PACKAGES = ['@fontsource-variable/bricolage-grotesque'];

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fontVersion(name) {
  const file = path.join(ROOT, 'node_modules', name, 'package.json');
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).version;
  } catch {
    throw new Error(`blog: cannot read ${name}'s version (${file}); run npm ci`);
  }
}

let designKey;
/** The design files' sources and the font versions, read once and only when needed. */
function design() {
  designKey ??= sha256(
    JSON.stringify({
      // LF only, so a Windows checkout with CRLF would hash the same as CI.
      files: DESIGN_FILES.map((file) =>
        fs.readFileSync(path.join(HERE, file), 'utf8').split('\r\n').join('\n'),
      ),
      fonts: FONT_PACKAGES.map(fontVersion),
    }),
  );
  return designKey;
}

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

/** The hash of what a card shows; the manifest must carry it for the card to be current. */
export function ogHash(card) {
  const { id, ...content } = card;
  return sha256(JSON.stringify({ id, content, strings: strings(card.lang), design: design() }));
}

function readManifest(ogDir) {
  const file = path.join(ogDir, MANIFEST);
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw new Error('blog: blog/og/manifest.json is not valid JSON; run `npm run blog:og`');
  }
}

/** Why a committed card cannot ship, or '' when it can. */
function pngProblem(png) {
  if (png.length < 24 || !png.subarray(0, 8).equals(PNG_SIGNATURE)) return 'not a PNG';
  // IHDR, the first chunk: width and height as big-endian 32-bit integers.
  const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  if (width !== OG_SIZE.width || height !== OG_SIZE.height) {
    return `${width} × ${height}, not ${OG_SIZE.width} × ${OG_SIZE.height}`;
  }
  return png.length > MAX_BYTES ? `${Math.round(png.length / 1024)} KB, over 150 KB` : '';
}

/**
 * The committed card for every id, or a build error naming every card that
 * is missing, out of date, replaced by hand or not a 1200 × 630 PNG.
 * @param {{ ogDir: string, cards: ReturnType<typeof ogCards> }} options
 * @returns {Map<string, Buffer>}
 */
export function readOgImages({ ogDir, cards }) {
  const manifest = readManifest(ogDir);
  const images = new Map();
  const problems = [];
  for (const card of cards) {
    const file = path.join(ogDir, `${card.id}.png`);
    const entry = manifest[card.id];
    if (!fs.existsSync(file) || entry?.card !== ogHash(card)) {
      problems.push(`${card.id} (missing or out of date)`);
      continue;
    }
    const png = fs.readFileSync(file);
    const problem = entry.png === sha256(png) ? pngProblem(png) : 'not the rendered image';
    if (problem) problems.push(`${card.id} (${problem})`);
    else images.set(card.id, png);
  }
  if (problems.length > 0) {
    throw new Error(
      `blog: link-preview images to fix: ${problems.join(', ')}. Run \`npm run blog:og\`.`,
    );
  }
  return images;
}

/**
 * Brings blog/og/ in line with `cards`: renders the missing and stale ones
 * with `render(card)`, removes card files no card needs, and rewrites the
 * manifest (sorted, so it diffs cleanly) with each card's text hash and the
 * hash of its PNG.
 * @param {{ ogDir: string, cards: ReturnType<typeof ogCards>, render: (card: ReturnType<typeof ogCards>[number]) => Promise<Buffer> }} options
 * @returns {Promise<{ rendered: string[], removed: string[] }>}
 */
export async function syncOgImages({ ogDir, cards, render }) {
  fs.mkdirSync(ogDir, { recursive: true });
  const manifest = readManifest(ogDir);
  const wanted = new Set(cards.map((card) => card.id));
  const rendered = [];
  const next = {};
  for (const card of [...cards].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const file = path.join(ogDir, `${card.id}.png`);
    const entry = manifest[card.id];
    const current =
      entry?.card === ogHash(card) &&
      fs.existsSync(file) &&
      entry.png === sha256(fs.readFileSync(file));
    if (!current) {
      fs.writeFileSync(file, await render(card));
      rendered.push(card.id);
    }
    next[card.id] = { card: ogHash(card), png: sha256(fs.readFileSync(file)) };
  }
  const removed = fs
    .readdirSync(ogDir)
    .filter((name) => CARD_FILE.test(name) && !wanted.has(name.slice(0, -'.png'.length)))
    .sort();
  removed.forEach((name) => fs.rmSync(path.join(ogDir, name)));
  fs.writeFileSync(path.join(ogDir, MANIFEST), `${JSON.stringify(next, null, 2)}\n`);
  const order = cards.map((card) => card.id);
  return {
    rendered: rendered.sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    removed: removed.map((name) => name.slice(0, -'.png'.length)),
  };
}
