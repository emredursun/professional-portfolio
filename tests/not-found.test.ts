import { describe, expect, it } from 'vitest';
import { blogIndexFor } from '../components/NotFound.tsx';

describe('blogIndexFor', () => {
  it.each([
    ['/blog/no-such-post', '/blog'],
    ['/blog/topic/nothing', '/blog'],
    ['/tr/blog/yok', '/tr/blog'],
    ['/nl/blog/niets', '/nl/blog'],
  ])('sends a reader lost under %s back to %s', (pathname, index) => {
    expect(blogIndexFor(pathname)).toBe(index);
  });

  it.each(['/about/nothing', '/blogger', '/de/blog/x', '/tr/blogs', '/projects/blog'])(
    'leaves %s to the portfolio’s own not-found page',
    (pathname) => {
      expect(blogIndexFor(pathname)).toBeNull();
    },
  );
});
