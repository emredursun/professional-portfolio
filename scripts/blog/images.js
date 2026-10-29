/**
 * Images inside posts. Each lives next to the post's Markdown files
 * (blog/content/<slug>/chart.svg), so every language version shares it and
 * refers to it by its bare name: ![A chart](chart.svg).
 *
 * The build copies each one into /assets/ under a content hash (immutable
 * caching, like the link-preview cards) and measures it, so the page can
 * reserve its space and nothing shifts while it loads. An SVG is the site's
 * own content but is still checked: no scripts, event handlers, embedded HTML
 * or references outside the file, which a later edit could slip in.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { emitAsset } from './assets.js';

/** A file a post may show: a bare, lowercase-with-dashes name and a web image type. */
export const POST_IMAGE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(svg|png|jpg|webp)$/;

const UNSAFE_SVG = [
  [/<script\b/i, 'a script'],
  [/\son[a-z]+\s*=/i, 'an event handler'],
  [/<foreignObject\b/i, 'embedded HTML'],
  // Any namespace prefix, not only xlink: (xmlns:l="…xlink" makes l:href a link).
  [/\s(?:[\w-]+:)?href\s*=\s*["'](?!#)/i, 'a reference outside the file'],
  [/url\(\s*["']?(?!#)/i, 'a reference outside the file'],
  [/@import\b/i, 'a stylesheet import'],
  [/attributeName\s*=\s*["'](?:[\w-]+:)?href/i, 'an animated link'],
  [/<!(?:DOCTYPE|ENTITY)\b/i, 'a DOCTYPE or entity'],
];
const NO_SIZE = 'has no size (an SVG needs a viewBox or width and height)';
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

/** The SVG as text, if it is plain UTF-8: anything else would slip past the checks. */
function svgText(bytes) {
  const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  if (text.startsWith(BYTE_ORDER_MARK) || text.includes('\0')) throw new Error('not plain');
  return text;
}

function checkSvg(bytes, file) {
  let text;
  try {
    text = svgText(bytes);
  } catch {
    throw new Error(`${file}: an SVG in a post must be plain UTF-8 text`);
  }
  const unsafe = UNSAFE_SVG.find(([pattern]) => pattern.test(text));
  if (unsafe) throw new Error(`${file}: an SVG in a post may not contain ${unsafe[1]}`);
  if (!/<svg\b[^>]*\s(?:viewBox|width)\s*=/i.test(text)) throw new Error(`${file}: ${NO_SIZE}`);
}

async function emitImage(distDir, contentDir, slug, name) {
  const file = `blog/content/${slug}/${name}`;
  const source = path.join(contentDir, slug, name);
  // A link could pull in a file from outside the repository.
  if (!fs.lstatSync(source).isFile()) throw new Error(`${file}: not a regular file`);
  const bytes = fs.readFileSync(source);
  const ext = POST_IMAGE.exec(name)[1];
  if (ext === 'svg') checkSvg(bytes, file);
  let size;
  try {
    size = await sharp(bytes).metadata();
  } catch (error) {
    throw new Error(`${file}: not a readable image (${error.message})`);
  }
  if (!size.width || !size.height) {
    throw new Error(`${file}: ${NO_SIZE}`);
  }
  const base = name.slice(0, -(ext.length + 1));
  return {
    src: emitAsset(distDir, `img-${slug}-${base}`, ext, bytes),
    width: size.width,
    height: size.height,
  };
}

/**
 * @param {{ distDir: string, contentDir: string, slugs: string[] }} options
 * @returns {Promise<Map<string, { src: string, width: number, height: number }>>}
 *   Keyed by "<slug>/<name>".
 */
export async function emitPostImages({ distDir, contentDir, slugs }) {
  const found = [...new Set(slugs)].flatMap((slug) =>
    fs
      .readdirSync(path.join(contentDir, slug))
      .filter((name) => POST_IMAGE.test(name))
      .sort()
      .map((name) => [slug, name]),
  );
  const images = await Promise.all(
    found.map(async ([slug, name]) => [
      `${slug}/${name}`,
      await emitImage(distDir, contentDir, slug, name),
    ]),
  );
  return new Map(images);
}
