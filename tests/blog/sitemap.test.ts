// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blogSitemapEntries, entriesFor } from '../../scripts/blog/sitemap.js';
import { loadPosts } from '../../scripts/blog/content.js';
import { loadNow } from '../../scripts/blog/now.js';
import { generateSitemap } from '../../scripts/generate-sitemap.js';
import { buildBlog } from '../../scripts/build-blog.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

let root: string;
let contentDir: string;
let nowDir: string;
const SITE = 'https://emredursun.nl';

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-sitemap-'));
  contentDir = path.join(root, 'content');
  nowDir = path.join(root, 'now');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// The page logic on loaded content; the launch gate has its own tests
// (launch-gate.test.ts), so these fixtures need not cover every language.
const entries = (launched = true) =>
  launched
    ? entriesFor({ posts: loadPosts(contentDir), now: loadNow(nowDir) })
    : blogSitemapEntries({ contentDir, nowDir, launched });
const byLoc = (loc: string) => entries().find((entry) => entry.loc === `${SITE}${loc}`);

describe('blogSitemapEntries', () => {
  it('lists nothing before launch, so the committed sitemap does not change', () => {
    writePost(contentDir, 'hello', 'Body\n');
    expect(entries(false)).toEqual([]);
  });

  it('lists every page the blog writes, in a stable order', () => {
    writePost(contentDir, 'hello', 'Body\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    fs.mkdirSync(nowDir);
    fs.writeFileSync(
      path.join(nowDir, 'en.md'),
      '---\nentries:\n  - date: 2026-12-20\n    text: Writing.\n---\n',
    );
    expect(entries().map((entry) => entry.loc.slice(SITE.length))).toEqual([
      '/blog',
      '/blog/hello',
      '/blog/topic/testing',
      '/blog/now',
      '/tr/blog',
      '/tr/blog/hello',
      '/tr/blog/topic/testing',
    ]);
  });

  it('dates a post by its last change and an index by its newest post', () => {
    writePost(contentDir, 'hello', 'Body\n', 'updatedAt: 2026-12-15\n');
    writePost(contentDir, 'other', 'Body\n');
    expect(byLoc('/blog/hello')!.lastmod).toBe('2026-12-15');
    expect(byLoc('/blog/other')!.lastmod).toBe('2026-12-09');
    expect(byLoc('/blog')!.lastmod).toBe('2026-12-15');
  });

  it('gives each page alternates only for the versions that exist, plus x-default', () => {
    writePost(contentDir, 'hello', 'Body\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    writePost(contentDir, 'only-en', 'Body\n');
    expect(byLoc('/blog/hello')!.alternates).toEqual([
      { lang: 'en', href: `${SITE}/blog/hello` },
      { lang: 'tr', href: `${SITE}/tr/blog/hello` },
      { lang: 'x-default', href: `${SITE}/blog/hello` },
    ]);
    expect(byLoc('/blog/only-en')!.alternates).toEqual([
      { lang: 'en', href: `${SITE}/blog/only-en` },
      { lang: 'x-default', href: `${SITE}/blog/only-en` },
    ]);
  });

  it('dates an index and a topic page by everything they show', () => {
    // /tr/blog also lists English posts with no Turkish version and the
    // newest Now entry, so either changing must move its lastmod.
    writePost(contentDir, 'hello', 'Body\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    writePost(contentDir, 'newer', 'Body\n', 'updatedAt: 2026-12-18\n');
    fs.mkdirSync(nowDir);
    for (const lang of ['en', 'tr']) {
      fs.writeFileSync(
        path.join(nowDir, `${lang}.md`),
        '---\nentries:\n  - date: 2026-12-22\n    text: Writing.\n---\n',
      );
    }
    expect(byLoc('/tr/blog')!.lastmod).toBe('2026-12-22');
    expect(byLoc('/tr/blog/topic/testing')!.lastmod).toBe('2026-12-18');
  });

  it('lists exactly the pages the blog build writes', async () => {
    // A launchable set (every language), through the real entry point.
    writePost(contentDir, 'hello', 'Body\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    writePost(contentDir, 'hello', 'Tekst\n', TRANSLATION, 'nl');
    writePost(contentDir, 'only-en', 'Body\n');
    const file = path.join(contentDir, 'only-en', 'en.md');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('topic: testing', 'topic: ai'));
    fs.mkdirSync(nowDir);
    fs.writeFileSync(
      path.join(nowDir, 'en.md'),
      '---\nentries:\n  - date: 2026-12-22\n    text: Writing.\n---\n',
    );
    const themeInitPath = path.join(root, 'theme-init.js');
    fs.writeFileSync(themeInitPath, '');
    const written = await buildBlog({
      distDir: makeDist(root, 'dist'),
      contentDir,
      nowDir,
      themeInitPath,
      launched: true,
    });
    const pages = written
      .filter((file) => file.endsWith('.html'))
      .map((file) => `${SITE}/${file.slice(0, -'.html'.length)}`)
      .sort();
    expect(
      blogSitemapEntries({ contentDir, nowDir, launched: true })
        .map((entry) => entry.loc)
        .sort(),
    ).toEqual(pages);
  });
});

describe('generateSitemap with blog entries', () => {
  it('appends each entry with its own alternates and leaves the portfolio part alone', () => {
    const lastMod = { '/about': '2026-10-01T00:00:00.000Z' };
    const without = generateSitemap(lastMod);
    const blog = [
      {
        loc: `${SITE}/blog/hello`,
        lastmod: '2026-12-15',
        alternates: [
          { lang: 'en', href: `${SITE}/blog/hello` },
          { lang: 'x-default', href: `${SITE}/blog/hello` },
        ],
      },
    ];
    const withBlog = generateSitemap(lastMod, {}, blog);
    expect(withBlog.startsWith(without.replace(/\n<\/urlset>$/, ''))).toBe(true);
    expect(withBlog).toContain(`<loc>${SITE}/blog/hello</loc>`);
    expect(withBlog).toContain('<lastmod>2026-12-15</lastmod>');
    const entry = withBlog.slice(withBlog.indexOf(`<loc>${SITE}/blog/hello</loc>`));
    expect(entry.match(/xhtml:link/g)).toHaveLength(2);
    expect(generateSitemap(lastMod, {}, [])).toBe(without);
  });
});
