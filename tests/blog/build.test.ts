// @vitest-environment node
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBlog, main, writeOutput } from '../../scripts/build-blog.js';
import { loadPosts } from '../../scripts/blog/content.js';
import { BLOG_ENTRY } from '../../scripts/blog/manifest.js';

let root: string;
let contentDir: string;
let themeInitPath: string;

const FRONTMATTER = `---
title: A green test
description: What a passing run tells you.
publishedAt: 2026-12-09
topic: testing
kind: essay
status: verified
evidence:
  confidence: High
  basedOn:
    - My own work
  recheckedAt: 2026-12-09
aiAssistance:
  mine:
    - Everything
  assisted: []
---
`;

function writePost(slug: string, body: string, extra = '', lang = 'en') {
  const dir = path.join(contentDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const source = FRONTMATTER.replace('aiAssistance:', `${extra}aiAssistance:`) + body;
  fs.writeFileSync(path.join(dir, `${lang}.md`), source);
}

function makeDist(name: string) {
  const dist = path.join(root, name);
  fs.mkdirSync(path.join(dist, '.vite'), { recursive: true });
  fs.writeFileSync(
    path.join(dist, '.vite', 'manifest.json'),
    JSON.stringify({
      [BLOG_ENTRY]: {
        file: 'assets/article-abc.js',
        isEntry: true,
        css: ['assets/article-def.css'],
        assets: [
          'assets/newsreader-latin-400-normal-x1.woff2',
          'assets/bricolage-grotesque-latin-wght-normal-y2.woff2',
        ],
      },
    }),
  );
  return dist;
}

function hashTree(dir: string) {
  const files = fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
  return files.map((file) => [
    path.relative(dir, file).split(path.sep).join('/'),
    crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  ]);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-build-'));
  contentDir = path.join(root, 'content');
  themeInitPath = path.join(root, 'theme-init.js');
  fs.writeFileSync(themeInitPath, 'document.documentElement.className = "js";\n');
});

afterEach(() => {
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

describe('loadPosts', () => {
  it('reads posts in a stable order, with slug and language from the path', () => {
    writePost('zeta', 'Z body\n');
    writePost('alpha', 'A body\n');
    const posts = loadPosts(contentDir);
    expect(posts.map((post) => [post.slug, post.lang])).toEqual([
      ['alpha', 'en'],
      ['zeta', 'en'],
    ]);
  });

  it('leaves drafts out', () => {
    writePost('ready', 'Body\n');
    writePost('later', 'Body\n', 'draft: true\n');
    expect(loadPosts(contentDir).map((post) => post.slug)).toEqual(['ready']);
  });

  it('works out the reading time, at least one minute, ignoring code', () => {
    const words = Array.from({ length: 660 }, () => 'word').join(' ');
    writePost('long', `${words}\n\n\`\`\`ts\n${'const x = 1;\n'.repeat(500)}\`\`\`\n`);
    writePost('short', 'Tiny.\n');
    const posts = loadPosts(contentDir);
    expect(posts.find((post) => post.slug === 'long')?.minutes).toBe(3);
    expect(posts.find((post) => post.slug === 'short')?.minutes).toBe(1);
  });

  it('rejects a folder name that is not a valid slug', () => {
    writePost('Bad_Slug', 'Body\n');
    expect(() => loadPosts(contentDir)).toThrow(/Bad_Slug/);
  });

  it('rejects a language the blog does not publish', () => {
    writePost('hello', 'Body\n');
    writePost('hello', 'Hallo\n', '', 'de');
    expect(() => loadPosts(contentDir)).toThrow(/de\.md/);
  });

  it('returns nothing when there is no content folder yet', () => {
    expect(loadPosts(path.join(root, 'missing'))).toEqual([]);
  });
});

describe('buildBlog', () => {
  it('writes one HTML page per post and returns their paths', async () => {
    writePost('a-green-test', '## Part\n\nText.\n');
    const dist = makeDist('dist');
    const written = await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    expect(written).toEqual(['blog.html', 'blog/a-green-test.html']);
    const html = fs.readFileSync(path.join(dist, 'blog', 'a-green-test.html'), 'utf8');
    expect(html).toContain('<h1>A green test</h1>');
    expect(html).toContain('<h2 id="part">Part</h2>');
    expect(html).toContain('noindex, nofollow');
    expect(html).toMatch(/\/assets\/blog-theme-init-[0-9a-f]{8}\.js/);
    expect(html).toContain('/assets/bricolage-grotesque-latin-wght-normal-y2.woff2');
    const index = fs.readFileSync(path.join(dist, 'blog.html'), 'utf8');
    expect(index).toContain('/assets/newsreader-latin-400-normal-x1.woff2');
  });

  it('emits the code colours only when a post has code', async () => {
    writePost('plain', 'No code.\n');
    const plain = makeDist('plain');
    await buildBlog({ distDir: plain, contentDir, themeInitPath, launched: false });
    expect(fs.readdirSync(path.join(plain, 'assets')).some((f) => f.includes('blog-code'))).toBe(
      false,
    );

    writePost('coded', '```ts\nconst a = 1;\n```\n');
    const coded = makeDist('coded');
    await buildBlog({ distDir: coded, contentDir, themeInitPath, launched: false });
    const css = fs.readdirSync(path.join(coded, 'assets')).find((f) => f.includes('blog-code'));
    expect(css).toBeDefined();
    const page = fs.readFileSync(path.join(coded, 'blog', 'coded.html'), 'utf8');
    expect(page).toContain(`/assets/${css}`);
  });

  it('is byte-for-byte deterministic, whatever the clock says', async () => {
    writePost('one', '## A\n\n```ts\nconst a = 1;\n```\n');
    writePost('two', 'Text with a [link](https://example.com).\n');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    const first = makeDist('first');
    await buildBlog({ distDir: first, contentDir, themeInitPath, launched: false });
    vi.setSystemTime(new Date('2030-06-15T12:00:00Z'));
    const second = makeDist('second');
    await buildBlog({ distDir: second, contentDir, themeInitPath, launched: false });
    expect(hashTree(second)).toEqual(hashTree(first));
  });

  it('writes LF line endings and URL paths with forward slashes only', async () => {
    writePost('one', 'Line one\r\nLine two\r\n');
    const dist = makeDist('dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    const html = fs.readFileSync(path.join(dist, 'blog', 'one.html'), 'utf8');
    expect(html).not.toContain('\r');
    expect(html).not.toContain('\\');
  });

  it('fails clearly when Vite has not built the blog assets', async () => {
    writePost('one', 'Body\n');
    const dist = path.join(root, 'empty');
    fs.mkdirSync(dist);
    await expect(
      buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false }),
    ).rejects.toThrow(/vite build/);
  });

  it('writes nothing when there are no posts', async () => {
    const dist = makeDist('dist');
    expect(await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false })).toEqual(
      [],
    );
    expect(fs.existsSync(path.join(dist, 'blog'))).toBe(false);
  });
});

