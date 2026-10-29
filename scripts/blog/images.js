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
  [/\s(?:xlink:)?href\s*=\s*["'](?!#)/i, 'a reference outside the file'],
];

function checkSvg(text, file) {
  const unsafe = UNSAFE_SVG.find(([pattern]) => pattern.test(text));
  if (unsafe) throw new Error(`${file}: an SVG in a post may not contain ${unsafe[1]}`);
  if (!/<svg\b[^>]*\s(?:viewBox|width)\s*=/i.test(text)) {
    throw new Error(`${file}: has no size (an SVG needs a viewBox or width and height)`);
  }
}

async function emitImage(distDir, contentDir, slug, name) {
  const file = `blog/content/${slug}/${name}`;
  const bytes = fs.readFileSync(path.join(contentDir, slug, name));
  const ext = POST_IMAGE.exec(name)[1];
  if (ext === 'svg') checkSvg(bytes.toString('utf8'), file);
  let size;
  try {
    size = await sharp(bytes).metadata();
  } catch (error) {
    throw new Error(`${file}: not a readable image (${error.message})`);
  }
  if (!size.width || !size.height) {
    throw new Error(`${file}: has no size (an SVG needs a viewBox or width and height)`);
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
