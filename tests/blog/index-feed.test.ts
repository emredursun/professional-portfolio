// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { RESERVED_IDS } from '../../scripts/blog/config.js';
import { renderFeed } from '../../scripts/blog/feed.js';
import { renderArticlePage } from '../../scripts/blog/templates/article.js';
import { renderIndexPage } from '../../scripts/blog/templates/index.js';
import { PERSON_ID, WEBSITE_ID } from '../../scripts/lib/route-meta.js';

const base = {
  lang: 'en',
  topic: 'testing',
  status: 'verified',
  minutes: 4,
  hasCode: false,
  evidence: { confidence: 'High', basedOn: ['Work'], recheckedAt: '2026-10-01' },
  aiAssistance: { mine: ['All of it'], assisted: [] },
  corrections: [],
  html: '<p>Body</p>',
  toc: [],
};

const posts = [
  {
    ...base,
    slug: 'older-essay',
    kind: 'essay',
    title: 'Older essay',
    description: 'First.',
    publishedAt: '2026-09-01',
  },
  {
    ...base,
    slug: 'newer-essay',
    kind: 'essay',
    title: 'Newer <essay>',
    description: 'Second & last.',
    publishedAt: '2026-10-01',
    updatedAt: '2026-10-20',
  },
  {
    ...base,
    slug: 'a-note',
    kind: 'note',
    status: 'hypothesis',
    title: 'A note',
    description: 'Short.',
    publishedAt: '2026-10-05',
  },
];

const assets = {
  themeInit: '/assets/blog-theme-init-1.js',
  script: '/assets/article-1.js',
  styles: ['/assets/article-1.css'],
  codeCss: undefined,
  fontPreload: undefined,
};

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const index = () => parse(renderIndexPage({ posts, assets, launched: false }));

describe('renderIndexPage', () => {
  it('has one h1, the essays as cards and the notes as a list, newest first', () => {
    const doc = index();
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    const essays = [...doc.querySelectorAll('[aria-labelledby="essays-title"] .card-title a')];
    expect(essays.map((a) => a.getAttribute('href'))).toEqual([
      '/blog/newer-essay',
      '/blog/older-essay',
    ]);
    const notes = [...doc.querySelectorAll('[aria-labelledby="notes-title"] a')];
    expect(notes.map((a) => a.getAttribute('href'))).toEqual(['/blog/a-note']);
  });

  it('escapes titles and descriptions', () => {
    const html = renderIndexPage({ posts, assets, launched: false });
    expect(html).toContain('Newer &lt;essay&gt;');
    expect(html).toContain('Second &amp; last.');
  });

  it('leaves out a section with nothing in it', () => {
    const doc = parse(renderIndexPage({ posts: posts.slice(0, 2), assets, launched: false }));
    expect(doc.querySelector('[aria-labelledby="notes-title"]')).toBeNull();
  });

  it('describes the blog to search engines and links it to the site and the person', () => {
    const doc = index();
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://emredursun.nl/blog',
    );
    expect(doc.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    expect(doc.querySelector('meta[property="article:published_time"]')).toBeNull();
    const data = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}',
    );
    expect(data['@type']).toBe('Blog');
    expect(data.isPartOf['@id']).toBe(WEBSITE_ID);
    expect(data.author['@id']).toBe(PERSON_ID);
    expect(data.blogPost).toHaveLength(3);
  });

  it('is noindex until launch and offers the feed', () => {
    const doc = index();
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
    expect(
      doc.querySelector('link[rel="alternate"][type="application/atom+xml"]')?.getAttribute('href'),
    ).toBe('/blog/feed.xml');
  });
});

describe('article: keep reading', () => {
  it('links up to two other posts', () => {
    const doc = parse(
      renderArticlePage({ post: posts[0], related: posts.slice(1), assets, launched: false }),
    );
    const links = [...doc.querySelectorAll('[aria-labelledby="more-title"] a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/blog/newer-essay', '/blog/a-note']);
  });

  it('carries the re-check date for the stale marker, with the note hidden', () => {
    const doc = parse(renderArticlePage({ post: posts[0], assets, launched: false }));
    const card = doc.querySelector('.evidence');
    expect(card?.getAttribute('data-recheck-by')).toBe('2027-10-01');
    expect(card?.querySelector('.stale-note')?.hasAttribute('hidden')).toBe(true);
  });
});

describe('reserved ids', () => {
  it('lists exactly the ids the page templates use, so headings can avoid them', () => {
    const article = parse(
      renderArticlePage({ post: posts[0], related: posts.slice(1), assets, launched: false }),
    );
    const used = new Set(
      [...article.querySelectorAll('[id]'), ...index().querySelectorAll('[id]')].map((el) => el.id),
    );
    expect([...used].sort()).toEqual([...RESERVED_IDS].sort());
  });
});

describe('renderFeed', () => {
  const feed = () => renderFeed(posts);
  const xml = () => new DOMParser().parseFromString(feed(), 'application/xml');

  it('is well-formed Atom', () => {
    const doc = xml();
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.documentElement.namespaceURI).toBe('http://www.w3.org/2005/Atom');
    expect(doc.querySelector('feed > link[rel="self"]')?.getAttribute('href')).toBe(
      'https://emredursun.nl/blog/feed.xml',
    );
  });

  it('lists every post newest first, with escaped text', () => {
    const doc = xml();
    const ids = [...doc.querySelectorAll('entry > id')].map((el) => el.textContent);
    // By publication date: the note (5 Oct) is newer than the essay (1 Oct).
    expect(ids).toEqual([
      'https://emredursun.nl/blog/a-note',
      'https://emredursun.nl/blog/newer-essay',
      'https://emredursun.nl/blog/older-essay',
    ]);
    const titles = [...doc.querySelectorAll('entry > title')].map((el) => el.textContent);
    expect(titles[1]).toBe('Newer <essay>');
  });

  it('dates the feed by its latest change, from the posts, never the clock', () => {
    const doc = xml();
    expect(doc.querySelector('feed > updated')?.textContent).toBe('2026-10-20T00:00:00Z');
    expect(feed()).toBe(feed());
  });
});