describe('writeOutput', () => {
  it.each([
    '../escape.html',
    'blog/../../escape.html',
    'blog/a/b.html',
    'other.html',
    'blog/x.js',
    'de/blog.html',
    'tr/blog/../../x.html',
    'blog/Upper.html',
    'blog/topic/testing.xml',
    'blog/topic/a/b.html',
    'tr/other/blog.html',
  ])('refuses %s', (file) => {
    expect(() => writeOutput(root, file, 'x')).toThrow(/refusing/);
  });

  it('writes the index, the feed and posts', () => {
    expect(writeOutput(root, 'blog.html', 'i')).toBe('blog.html');
    expect(writeOutput(root, 'blog/feed.xml', 'f')).toBe('blog/feed.xml');
    expect(fs.readFileSync(path.join(root, 'blog', 'feed.xml'), 'utf8')).toBe('f');
  });

  it.each(['tr/blog.html', 'nl/blog/a-post.html', 'tr/blog/feed.xml', 'blog/topic/testing.html'])(
    'writes the language and topic file %s',
    (file) => {
      expect(writeOutput(root, file, 'x')).toBe(file);
    },
  );
});

describe('main', () => {
  it('builds from a repository root and reports the pages', async () => {
    writePost('one', 'Body\n');
    fs.renameSync(contentDir, path.join(root, 'content-tmp'));
    fs.mkdirSync(path.join(root, 'blog', 'client'), { recursive: true });
    fs.renameSync(path.join(root, 'content-tmp'), path.join(root, 'blog', 'content'));
    fs.copyFileSync(themeInitPath, path.join(root, 'blog', 'client', 'theme-init.js'));
    makeDist('dist');
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    expect(await main(root)).toBe(0);
    expect(out).toHaveBeenCalledWith('blog: 2 file(s)\n  blog.html\n  blog/one.html\n');
  });

  it('prints the error and returns 1 when the build fails', async () => {
    writePost('one', 'Body\n');
    fs.mkdirSync(path.join(root, 'blog'), { recursive: true });
    fs.renameSync(contentDir, path.join(root, 'blog', 'content'));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await main(root)).toBe(1);
    expect(err).toHaveBeenCalledWith(expect.stringMatching(/vite build/));
  });
});

describe('loadPosts: reading time', () => {
  it('skips code in fences of four or more backticks too', () => {
    const words = Array.from({ length: 220 }, () => 'word').join(' ');
    const code = 'token '.repeat(2000);
    writePost('fenced', `${words}\n\n\`\`\`\`text\n${code}\n\`\`\`\`\n`);
    expect(loadPosts(contentDir)[0].minutes).toBe(1);
  });
});

describe('buildBlog: launch and related posts', () => {
  it('writes the feed only once the blog has launched', async () => {
    writePost('one', 'Body\n');
    const before = makeDist('before');
    await buildBlog({ distDir: before, contentDir, themeInitPath, launched: false });
    expect(fs.existsSync(path.join(before, 'blog', 'feed.xml'))).toBe(false);

    const after = makeDist('after');
    const written = await buildBlog({ distDir: after, contentDir, themeInitPath, launched: true });
    expect(written).toContain('blog/feed.xml');
    expect(fs.readFileSync(path.join(after, 'blog', 'one.html'), 'utf8')).not.toContain('noindex');
  });

  it('ends each article with the two newest other posts', async () => {
    const date = (day: string) => `\npublishedAt: 2026-10-${day}\n`;
    writePost('first', 'Body\n');
    writePost('second', 'Body\n');
    writePost('third', 'Body\n');
    for (const [slug, day] of [
      ['first', '01'],
      ['second', '02'],
      ['third', '03'],
    ]) {
      const file = path.join(contentDir, slug, 'en.md');
      fs.writeFileSync(
        file,
        fs.readFileSync(file, 'utf8').replace(/\npublishedAt: [\d-]+\n/, date(day)),
      );
    }
    const dist = makeDist('dist');
    await buildBlog({ distDir: dist, contentDir, themeInitPath, launched: false });
    const related = (slug: string) =>
      [
        ...fs
          .readFileSync(path.join(dist, 'blog', `${slug}.html`), 'utf8')
          .matchAll(/<section class="more"[\s\S]*?<\/section>/g),
      ].flatMap((m) => [...m[0].matchAll(/href="\/blog\/([a-z-]+)"/g)].map((h) => h[1]));
    expect(related('first')).toEqual(['third', 'second']);
    expect(related('third')).toEqual(['second', 'first']);
  });
});
