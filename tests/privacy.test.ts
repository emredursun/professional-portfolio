// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * The site names a work location (Sopra Steria, Nieuwegein) and a home
 * province, never the home town or postcode. Those slipped through twice -
 * once in the JSON-LD, once in the contact page's map embed - so every file
 * that ships to visitors is scanned.
 */
const ROOT = path.resolve(__dirname, '..');
const SHIPPED = ['index.html', 'constants.tsx', 'components', 'src', 'public/locales', 'scripts'];
const FORBIDDEN = [/Hoogkarspel/i, /\b1616\s?[A-Z]{2}\b/];

function files(entry: string): string[] {
  const full = path.join(ROOT, entry);
  if (fs.statSync(full).isFile()) return [full];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap((dirent) =>
      dirent.isDirectory() ? files(path.join(entry, dirent.name)) : [path.join(full, dirent.name)],
    );
}

describe('privacy', () => {
  it('ships no home town or postcode in any source the site is built from', () => {
    const hits = SHIPPED.flatMap(files)
      .filter((file) => /\.(tsx?|jsx?|json|html|css)$/.test(file))
      .flatMap((file) => {
        const text = fs.readFileSync(file, 'utf8');
        return FORBIDDEN.filter((pattern) => pattern.test(text)).map(
          (pattern) => `${path.relative(ROOT, file)} ${pattern}`,
        );
      });
    expect(hits).toEqual([]);
  });
});
