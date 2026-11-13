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
  preload: {
    reading: '/assets/newsreader-latin-400-normal.woff2',
    display: '/assets/bricolage-grotesque-latin-wght-normal.woff2',
  },
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
    // The newest post (a note) is the Latest card, so it is not listed again.
    expect(doc.querySelector('[aria-labelledby="notes-title"]')).toBeNull();
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

  it('is noindex and offers no feed before launch', () => {
    const doc = index();
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
    expect(doc.querySelector('link[type="application/atom+xml"]')).toBeNull();
    expect(doc.querySelector('a[href="/blog/feed.xml"]')).toBeNull();
  });

  it('is indexable and offers the feed after launch', () => {
    const doc = parse(renderIndexPage({ posts, assets, launched: true }));
    expect(doc.querySelector('meta[name="robots"]')).toBeNull();
    expect(doc.querySelector('link[type="application/atom+xml"]')?.getAttribute('href')).toBe(
      '/blog/feed.xml',
    );
    expect(doc.querySelectorAll('a[href="/blog/feed.xml"]').length).toBeGreaterThan(0);
  });

  it('keeps the feed link out of the hreflang set, which must link back', () => {
    // A feed with hreflang reads as a language version of the page that
    // never returns the link; Search Console reports it as "no return tags".
    // The feed names its own language (xml:lang) instead.
    const doc = parse(renderIndexPage({ posts, assets, launched: true }));
    expect(doc.querySelector('link[type="application/atom+xml"]')?.hasAttribute('hreflang')).toBe(
      false,
    );
    expect(
      [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) =>
        link.getAttribute('href'),
      ),
    ).not.toContain('/blog/feed.xml');
  });

  it('lists the posts in the structured data, newest first, with their own data', () => {
    const doc = index();
    const data = JSON.parse(
      doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}',
    );
    expect(data.blogPost.map((post: { url: string }) => post.url)).toEqual([
      'https://emredursun.nl/blog/a-note',
      'https://emredursun.nl/blog/newer-essay',
      'https://emredursun.nl/blog/older-essay',
    ]);
    expect(data.blogPost[1]).toMatchObject({
      '@type': 'BlogPosting',
      '@id': 'https://emredursun.nl/blog/newer-essay#article',
      headline: 'Newer <essay>',
      datePublished: '2026-10-01',
    });
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
      // A newer essay is featured, so the index also lists both sections.
      [
        ...article.querySelectorAll('[id]'),
        ...parse(
          renderIndexPage({
            posts: [...posts, { ...posts[0], slug: 'newest', publishedAt: '2026-11-01' }],
            assets,
            launched: false,
          }),
        ).querySelectorAll('[id]'),
      ].map((el) => el.id),
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

describe('last change', () => {
  const corrected = {
    ...posts[1],
    corrections: [{ date: '2026-11-03', text: 'Fixed a number.' }],
  };

  it('counts a correction made after the last update, in the feed and the page', () => {
    const feed = new DOMParser().parseFromString(renderFeed([corrected]), 'application/xml');
    expect(feed.querySelector('feed > updated')?.textContent).toBe('2026-11-03T00:00:00Z');
    expect(feed.querySelector('entry > updated')?.textContent).toBe('2026-11-03T00:00:00Z');
    const page = parse(renderArticlePage({ post: corrected, assets, launched: false }));
    expect(
      page.querySelector('meta[property="article:modified_time"]')?.getAttribute('content'),
    ).toBe('2026-11-03');
    const data = JSON.parse(
      page.querySelector('script[type="application/ld+json"]')?.textContent ?? '{}',
    );
    expect(data.dateModified).toBe('2026-11-03');
  });
});

describe('renderFeed: entries', () => {
  it('gives each entry its dates, link, summary, category and the feed an author', () => {
    const doc = new DOMParser().parseFromString(renderFeed(posts), 'application/xml');
    const newer = [...doc.querySelectorAll('entry')].find(
      (entry) =>
        entry.querySelector('id')?.textContent === 'https://emredursun.nl/blog/newer-essay',
    )!;
    expect(newer.querySelector('published')?.textContent).toBe('2026-10-01T00:00:00Z');
    expect(newer.querySelector('updated')?.textContent).toBe('2026-10-20T00:00:00Z');
    expect(newer.querySelector('link[rel="alternate"]')?.getAttribute('href')).toBe(
      'https://emredursun.nl/blog/newer-essay',
    );
    expect(newer.querySelector('summary')?.textContent).toBe('Second & last.');
    expect(newer.querySelector('category')?.getAttribute('term')).toBe('testing');
    expect(doc.querySelector('feed > author > name')?.textContent).toBe('Emre Dursun');
  });
});

describe('index cards: stale evidence', () => {
  it('carries the re-check date and a hidden note, like the article', () => {
    // A newer essay is the Latest card, so the note stays in its list.
    const newest = {
      ...base,
      slug: 'newest',
      kind: 'essay',
      title: 'Newest',
      description: 'N.',
      publishedAt: '2026-11-01',
    };
    const doc = parse(renderIndexPage({ posts: [...posts, newest], assets, launched: false }));
    const card = doc.querySelector('.cards .card')!;
    expect(card.getAttribute('data-recheck-by')).toBe('2027-10-01');
    expect(card.querySelector('.stale-note')?.hasAttribute('hidden')).toBe(true);
    const note = doc.querySelector('.note-card')!;
    expect(note.getAttribute('data-recheck-by')).toBe('2027-10-01');
  });
});

describe('calls to action and the author', () => {
  it('leads the primary action to the list of posts, not to the featured one again', () => {
    const doc = index();
    const link = doc.querySelector('.index-actions a.button-solid')!;
    expect(link.textContent).toBe('Browse all posts');
    expect(link.getAttribute('href')).toBe('#all-posts');
    expect(doc.querySelector('#all-posts')?.querySelector('.index-section')).not.toBeNull();
  });

  it('offers no browse action when the featured post is the only one', () => {
    const doc = parse(renderIndexPage({ posts: [posts[0]], assets, launched: false }));
    expect(doc.querySelector('.index-actions a.button-solid')).toBeNull();
    expect(doc.querySelector('#all-posts')).toBeNull();
  });

  it('makes the feed a quiet text link beside the solid primary action', () => {
    const doc = parse(renderIndexPage({ posts, assets, launched: true }));
    const actions = doc.querySelector('.index-actions')!;
    expect(actions.querySelector('a.button-solid')?.getAttribute('href')).toBe('#all-posts');
    const feed = actions.querySelector('a.text-link')!;
    expect(feed.getAttribute('href')).toBe('/blog/feed.xml');
    expect(feed.querySelector('[aria-hidden="true"]')?.textContent).toBe('→');
    expect(feed.classList.contains('button')).toBe(false);
  });

  it('links each topic as a chip with its post count, instead of a static band', () => {
    const doc = index();
    expect(doc.querySelector('.band')).toBeNull();
    const nav = doc.querySelector('nav.topic-nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Browse by topic');
    const chips = [...nav.querySelectorAll('a.topic-chip')];
    expect(chips.map((a) => [a.getAttribute('href'), a.textContent])).toEqual([
      ['/blog/topic/testing', 'Testing 3 posts'],
    ]);
    expect(chips[0].querySelector('.topic-count')?.textContent).toBe('3');
  });

  it('counts one post in the singular', () => {
    const doc = parse(renderIndexPage({ posts: [posts[0]], assets, launched: false }));
    expect(doc.querySelector('a.topic-chip')?.textContent).toBe('Testing 1 post');
  });

  it('ends every page with an invitation to get in touch', () => {
    const article = parse(renderArticlePage({ post: posts[0], assets, launched: false }));
    for (const doc of [index(), article]) {
      const link = doc.querySelector('.closing a');
      expect(link?.getAttribute('href')).toBe('/contact');
      expect(link?.textContent?.replace('↗', '').trim()).toBe('Say hello');
      expect(doc.querySelector('.closing [aria-hidden="true"]')?.textContent).toBe('↗');
    }
  });

  it('introduces the author on articles, with a sized portrait', () => {
    const doc = parse(renderArticlePage({ post: posts[0], assets, launched: false }));
    const img = doc.querySelector('.author img')!;
    expect(img.getAttribute('src')).toBe('/images/emre-dursun-qa-consultant-400.webp');
    // Decorative: the name is in the text right beside it.
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('width')).toBe('64');
    expect(img.getAttribute('height')).toBe('64');
    expect(doc.querySelector('.author a')?.getAttribute('href')).toBe('/about');
  });
});

