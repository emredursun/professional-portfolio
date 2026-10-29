import { describe, expect, it } from 'vitest';
import { blogPathFor, withBlogBeforeContact } from '../src/utils/blog.ts';

describe('withBlogBeforeContact', () => {
  const pages = ['/about', '/resume', '/projects', '/contact'].map((path) => ({ path }));

  it('puts the blog after the content pages and before Contact, which stays last', () => {
    expect(withBlogBeforeContact(pages, true)).toEqual([
      { path: '/about' },
      { path: '/resume' },
      { path: '/projects' },
      'blog',
      { path: '/contact' },
    ]);
  });

  it('finds Contact under a language prefix', () => {
    const turkish = pages.map(({ path }) => ({ path: `/tr${path}` }));
    expect(withBlogBeforeContact(turkish, true).indexOf('blog')).toBe(3);
  });

  it('adds the blog at the end when there is no Contact page', () => {
    expect(withBlogBeforeContact(pages.slice(0, 2), true).at(-1)).toBe('blog');
  });

  it('leaves the pages as they are before launch', () => {
    expect(withBlogBeforeContact(pages, false)).toEqual(pages);
  });
});

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
