/**
 * Writes files the blog build generates itself (the theme bootstrap script,
 * the code-colour rules) into dist/assets/ under a content hash, so they share
 * the immutable caching of Vite's own assets and change name when they change.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const EXTENSIONS = new Set(['css', 'js']);

/**
 * @param {string} distDir
 * @param {string} name      Short lowercase name, e.g. "code".
 * @param {'css' | 'js'} ext
 * @param {string} content
 * @returns {string} The URL the page should reference.
 */
export function emitAsset(distDir, name, ext, content) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`blog: invalid asset name "${name}"`);
  if (!EXTENSIONS.has(ext)) throw new Error(`blog: unsupported asset extension "${ext}"`);
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
  const file = `blog-${name}-${hash}.${ext}`;
  const dir = path.join(distDir, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), content, 'utf8');
  return `/assets/${file}`;
}