describe('font preload', () => {
  const preloaded = (doc: Document) =>
    doc.querySelector('link[rel="preload"][as="font"]')?.getAttribute('href');

  it('preloads the face of each page’s largest text', () => {
    expect(preloaded(index())).toBe('/assets/newsreader-latin-400-normal.woff2');
    const article = parse(renderArticlePage({ post: posts[0], assets, launched: false }));
    expect(preloaded(article)).toBe('/assets/bricolage-grotesque-latin-wght-normal.woff2');
  });
});

describe('index hero', () => {
  it('makes the headline the first heading, without a label repeating the blog name', () => {
    const doc = index();
    expect(doc.querySelector('h1')?.textContent).toBe('Notes on quality, and the rest of life.');
    expect(doc.querySelector('.index-eyebrow')).toBeNull();
    expect(doc.querySelector('main h1, main h2')?.tagName).toBe('H1');
  });

  it('features the newest post as the Latest card, with one link', () => {
    const doc = index();
    const card = doc.querySelector('.index-hero .latest-card')!;
    expect(card.getAttribute('aria-labelledby')).toBe('latest-title');
    expect(card.querySelector('.latest-label')?.textContent).toBe('Latest');
    expect(card.querySelector('h2#latest-title a')?.getAttribute('href')).toBe('/blog/a-note');
    expect(card.querySelectorAll('a')).toHaveLength(1);
    expect(card.querySelector('.latest-kind')?.textContent).toBe('Short note');
    expect(card.querySelector('.status')).not.toBeNull();
    expect(card.querySelector('.card-dek')?.textContent).toBe('Short.');
    expect(card.querySelector('time')?.getAttribute('datetime')).toBe('2026-10-05');
    // No cover: the plain card, no image.
    expect(card.classList.contains('has-cover')).toBe(false);
    expect(card.querySelector('img')).toBeNull();
  });

  it('shows the newest post’s cover in the Latest card, loaded early', () => {
    const coverImage = {
      src: '/assets/blog-cover-a-800-1.webp',
      srcset: '/assets/blog-cover-a-480-1.webp 480w, /assets/blog-cover-a-800-1.webp 800w',
      width: 800,
      height: 450,
      alt: '',
    };
    const withCover = posts.map((post) =>
      post.slug === 'a-note' ? { ...post, coverImage } : post,
    );
    const doc = parse(renderIndexPage({ posts: withCover, assets, launched: false }));
    const card = doc.querySelector('.latest-card')!;
    expect(card.classList.contains('has-cover')).toBe(true);
    const img = card.querySelector('img.card-cover')!;
    expect(img.getAttribute('loading')).toBeNull();
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['800', '450']);
  });

  it('puts the left column before the Latest card, so keyboard order follows the desktop layout', () => {
    // The stylesheet moves the card up on phones (hero.css, order).
    const hero = index().querySelector('.index-hero')!;
    expect([...hero.children].map((el) => el.className.split(' ')[0])).toEqual([
      'index-lede',
      'index-intro',
      'index-actions',
      'latest-card',
    ]);
  });
});

