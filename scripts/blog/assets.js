/**
 * Writes files the blog build generates itself (the theme bootstrap script,
 * the code-colour rules, the link-preview images, the posts' own images) into dist/assets/ under a
 * content hash, so they share the immutable caching of Vite's own assets and
 * change name when they change.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Text files take a string, images a Buffer, so neither is ever re-encoded.
const EXTENSIONS = new Map([
  ['css', 'text'],
  ['js', 'text'],
  ['png', 'binary'],
  ['svg', 'binary'],
  ['jpg', 'binary'],
  ['webp', 'binary'],
]);

/**
 * @param {string} distDir
 * @param {string} name      Short lowercase name, e.g. "code" or "og-hello-en".
 * @param {'css' | 'js' | 'png' | 'svg' | 'jpg' | 'webp'} ext
 * @param {string | Buffer} content  A string for css and js, a Buffer for images.
 * @returns {string} The URL the page should reference.
 */
export function emitAsset(distDir, name, ext, content) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`blog: invalid asset name "${name}"`);
  const kind = EXTENSIONS.get(ext);
  if (!kind) throw new Error(`blog: unsupported asset extension "${ext}"`);
  if (kind === 'binary' && !Buffer.isBuffer(content)) {
    throw new Error(`blog: a .${ext} asset takes a Buffer`);
  }
  if (kind === 'text' && typeof content !== 'string') {
    throw new Error(`blog: a .${ext} asset takes a string`);
  }
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  const file = `blog-${name}-${hash}.${ext}`;
  const dir = path.join(distDir, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
  return `/assets/${file}`;
}
