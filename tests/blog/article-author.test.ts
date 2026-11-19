// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderArticlePage } from '../../scripts/blog/templates/article.js';
import { PERSON_ID } from '../../scripts/lib/route-meta.js';

const base = Object.freeze({
  slug: 'a-green-test',
  title: 'A title',
  description: 'A description.',
  publishedAt: '2026-12-09',
  topic: 'testing',
  kind: 'essay',
  status: 'verified',
  evidence: {
    confidence: 'High',
    basedOn: ['My own work'],
    recheckedAt: '2026-12-09',
  },
  aiAssisted: true,
  corrections: [],
  draft: false,
  minutes: 7,
  html: '<p>Body text.</p>',
  toc: [],
});

const assets = Object.freeze({
  themeInit: '/assets/blog-theme-init-12345678.js',
  script: '/assets/article-abc.js',
  styles: ['/assets/article-def.css'],
  codeCss: '/assets/blog-code-87654321.css',
  preload: {
    reading: '/assets/newsreader-latin-400-normal.woff2',
    display: '/assets/bricolage-grotesque-latin-wght-normal.woff2',
  },
});

/** The BlogPosting JSON-LD as it ships in the built page. */
function blogPostingOf(lang: string) {
  const post = { ...base, lang, updatedAt: '2026-12-12' };
  const html = renderArticlePage({ post, assets, launched: true });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  const nodes = scripts.map((s) => JSON.parse(s.textContent ?? '{}'));
  return nodes.find((node) => node['@type'] === 'BlogPosting');
}

describe.each(['en', 'tr', 'nl'])('BlogPosting structured data (%s)', (lang) => {
  it('names an inline Person as author', () => {
    const post = blogPostingOf(lang);
    expect(post).toBeDefined();
    expect(post.author['@type']).toBe('Person');
    expect(post.author['@id']).toBe(PERSON_ID);
    expect(post.author.name).toEqual(expect.any(String));
    expect(post.author.name.trim().length).toBeGreaterThan(0);
    expect(post.author.url).toMatch(/^https:\/\/emredursun\.nl\/(tr\/|nl\/)?about$/);
  });

  it('names an inline Person as publisher, matching the author', () => {
    const post = blogPostingOf(lang);
    expect(post.publisher).toEqual(post.author);
  });

  it('carries dateModified from the last update', () => {
    expect(blogPostingOf(lang).dateModified).toBe('2026-12-12');
  });
});
