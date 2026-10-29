// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildBlog } from '../../scripts/build-blog.js';
import { loadPosts } from '../../scripts/blog/content.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

let root: string;
let contentDir: string;
let themeInitPath: string;

const write = (slug: string, body: string, extra = '', lang = 'en') =>
  writePost(contentDir, slug, body, extra, lang);
const read = (dist: string, ...parts: string[]) =>
  fs.readFileSync(path.join(dist, ...parts), 'utf8');

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-i18n-'));
  contentDir = path.join(root, 'content');
  themeInitPath = path.join(root, 'theme-init.js');
  fs.writeFileSync(themeInitPath, 'document.documentElement.className = "js";\n');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('loadPosts: translations', () => {
  it('reads every language of a post and lists them on each, English first', () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    write('hello', 'Tekst\n', TRANSLATION, 'nl');
    const posts = loadPosts(contentDir);
    expect(posts.map((post) => post.lang)).toEqual(['en', 'nl', 'tr']);
    expect(posts.map((post) => post.translations.join())).toEqual(Array(3).fill('en,tr,nl'));
  });

  it('requires the English version, which the others point back to', () => {
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    expect(() => loadPosts(contentDir)).toThrow(/hello\/en\.md/);
  });

  it('drops every translation when the English version is a draft', () => {
    write('hello', 'Body\n', 'draft: true\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    expect(loadPosts(contentDir)).toEqual([]);
  });

  it('leaves a draft translation out of the languages', () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', `${TRANSLATION}draft: true\n`, 'tr');
    const posts = loadPosts(contentDir);
    expect(posts.map((post) => post.lang)).toEqual(['en']);
    expect(posts[0].translations).toEqual(['en']);
  });

  it.each([
    ['topic', 'topic: testing', 'topic: ai'],
    ['kind', 'kind: essay', 'kind: note'],
    ['status', 'status: verified', 'status: hypothesis'],
    ['publishedAt', 'publishedAt: 2026-12-09', 'publishedAt: 2026-12-10'],
  ])('fails when a translation disagrees on %s, naming both files', (key, from, to) => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const file = path.join(contentDir, 'hello', 'tr.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(from, to));
    expect(() => loadPosts(contentDir)).toThrow(
      new RegExp(`hello/tr\\.md: ${key} .*hello/en\\.md`),
    );
  });

  it('requires the translation note on Turkish and Dutch', () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', '', 'tr');
    expect(() => loadPosts(contentDir)).toThrow(/tr\.md: translation/);
  });

  it('forbids the translation note on English, the original', () => {
    write('hello', 'Body\n', TRANSLATION);
    expect(() => loadPosts(contentDir)).toThrow(/en\.md: translation/);
  });

  it('flags a translation made before the English version last changed', () => {
    write('hello', 'Body\n', 'updatedAt: 2026-12-20\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    write('hello', 'Tekst\n', TRANSLATION.replace('2026-12-09', '2026-12-20'), 'nl');
    const byLang = Object.fromEntries(loadPosts(contentDir).map((post) => [post.lang, post]));
    expect([byLang.en.englishIsNewer, byLang.nl.englishIsNewer, byLang.tr.englishIsNewer]).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('rejects a translation dated after the English version it claims to follow', () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION.replace('2026-12-09', '2026-12-31'), 'tr');
    expect(() => loadPosts(contentDir)).toThrow(/tr\.md: translation\.from/);
  });

  it.each(['feed', 'now', 'topic'])('refuses the slug "%s", which a blog file uses', (slug) => {
    write(slug, 'Body\n');
    expect(() => loadPosts(contentDir)).toThrow(new RegExp(`"${slug}" is reserved`));
  });

  it('reads Turkish and Dutch at their own pace', () => {
    const words = Array.from({ length: 1800 }, () => 'word').join(' ');
    write('long', `${words}\n`);
    write('long', `${words}\n`, TRANSLATION, 'tr');
    write('long', `${words}\n`, TRANSLATION, 'nl');
    const minutes = Object.fromEntries(loadPosts(contentDir).map((p) => [p.lang, p.minutes]));
    expect(minutes).toEqual({ en: 8, nl: 9, tr: 10 });
  });
});

describe('buildBlog: languages', () => {
  it('writes each language under its own prefix, with its own index and feed', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    const written = await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: true });
    expect(written).toEqual([
      'blog.html',
      'blog/feed.xml',
      'blog/hello.html',
      'tr/blog.html',
      'tr/blog/feed.xml',
      'tr/blog/hello.html',
    ]);
    expect(read(dist, 'tr', 'blog', 'hello.html')).toContain('<html lang="tr">');
    expect(read(dist, 'tr', 'blog', 'feed.xml')).toContain('xml:lang="tr"');
  });

  it('links each version to the others and to English as the default', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    for (const html of [read(dist, 'blog', 'hello.html'), read(dist, 'tr', 'blog', 'hello.html')]) {
      expect(html).toContain(
        '<link rel="alternate" hreflang="en" href="https://emredursun.nl/blog/hello">',
      );
      expect(html).toContain(
        '<link rel="alternate" hreflang="tr" href="https://emredursun.nl/tr/blog/hello">',
      );
      expect(html).toContain(
        '<link rel="alternate" hreflang="x-default" href="https://emredursun.nl/blog/hello">',
      );
      expect(html).not.toContain('hreflang="nl"');
    }
    expect(read(dist, 'tr', 'blog', 'hello.html')).toContain(
      '<meta property="og:locale" content="tr_TR">',
    );
  });

  it('suggests only posts in the reader’s language at the end of an article', async () => {
    write('first', 'Body\n');
    write('second', 'Body\n');
    write('first', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    expect(read(dist, 'tr', 'blog', 'first.html')).not.toContain('class="more"');
    expect(read(dist, 'blog', 'first.html')).toContain('href="/blog/second"');
  });

  it('tells search engines which article translates which', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    const jsonLd = (html: string) =>
      JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]);
    const en = jsonLd(read(dist, 'blog', 'hello.html'));
    const tr = jsonLd(read(dist, 'tr', 'blog', 'hello.html'));
    expect(en.workTranslation).toEqual([{ '@id': 'https://emredursun.nl/tr/blog/hello#article' }]);
    expect(tr.translationOfWork).toEqual({ '@id': 'https://emredursun.nl/blog/hello#article' });
    expect(tr.inLanguage).toBe('tr');
    expect(tr.isPartOf).toEqual({ '@id': 'https://emredursun.nl/tr/blog#blog' });
    expect(jsonLd(read(dist, 'tr', 'blog.html')).inLanguage).toBe('tr');
  });

  it('keeps a Turkish reader in Turkish on every link back to the portfolio', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    const tr = read(dist, 'tr', 'blog', 'hello.html');
    const hrefs = [...tr.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    const local = hrefs.filter(
      (href) => !href.startsWith('/assets/') && !/\.(png|webmanifest)$/.test(href),
    );
    expect(local.length).toBeGreaterThan(0);
    expect(local.filter((href) => !href.startsWith('/tr'))).toEqual([]);
  });

  it('preloads the extended Latin face on Turkish pages, for ğ, ş and İ', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    const tr = read(dist, 'tr', 'blog', 'hello.html');
    expect(tr).toContain('bricolage-grotesque-latin-wght-normal-y2.woff2');
    expect(tr).toContain('bricolage-grotesque-latin-ext-wght-normal-y4.woff2');
    expect(read(dist, 'blog', 'hello.html')).not.toContain('latin-ext');
  });
});
