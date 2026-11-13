// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Rules of the index hero's stylesheet that a browser test would only catch
 * at one width or one motion setting: the two-column grid from 960 px, the
 * phone order, and motion only for readers who did not ask for less.
 */
const css = fs.readFileSync(path.resolve(process.cwd(), 'blog/client/styles/hero.css'), 'utf8');

/** The text of each `@media (<query>) { … }` block, braces balanced. */
function mediaBlocks(query: string) {
  const blocks: string[] = [];
  let from = 0;
  for (;;) {
    const start = css.indexOf(`@media ${query}`, from);
    if (start < 0) return blocks;
    let depth = 0;
    let end = css.indexOf('{', start);
    for (; end < css.length; end += 1) {
      if (css[end] === '{') depth += 1;
      if (css[end] === '}' && --depth === 0) break;
    }
    blocks.push(css.slice(start, end + 1));
    from = end;
  }
}

describe('hero.css', () => {
  it('lays the hero out in two columns from 960 px, the Latest card filling its column', () => {
    const [wide] = mediaBlocks('(min-width: 960px)');
    expect(wide).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, [\d.]+fr\)/);
    expect(wide).toMatch(/'lede latest'/);
    expect(wide).toMatch(/\.latest-card \{[^}]*grid-area: latest;[^}]*align-self: stretch;/);
  });

  it('moves the Latest card up on phones, after the intro', () => {
    const [narrow] = mediaBlocks('(max-width: 959px)');
    expect(narrow).toMatch(/\.latest-card \{[^}]*order: 1;/);
    expect(narrow).toMatch(/\.index-actions \{[^}]*order: 2;/);
  });

  it('animates only inside prefers-reduced-motion: no-preference', () => {
    const motion = mediaBlocks('(prefers-reduced-motion: no-preference)').join('\n');
    const outside = mediaBlocks('(prefers-reduced-motion: no-preference)').reduce(
      (rest, block) => rest.replace(block, ''),
      css,
    );
    expect(motion).toMatch(/animation:/);
    expect(outside).not.toMatch(/\banimation:|\btransition:/);
  });
});
