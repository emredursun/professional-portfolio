// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { FA_CSS_PATH, OUTPUT_DIR, buildIconCss, usedIconClasses } from '../scripts/subset-icons.js';

const faCss = fs.readFileSync(FA_CSS_PATH, 'utf8');
const committedCss = fs.readFileSync(path.join(OUTPUT_DIR, 'icons.css'), 'utf8');

/**
 * The site ships a subset of Font Awesome (scripts/subset-icons.js). An icon
 * added to the source without regenerating would render as an empty box, so
 * these checks fail first.
 */
describe('icon subset', () => {
  it('matches what the generator produces from the current source', () => {
    expect(committedCss).toBe(buildIconCss(faCss, usedIconClasses()).css);
  });

  it('defines every fa- class the source uses', () => {
    const missing = usedIconClasses().filter(
      (name) => !committedCss.includes(`.${name}{`) && !committedCss.includes(`.${name},`),
    );
    expect(missing).toEqual([]);
  });

  it('keeps only the used icons and their fonts small', () => {
    const { css, codePoints } = buildIconCss(faCss, ['fa-check', 'fa-github']);
    expect(codePoints).toHaveLength(2);
    expect(css).toContain('.fa-check{');
    expect(css).not.toContain('.fa-xmark');
    for (const file of ['fa-solid-900', 'fa-regular-400', 'fa-brands-400']) {
      expect(fs.statSync(path.join(OUTPUT_DIR, `${file}.woff2`)).size).toBeLessThan(30 * 1024);
    }
  });
});
