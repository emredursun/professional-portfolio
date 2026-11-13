// @vitest-environment jsdom
/**
 * Cover images on the index and topic cards: the frontmatter field, how a
 * post's cover is chosen, the card-size variants the build writes, and the
 * markup the cards render.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadPosts } from '../../scripts/blog/content.js';
import { COVER_WIDTHS, emitCoverImages } from '../../scripts/blog/images.js';
import { validatePost } from '../../scripts/blog/schema.js';
import { renderIndexPage } from '../../scripts/blog/templates/index.js';
import { buildBlog } from '../../scripts/build-blog.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

const FILE = 'blog/content/a-green-test/en.md';

const frontmatter = (overrides: Record<string, unknown> = {}) => ({
  title: 'A green test',
  description: 'What a passing run tells you.',
  publishedAt: '2026-12-09',
  topic: 'testing',
  kind: 'essay',
  status: 'verified',
  evidence: { confidence: 'High', basedOn: ['Work'], recheckedAt: '2026-12-09' },
  aiAssistance: { mine: ['All'], assisted: [] },
  ...overrides,
});

const photo = (width = 960, height = 540) =>
  sharp({ create: { width, height, channels: 3, background: '#3f6b52' } })
    .webp()
    .toBuffer();

let root: string;
let contentDir: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-covers-'));
  contentDir = path.join(root, 'content');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

async function putImage(slug: string, name: string, width?: number, height?: number) {
  fs.mkdirSync(path.join(contentDir, slug), { recursive: true });
  fs.writeFileSync(path.join(contentDir, slug, name), await photo(width, height));
}

describe('validatePost: cover', () => {
  it('accepts a cover in the post folder, with or without alt text', () => {
    expect(validatePost(frontmatter({ cover: 'misty-road.webp' }), FILE).cover).toBe(
      'misty-road.webp',
    );
    const post = validatePost(frontmatter({ cover: 'a1.jpg', coverAlt: 'A misty road' }), FILE);
    expect(post.coverAlt).toBe('A misty road');
  });

  it.each(['sub/a.webp', '../a.webp', 'A.webp', 'a.gif', 'chart.svg', '/images/a.webp', ''])(
    'rejects the cover %s',
    (cover) => {
      expect(() => validatePost(frontmatter({ cover }), FILE)).toThrow(/cover/);
    },
  );

  it('rejects alt text without a cover', () => {
    expect(() => validatePost(frontmatter({ coverAlt: 'A road' }), FILE)).toThrow(/coverAlt/);
  });

  it('keeps the cover optional', () => {
    expect(validatePost(frontmatter(), FILE).cover).toBeUndefined();
  });
});

describe('loadPosts: choosing the cover', () => {
  it('uses the cover named in the frontmatter, with its alt text', async () => {
    await putImage('hello', 'road.webp');
    writePost(contentDir, 'hello', 'Body\n', 'cover: road.webp\ncoverAlt: A road in fog\n');
    expect(loadPosts(contentDir)[0].coverSource).toEqual({
      name: 'road.webp',
      alt: 'A road in fog',
    });
  });

  it('falls back to the first raster image in the body, as decoration', async () => {
    await putImage('hello', 'first.webp');
    await putImage('hello', 'second.webp');
    fs.writeFileSync(path.join(contentDir, 'hello', 'chart.svg'), '<svg viewBox="0 0 1 1"/>');
    writePost(
      contentDir,
      'hello',
      '![A chart](chart.svg)\n\n![One](first.webp)\n\n![Two](second.webp)\n',
    );
    expect(loadPosts(contentDir)[0].coverSource).toEqual({ name: 'first.webp', alt: '' });
  });

  it('has no cover when the post has no image', () => {
    writePost(contentDir, 'hello', 'Just words.\n');
    expect(loadPosts(contentDir)[0].coverSource).toBeUndefined();
  });

  it('refuses a cover that is not in the post folder', () => {
    writePost(contentDir, 'hello', 'Body\n', 'cover: missing.webp\n');
    expect(() => loadPosts(contentDir)).toThrow(/hello\/en\.md: cover "missing\.webp"/);
  });

  it('gives a translation the English cover, without the English alt text', async () => {
    await putImage('hello', 'road.webp');
    writePost(contentDir, 'hello', 'Body\n', 'cover: road.webp\ncoverAlt: A road\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    const tr = loadPosts(contentDir).find((post) => post.lang === 'tr');
    expect(tr?.coverSource).toEqual({ name: 'road.webp', alt: '' });
  });
});

describe('emitCoverImages', () => {
  it('writes webp variants up to 1600 px wide, never wider than the source', async () => {
    await putImage('hello', 'road.webp', 960, 540);
    await putImage('small', 'tiny.webp', 400, 300);
    const distDir = path.join(root, 'dist');
    const covers = await emitCoverImages({
      distDir,
      contentDir,
      covers: [
        ['hello', 'road.webp'],
        ['small', 'tiny.webp'],
      ],
    });
    expect(COVER_WIDTHS).toEqual([240, 480, 800, 1200, 1600]);
    const road = covers.get('hello/road.webp')!;
    // The source is 960 wide: the largest copy is the source's own width.
    expect(road).toMatchObject({ width: 960, height: 540 });
    expect(road.src).toMatch(/^\/assets\/blog-cover-hello-road-960-[0-9a-f]{8}\.webp$/);
    expect(road.srcset.split(', ').map((entry) => entry.split(' ')[1])).toEqual([
      '240w',
      '480w',
      '800w',
      '960w',
    ]);
    // From a buffer: sharp keeps a file it opened by path locked on Windows.
    const written = await sharp(fs.readFileSync(path.join(distDir, road.src))).metadata();
    expect([written.format, written.width]).toEqual(['webp', 960]);

    const tiny = covers.get('small/tiny.webp')!;
    expect(tiny).toMatchObject({ width: 400, height: 300 });
    expect(tiny.srcset.split(', ').map((entry) => entry.split(' ')[1])).toEqual(['240w', '400w']);
  });
});

const base = {
  lang: 'en',
  topic: 'testing',
  status: 'verified',
  minutes: 4,
  evidence: { confidence: 'High', basedOn: ['Work'], recheckedAt: '2026-10-01' },
  aiAssistance: { mine: ['All of it'], assisted: [] },
  corrections: [],
  html: '<p>Body</p>',
  toc: [],
};
const cover = (alt = '') => ({
  src: '/assets/blog-cover-x-800-1.webp',
  srcset: '/assets/blog-cover-x-240-1.webp 240w, /assets/blog-cover-x-800-1.webp 800w',
  width: 800,
  height: 450,
  alt,
});
const assets = {
  themeInit: '/assets/blog-theme-init-1.js',
  script: '/assets/article-1.js',
  styles: ['/assets/article-1.css'],
  preload: {},
};
const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('index cards with covers', () => {
  // The newest post is the Latest card and is not listed again, so the
  // posts under test are older than this one.
  const featured = {
    ...base,
    slug: 'featured',
    kind: 'essay',
    title: 'Featured',
    description: 'F.',
    publishedAt: '2026-10-09',
  };
  const posts = [
    {
      ...base,
      slug: 'covered',
      kind: 'essay',
      title: 'Covered',
      description: 'D.',
      publishedAt: '2026-10-03',
      coverImage: cover('A road in fog'),
    },
    {
      ...base,
      slug: 'plain',
      kind: 'essay',
      title: 'Plain',
      description: 'D.',
      publishedAt: '2026-10-02',
    },
    {
      ...base,
      slug: 'noted',
      kind: 'note',
      title: 'Noted',
      description: 'D.',
      publishedAt: '2026-10-01',
      coverImage: cover('Keys'),
    },
  ];
  const doc = () =>
    parse(renderIndexPage({ posts: [featured, ...posts], assets, launched: false }));

  it('shows the cover behind an essay card, lazy, sized and responsive', () => {
    const card = doc().querySelector('.cards .card.has-cover')!;
    const img = card.querySelector('img.card-cover')!;
    expect(img.getAttribute('src')).toBe('/assets/blog-cover-x-800-1.webp');
    expect(img.getAttribute('srcset')).toContain('240w');
    expect(img.getAttribute('sizes')).toBeTruthy();
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['800', '450']);
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('alt')).toBe('A road in fog');
    // The text sits on its own scrim, after the image in reading order.
    expect(card.querySelector('.card-body .card-title a')?.getAttribute('href')).toBe(
      '/blog/covered',
    );
  });

  it('keeps the plain card when a post has no cover', () => {
    const plain = doc().querySelectorAll('.cards .card')[1];
    expect(plain.classList.contains('has-cover')).toBe(false);
    expect(plain.querySelector('img')).toBeNull();
  });

  it('shows a short note as a card with its cover across the top', () => {
    const list = doc().querySelector('[aria-labelledby="notes-title"] ul.note-cards')!;
    const note = list.querySelector(':scope > li.note-card.has-cover')!;
    const img = note.firstElementChild!;
    expect(img.matches('img.note-cover')).toBe(true);
    expect(img.getAttribute('alt')).toBe('Keys');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('sizes')).toContain('560px');
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['800', '450']);
    // Text below the photo, never over it; one link to the post.
    const body = note.querySelector('.note-body')!;
    expect(body.querySelector('.status')).not.toBeNull();
    expect(body.querySelector('h3.note-title a')?.getAttribute('href')).toBe('/blog/noted');
    expect(note.querySelectorAll('a[href="/blog/noted"]')).toHaveLength(1);
    expect(body.querySelector('.card-meta time')).not.toBeNull();
  });

  it('keeps a short note without a cover as a card, without an image', () => {
    const page = parse(
      renderIndexPage({
        posts: [featured, { ...posts[2], coverImage: undefined }],
        assets,
        launched: false,
      }),
    );
    const note = page.querySelector('li.note-card')!;
    expect(note.classList.contains('has-cover')).toBe(false);
    expect(note.querySelector('img')).toBeNull();
    expect(note.querySelector('.note-body h3.note-title a')?.getAttribute('href')).toBe(
      '/blog/noted',
    );
  });

  it('uses empty alt text when the post gives none', () => {
    const page = parse(
      renderIndexPage({ posts: [{ ...posts[0], coverImage: cover() }], assets, launched: false }),
    );
    expect(page.querySelector('img.card-cover')?.getAttribute('alt')).toBe('');
  });
});

describe('buildBlog: covers', () => {
  it('puts each post’s cover on the index and topic cards', async () => {
    await putImage('hello', 'road.webp');
    writePost(contentDir, 'hello', '![A road](road.webp)\n', 'cover: road.webp\n');
    const themeInitPath = path.join(root, 'theme-init.js');
    fs.writeFileSync(themeInitPath, '');
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    // The only post: the Latest card on the index, a card on its topic page.
    for (const [file, selector] of [
      ['blog.html', '.latest-card img.card-cover'],
      ['blog/topic/testing.html', '.cards .card img.card-cover'],
    ]) {
      const page = parse(fs.readFileSync(path.join(dist, file), 'utf8'));
      const src = page.querySelector(selector)?.getAttribute('src');
      expect(src, file).toMatch(/^\/assets\/blog-cover-hello-road-960-[0-9a-f]{8}\.webp$/);
      expect(fs.existsSync(path.join(dist, src!))).toBe(true);
    }
  });
});
