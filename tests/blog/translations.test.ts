// @vitest-environment jsdom
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

  it.each(['tr.MD', 'nl.markdown', 'notes.txt'])(
    'fails on %s, which would otherwise drop a translation silently',
    (name) => {
      write('hello', 'Body\n');
      fs.writeFileSync(path.join(contentDir, 'hello', name), 'x');
      expect(() => loadPosts(contentDir)).toThrow(new RegExp(`${name}: not a post file`));
    },
  );

  it('ignores hidden files such as .DS_Store', () => {
    write('hello', 'Body\n');
    fs.writeFileSync(path.join(contentDir, 'hello', '.DS_Store'), 'x');
    expect(loadPosts(contentDir)).toHaveLength(1);
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

  it('lets a draft translation differ while it is being written', () => {
    // The English status moved on; the Turkish draft has not caught up yet.
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', `${TRANSLATION}draft: true\n`, 'tr');
    const file = path.join(contentDir, 'hello', 'tr.md');
    fs.writeFileSync(
      file,
      fs.readFileSync(file, 'utf8').replace('status: verified', 'status: hypothesis'),
    );
    expect(loadPosts(contentDir).map((post) => post.lang)).toEqual(['en']);
  });

  it('checks a translation fully once it stops being a draft', () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const file = path.join(contentDir, 'hello', 'tr.md');
    fs.writeFileSync(
      file,
      fs.readFileSync(file, 'utf8').replace('status: verified', 'status: hypothesis'),
    );
    expect(() => loadPosts(contentDir)).toThrow(/tr\.md: status/);
  });

  it.each([
    ['topic', 'topic: testing', 'topic: ai'],
    ['kind', 'kind: essay', 'kind: note'],
    ['status', 'status: verified', 'status: hypothesis'],
    ['publishedAt', 'publishedAt: 2026-12-09', 'publishedAt: 2026-12-10'],
    ['evidence.recheckedAt', 'recheckedAt: 2026-12-09', 'recheckedAt: 2026-12-08'],
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

  it.each(['feed', 'now', 'topic', 'site'])(
    'refuses the slug "%s", which a blog file uses',
    (slug) => {
      write(slug, 'Body\n');
      expect(() => loadPosts(contentDir)).toThrow(new RegExp(`"${slug}" is reserved`));
    },
  );

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
      'blog/topic/testing.html',
      'tr/blog.html',
      'tr/blog/feed.xml',
      'tr/blog/hello.html',
      'tr/blog/topic/testing.html',
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
    const tr = read(dist, 'tr', 'blog', 'hello.html');
    expect(tr).toContain('<meta property="og:locale" content="tr_TR">');
    // The other versions only: the page's own locale is og:locale.
    expect(
      [...tr.matchAll(/og:locale:alternate" content="([a-z_A-Z]+)"/g)].map((m) => m[1]),
    ).toEqual(['en_US']);
    expect(read(dist, 'blog', 'hello.html')).toContain(
      '<meta property="og:locale:alternate" content="tr_TR">',
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
    const doc = new DOMParser().parseFromString(
      read(dist, 'tr', 'blog', 'hello.html'),
      'text/html',
    );
    // Links that say they lead to another language (hreflang) are the point
    // of the language menu; every other link must stay in Turkish.
    const local = [...doc.querySelectorAll('body a[href^="/"]:not([hreflang])')].map((a) =>
      a.getAttribute('href'),
    );
    expect(local.length).toBeGreaterThan(5);
    expect(local.filter((href) => !href!.startsWith('/tr'))).toEqual([]);
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

describe('buildBlog: hreflang across the whole build', () => {
  it('points every alternate at a page that exists and links back', async () => {
    write('all-three', 'Body\n');
    write('all-three', 'Gövde\n', TRANSLATION, 'tr');
    write('all-three', 'Tekst\n', TRANSLATION, 'nl');
    write('en-and-tr', 'Body\n');
    write('en-and-tr', 'Gövde\n', TRANSLATION, 'tr');
    write('en-only', 'Body\n');
    // Now logs in English and Turkish only, so the Now pages' alternates
    // are a subset of the languages, like a post's.
    const nowDir = path.join(root, 'now');
    fs.mkdirSync(nowDir);
    for (const lang of ['en', 'tr']) {
      fs.writeFileSync(
        path.join(nowDir, `${lang}.md`),
        '---\nentries:\n  - date: 2026-10-29\n    text: Building the blog.\n---\n',
      );
    }
    const dist = makeDist(root, 'dist');
    const written = await buildBlog({
      distDir: dist,
      contentDir,
      nowDir,
      themeInitPath,
      launched: false,
    });
    const pages = written.filter((file) => file.endsWith('.html'));
    expect(pages).toEqual(expect.arrayContaining(['blog/now.html', 'tr/blog/now.html']));
    expect(pages).not.toContain('nl/blog/now.html');
    const fileFor = (url: string) => `${new URL(url).pathname.slice(1)}.html`;
    const alternates = (file: string) =>
      new Map(
        [
          ...read(dist, file).matchAll(
            /<link rel="alternate" hreflang="([a-z-]+)" href="([^"]+)">/g,
          ),
        ]
          .filter((m) => m[1] !== 'x-default')
          .map((m) => [m[1], fileFor(m[2])]),
      );
    for (const page of pages) {
      const own = alternates(page);
      expect([...own.values()], page).toContain(page);
      for (const target of own.values()) {
        expect(pages, `${page} -> ${target}`).toContain(target);
        expect([...alternates(target).values()], `${target} -> ${page}`).toContain(page);
      }
    }
  });
});

describe('buildBlog: what a reader sees in another language', () => {
  async function build() {
    const dist = makeDist(root, 'dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    const doc = (...parts: string[]) =>
      new DOMParser().parseFromString(read(dist, ...parts), 'text/html');
    return { dist, doc };
  }

  it('offers the other versions of this post in the header, marking the current one', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    const { doc } = await build();
    const nav = doc('tr', 'blog', 'hello.html').querySelector('nav[aria-label="Dil"]')!;
    const links = [...nav.querySelectorAll('a')];
    expect(links.map((a) => [a.getAttribute('href'), a.lang, a.hreflang])).toEqual([
      ['/blog/hello', 'en', 'en'],
      ['/tr/blog/hello', 'tr', 'tr'],
    ]);
    expect(links[1].getAttribute('aria-current')).toBe('page');
    expect(links[0].textContent).toContain('English');
  });

  it('shows no language menu on a post that exists in one language only', async () => {
    write('hello', 'Body\n');
    const { doc } = await build();
    expect(doc('blog', 'hello.html').querySelector('nav[aria-label="Language"]')).toBeNull();
  });

  it('lists English-only posts on the Turkish index, marked and in English', async () => {
    write('both', 'Body\n');
    write('both', 'Gövde\n', TRANSLATION, 'tr');
    write('only-en', 'Body\n');
    const { doc } = await build();
    const index = doc('tr', 'blog.html');
    const english = index.querySelector('a[href="/blog/only-en"]')!;
    expect(english.closest('[lang="en"]')).not.toBeNull();
    expect(english.getAttribute('hreflang')).toBe('en');
    expect(english.closest('li')!.textContent).toContain('İngilizce');
    expect(index.querySelector('a[href="/tr/blog/both"]')!.closest('[lang="en"]')).toBeNull();
    expect(index.querySelector('a[href="/blog/both"]')).toBeNull();
  });

  it('tells the reader when the English version has changed since the translation', async () => {
    write('hello', 'Body\n', 'updatedAt: 2026-12-20\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    write('hello', 'Tekst\n', TRANSLATION.replace('2026-12-09', '2026-12-20'), 'nl');
    const { doc } = await build();
    const note = doc('tr', 'blog', 'hello.html').querySelector('.translation-note')!;
    expect(note.textContent).toContain('İngilizce sürüm bu çeviriden sonra değişti.');
    expect(note.querySelector('a')!.getAttribute('href')).toBe('/blog/hello');
    expect(doc('nl', 'blog', 'hello.html').querySelector('.translation-note')).toBeNull();
  });

  it('says how the translation was made in the "How this was written" panel', async () => {
    write('hello', 'Body\n');
    write('hello', 'Gövde\n', TRANSLATION, 'tr');
    write('hello', 'Tekst\n', TRANSLATION.replace('true', 'false'), 'nl');
    const { doc } = await build();
    const footer = (lang: string) =>
      doc(lang, 'blog', 'hello.html').querySelector('.ai-footer')!.textContent;
    expect(footer('tr')).toContain('Yapay zekânın yardımıyla çevrildi');
    expect(footer('nl')).toContain('Door mij vertaald.');
    expect(doc('blog', 'hello.html').querySelector('.ai-footer')!.textContent).not.toMatch(
      /Translated/,
    );
  });
});
