/**
 * Evaluate constants.tsx and return its exports, for build-time scripts
 * (the sitemap and the GitHub profile README).
 *
 * The file is TSX, so it is transpiled with esbuild with a stubbed JSX factory
 * - the icon elements are irrelevant here and collapse to null. This is
 * deliberately not regex parsing: generators should break when the data shape
 * changes, not silently render garbage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function loadConstants(file = path.join(ROOT, 'constants.tsx')) {
  const esbuild = (await import('esbuild')).default;
  const source = fs
    .readFileSync(file, 'utf8')
    .replace(/^\s*import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, '');

  const { code } = esbuild.transformSync(source, {
    loader: 'tsx',
    jsx: 'transform',
    jsxFactory: '__jsx',
    jsxFragment: '__frag',
    format: 'esm',
  });

  const stub = 'const __jsx = () => null; const __frag = null;\n';
  const encoded = Buffer.from(stub + code, 'utf8').toString('base64');
  return import(`data:text/javascript;base64,${encoded}`);
}
