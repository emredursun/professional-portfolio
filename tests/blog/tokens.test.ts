// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Contrast of the blog's colour tokens, read from the stylesheet itself, so a
 * palette change cannot quietly break WCAG 2.2 AA. axe and Lighthouse do not
 * check focus rings or underlines; this does.
 */
const css = fs.readFileSync(path.resolve(process.cwd(), 'blog/client/styles/tokens.css'), 'utf8');

function block(selector: string, source = css): Record<string, string> {
  const start = source.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThanOrEqual(0);
  const body = source.slice(start, source.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
  );
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = block(':root');
const dark = block(':root.dark');
const SURFACES = ['--paper', '--sage', '--butter', '--lavender', '--peach'];

describe('blog colour tokens', () => {
  it('defines the dark theme once for the system setting and once for a pinned theme', () => {
    const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
    expect(block(':root:not(.light)', media)).toEqual(dark);
  });

  it.each([
    ['light', light],
    ['dark', dark],
  ])('keeps text at 4.5:1 or more on every surface (%s)', (_name, theme) => {
    for (const surface of SURFACES) {
      for (const text of ['--ink', '--ink-2']) {
        expect(
          contrast(theme[text], theme[surface]),
          `${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each([
    ['light', light],
    ['dark', dark],
  ])('keeps the focus ring and link underline at 3:1 or more (%s)', (_name, theme) => {
    for (const surface of SURFACES) {
      expect(
        contrast(theme['--focus'], theme[surface]),
        `focus on ${surface}`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(theme['--underline'], theme[surface]),
        `underline on ${surface}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps code readable on its dark background in both themes', () => {
    for (const theme of [light, dark]) {
      expect(
        contrast(theme['--code-ink'] ?? light['--code-ink'], theme['--code-bg']),
      ).toBeGreaterThanOrEqual(7);
    }
  });

  it('does not depend on light-dark(), which older Safari and Chrome ignore', () => {
    expect(css).not.toContain('light-dark(');
  });
});

describe('closing band tokens', () => {
  it.each([
    ['light', light],
    ['dark', dark],
  ])('keeps the closing text and button at 4.5:1 or more (%s)', (_name, theme) => {
    expect(contrast(theme['--closing-ink'], theme['--closing-bg'])).toBeGreaterThanOrEqual(4.5);
  });
});
