// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blogSitemapEntries } from '../../scripts/blog/sitemap.js';
import { generateSitemap } from '../../scripts/generate-sitemap.js';
import { TRANSLATION, writePost } from './fixtures';

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

const entries = (launched = true) => blogSitemapEntries({ contentDir, nowDir, launched });
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