describe('code review fixes', () => {
  it('uses the two-column grid only when the article has contents', () => {
    const withToc = { ...posts[0], toc: [{ level: 2, id: 'part', text: 'Part' }] };
    const has = (post: object) =>
      parse(renderArticlePage({ post, assets, launched: false }))
        .querySelector('article')
        ?.classList.contains('has-toc');
    expect(has(withToc)).toBe(true);
    expect(has(posts[0])).toBe(false);
  });

  it('makes the closing headline an h2 that labels its section', () => {
    const doc = index();
    const heading = doc.querySelector('.closing h2');
    expect(heading?.textContent).toBe('Let’s compare notes.');
    expect(doc.querySelector('.closing')?.getAttribute('aria-labelledby')).toBe(heading?.id);
  });

  it('refuses an index without posts instead of linking nowhere', () => {
    expect(() => renderIndexPage({ posts: [], assets, launched: false })).toThrow(
      /at least one post/,
    );
  });
});

describe('index: the featured post is not listed twice', () => {
  const essay = {
    ...base,
    slug: 'the-essay',
    kind: 'essay',
    title: 'The essay',
    description: 'E.',
    publishedAt: '2026-10-01',
  };
  const note = {
    ...base,
    slug: 'the-note',
    kind: 'note',
    title: 'The note',
    description: 'N.',
    publishedAt: '2026-10-02',
  };
  const listed = (doc: Document) =>
    [...doc.querySelectorAll('#all-posts h3 a')].map((a) => a.getAttribute('href'));

  it('leaves the newest note out of the notes, and drops the empty section', () => {
    const doc = parse(renderIndexPage({ posts: [essay, note], assets, launched: false }));
    expect(doc.querySelector('.latest-card a')?.getAttribute('href')).toBe('/blog/the-note');
    expect(listed(doc)).toEqual(['/blog/the-essay']);
    expect(doc.querySelector('#notes-title')).toBeNull();
  });

  it('leaves the newest essay out of the essays when it is newest', () => {
    const newer = { ...essay, publishedAt: '2026-10-03' };
    const doc = parse(renderIndexPage({ posts: [newer, note], assets, launched: false }));
    expect(listed(doc)).toEqual(['/blog/the-note']);
    expect(doc.querySelector('#essays-title')).toBeNull();
  });

  it('lists nothing below the hero with a single post, but still counts it on its topic', () => {
    const doc = parse(renderIndexPage({ posts: [essay], assets, launched: false }));
    expect(doc.querySelector('.index-section')).toBeNull();
    expect(doc.querySelector('.topic-count')?.textContent).toBe('1');
  });
});
