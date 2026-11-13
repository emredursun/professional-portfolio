// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Card rules in the blog's stylesheets that only a keyboard or a dark
 * theme would show: the focus ring round each whole-card link, the cover
 * scrim taken from its tokens, and the no-cover placeholder's colours.
 */
const read = (name: string) =>
  fs.readFileSync(path.resolve(process.cwd(), 'blog/client/styles', name), 'utf8');
const index = read('index.css');
const tokens = read('tokens.css');

/** The body of the first `@supports selector(:has(a)) { … }` block. */
function hasBlock(css: string) {
  const start = css.indexOf('@supports selector(:has(a))');
  expect(start).toBeGreaterThanOrEqual(0);
  let depth = 0;
  let end = css.indexOf('{', start);
  for (; end < css.length; end += 1) {
    if (css[end] === '{') depth += 1;
    if (css[end] === '}' && --depth === 0) break;
  }
  return css.slice(start, end + 1);
}

describe('card focus rings', () => {
  const block = hasBlock(index);

  it.each([
    ['an essay card with a cover', 'li.card.has-cover:has(.card-title a:focus-visible)'],
    ['a short-note card', '.note-card:has(.note-title a:focus-visible)'],
    ['the Latest card', '.latest-card:has(.card-title a:focus-visible)'],
  ])('rings the whole of %s, not just its title', (_name, selector) => {
    const rule = block.slice(block.indexOf(selector));
    expect(block).toContain(selector);
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/outline: 3px solid var\(--focus\);/);
  });

  it('stretches each of those links over its card', () => {
    for (const selector of [
      '.card.has-cover .card-title a::after',
      '.note-title a::after',
      '.latest-card .card-title a::after',
    ]) {
      expect(index).toContain(selector);
    }
  });
});

describe('cover scrim and placeholder', () => {
  it('derives the scrim from its tokens, with no hard-coded copy', () => {
    expect(index).not.toMatch(/--scrim:\s*rgb\(/);
    expect(index).toMatch(/--scrim: color-mix\(\s*in srgb,\s*var\(--cover-scrim\)/);
  });

  it('gives the no-cover placeholder its own colours in each theme', () => {
    const blocks = [':root {', ':root:not(.light) {', ':root.dark {'].map((selector) =>
      tokens.slice(tokens.indexOf(selector), tokens.indexOf('}', tokens.indexOf(selector))),
    );
    for (const block of blocks) {
      for (const token of ['--placeholder-from', '--placeholder-to', '--placeholder-disc']) {
        expect(block, token).toContain(`${token}:`);
      }
    }
    expect(index).toMatch(/var\(--placeholder-disc\)/);
  });
});
