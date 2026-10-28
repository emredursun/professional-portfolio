// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderArticlePage } from '../../scripts/blog/templates/article.js';
import { nextRecheck } from '../../scripts/blog/templates/sections.js';
import { PERSON_ID } from '../../scripts/lib/route-meta.js';

const post = Object.freeze({
  slug: 'a-green-test',
  lang: 'en',
  title: 'What does a green test actually tell you?',
  description: 'A passing run and a trustworthy result are different things.',
  publishedAt: '2026-12-09',
  updatedAt: '2026-12-12',
  topic: 'testing',
  kind: 'essay',
  status: 'verified',
  evidence: {
    confidence: 'High for UI tests, untested for APIs',
    basedOn: ['My own Pega and Tosca work'],
    recheckedAt: '2026-12-09',
  },
  aiAssistance: {
    mine: ['The idea and every example'],
    assisted: ['Proofreading'],
    promptsUrl: 'https://github.com/emredursun/prompts',
  },
  corrections: [{ date: '2026-12-12', text: 'Fixed a typo.' }],
  draft: false,
  minutes: 7,
  html: '<p>Body text.</p>\n<h2 id="first">First</h2>\n<h3 id="detail">Detail</h3>',
  toc: [
    { level: 2, id: 'first', text: 'First' },
    { level: 3, id: 'detail', text: 'Detail' },
  ],
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

function page(overrides: Record<string, unknown> = {}, launched = false) {
  const html = renderArticlePage({ post: { ...post, ...overrides }, assets, launched });
  return { html, doc: new DOMParser().parseFromString(html, 'text/html') };
}

describe('renderArticlePage: document', () => {
  it('is a complete English HTML document with one h1 holding the title', () => {
    const { html, doc } = page();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(doc.documentElement.lang).toBe('en');
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(post.title);
  });

  it('starts with a skip link to the main content', () => {
    const { doc } = page();
    const first = doc.body.querySelector('a, button');
    expect(first?.getAttribute('href')).toBe('#main');
    expect(doc.getElementById('main')?.tagName).toBe('MAIN');
  });

  it('has the landmarks a screen reader user navigates by', () => {
    const { doc } = page();
    expect(doc.querySelector('header')).not.toBeNull();
    expect(doc.querySelector('main article')).not.toBeNull();
    expect(doc.querySelector('nav[aria-label="On this page"]')).not.toBeNull();
    expect(doc.querySelector('footer')).not.toBeNull();
    expect(doc.querySelectorAll('aside').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps heading levels in order across the whole page', () => {
    const { doc } = page();
    const levels = [...doc.querySelectorAll('h1, h2, h3, h4')].map((h) => Number(h.tagName[1]));
    levels.reduce((previous, level) => {
      expect(level).toBeLessThanOrEqual(previous + 1);
      return level;
    }, 1);
  });

  it('includes the rendered post body', () => {
    expect(page().doc.querySelector('article')?.innerHTML).toContain('<p>Body text.</p>');
  });

  it('lists the h2 and h3 sections in the table of contents', () => {
    const links = [...page().doc.querySelectorAll('nav[aria-label="On this page"] a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#first', '#detail']);
  });

  it('shows publication and update dates as machine-readable times', () => {
    const times = [...page().doc.querySelectorAll('time')].map((t) => t.getAttribute('datetime'));
    expect(times).toContain('2026-12-09');
    expect(times).toContain('2026-12-12');
  });
});

describe('renderArticlePage: CSP', () => {
  it('has no inline styles, event handlers or inline executable scripts', () => {
    const { html, doc } = page();
    expect(html).not.toMatch(/\sstyle=/i);
    expect(html).not.toMatch(/\son[a-z]+=/i);
    const inline = [...doc.querySelectorAll('script:not([src])')];
    expect(inline.every((s) => s.getAttribute('type') === 'application/ld+json')).toBe(true);
  });

  it('loads the theme bootstrap before any stylesheet, so there is no flash', () => {
    const { html } = page();
    expect(html.indexOf(assets.themeInit)).toBeGreaterThan(0);
    expect(html.indexOf(assets.themeInit)).toBeLessThan(html.indexOf('rel="stylesheet"'));
  });

  it('loads the client script as a deferred module', () => {
    const script = page().doc.querySelector(`script[src="${assets.script}"]`);
    expect(script?.getAttribute('type')).toBe('module');
  });

  it('links the code stylesheet only when the post has code', () => {
    expect(page({ hasCode: true }).html).toContain(assets.codeCss);
    expect(page({ hasCode: false }).html).not.toContain(assets.codeCss);
  });
});

describe('renderArticlePage: search and sharing', () => {
  it('has the canonical URL, title and description', () => {
    const { doc } = page();
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://emredursun.nl/blog/a-green-test',
    );
    expect(doc.title).toBe(`${post.title} · Field Notes`);
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      post.description,
    );
  });

  it('is noindex until the blog launches, and indexable after', () => {
    const robots = (launched: boolean) =>
      page({}, launched).doc.querySelector('meta[name="robots"]')?.getAttribute('content');
    expect(robots(false)).toBe('noindex, nofollow');
    expect(robots(true)).toBeUndefined();
  });

  it('describes the post as an article for link previews', () => {
    const meta = (property: string) =>
      page().doc.querySelector(`meta[property="${property}"]`)?.getAttribute('content');
    expect(meta('og:type')).toBe('article');
    expect(meta('og:title')).toBe(post.title);
    expect(meta('article:published_time')).toBe('2026-12-09');
    expect(meta('article:modified_time')).toBe('2026-12-12');
  });

  it('adds BlogPosting structured data linked to the site and the person', () => {
    const json = page().doc.querySelector('script[type="application/ld+json"]')?.textContent;
    const data = JSON.parse(json ?? '{}');
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBe(post.title);
    expect(data.author['@id']).toBe(PERSON_ID);
    expect(data.isPartOf['@id']).toBe('https://emredursun.nl/blog#blog');
    expect(data.datePublished).toBe('2026-12-09');
    expect(data.dateModified).toBe('2026-12-12');
    expect(data.inLanguage).toBe('en');
  });

  it('reuses the site favicons and sets a theme colour for each scheme', () => {
    const { doc } = page();
    expect(doc.querySelector('link[rel="icon"][href="/favicon-32x32.png"]')).not.toBeNull();
    const colours = [...doc.querySelectorAll('meta[name="theme-color"]')].map((m) =>
      m.getAttribute('content'),
    );
    expect(colours).toEqual(['#faf7f0', '#1c1b18']);
  });
});

describe('renderArticlePage: escaping', () => {
  it('escapes a hostile title everywhere it appears', () => {
    const title = '</title><script>alert(1)</script>';
    const { html, doc } = page({ title });
    expect(html).not.toContain('<script>alert(1)');
    expect(doc.title).toContain(title);
    const json = doc.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    expect(json).not.toContain('</');
    expect(JSON.parse(json).headline).toBe(title);
  });
});

describe('renderArticlePage: trust sections', () => {
  it('shows the evidence card with status, confidence, sources and the re-check date', () => {
    const card = page().doc.querySelector('[aria-labelledby="evidence-title"]');
    expect(card?.textContent).toContain('Verified');
    expect(card?.textContent).toContain(post.evidence.confidence);
    expect(card?.textContent).toContain(post.evidence.basedOn[0]);
  });

  it('shows how AI was used, with the prompts link when there is one', () => {
    const panel = page().doc.querySelector('[aria-labelledby="ai-title"]');
    expect(panel?.textContent).toContain('Proofreading');
    expect(panel?.querySelector('a')?.getAttribute('href')).toBe(post.aiAssistance.promptsUrl);
    const without = page({ aiAssistance: { mine: ['All of it'], assisted: [] } }).doc;
    expect(without.querySelector('[aria-labelledby="ai-title"] a')).toBeNull();
  });

  it('lists corrections, or says there are none', () => {
    expect(page().doc.body.textContent).toContain('Fixed a typo.');
    expect(page({ corrections: [] }).doc.body.textContent).toContain('None yet.');
  });

  it('offers a way to report a mistake', () => {
    const link = [...page().doc.querySelectorAll('a')].find((a) =>
      /report/i.test(a.textContent ?? ''),
    );
    expect(link?.getAttribute('href')).toBe('/contact');
  });
});

describe('nextRecheck', () => {
  it('is one year after the last check, keeping leap days valid', () => {
    expect(nextRecheck('2026-12-09')).toBe('2027-12-09');
    expect(nextRecheck('2028-02-29')).toBe('2029-02-28');
  });
});
