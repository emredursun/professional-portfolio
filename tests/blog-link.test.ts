import { describe, expect, it } from 'vitest';
import { blogPathFor } from '../src/utils/blog.ts';

describe('blogPathFor', () => {
  it.each([
    ['en', '/blog'],
    ['tr', '/tr/blog'],
    ['nl', '/nl/blog'],
  ])('opens the %s blog at %s', (language, path) => {
    expect(blogPathFor(language)).toBe(path);
  });

  it.each(['de', 'en-US', '', 'tr-TR'])('falls back to English for %j', (language) => {
    expect(blogPathFor(language)).toBe('/blog');
  });
});
