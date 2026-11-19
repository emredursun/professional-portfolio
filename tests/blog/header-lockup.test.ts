// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderIndexPage } from '../../scripts/blog/templates/index.js';

const assets = {
  themeInit: '/assets/blog-theme-init-1.js',
  script: '/assets/article-1.js',
  styles: ['/assets/article-1.css'],
  codeCss: undefined,
  preload: { reading: '/assets/r.woff2', display: '/assets/d.woff2' },
};

const post = {
  lang: 'en',
  topic: 'testing',
  status: 'verified',
  minutes: 4,
  hasCode: false,
  evidence: { basedOn: ['Work'], recheckedAt: '2026-10-01' },
  aiAssisted: false,
  corrections: [],
  html: '<p>Body</p>',
  toc: [],
  slug: 'a-post',
  kind: 'essay',
  title: 'A post',
  description: 'Short.',
  publishedAt: '2026-09-01',
};

const cases = [
  ['en', '/blog'],
  ['tr', '/tr/blog'],
  ['nl', '/nl/blog'],
] as const;

describe('the header brand lockup', () => {
  it.each(cases)('links "Insights" to the blog in %s, once', (lang, href) => {
    const html = renderIndexPage({ posts: [post], assets, launched: false, lang });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const link = doc.querySelector('.site-header .lockup a.blog-name');
    expect(link?.getAttribute('href')).toBe(href);
    expect(link?.textContent).toBe('Insights');
    const blogLinks = [...doc.querySelectorAll('.site-header a')].filter(
      (a) => a.getAttribute('href') === href,
    );
    expect(blogLinks).toHaveLength(1);
  });
});
