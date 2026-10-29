// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lighthouseUrls } from '../scripts/lighthouse-urls.js';
import { BLOG_LAUNCHED } from '../scripts/blog/config.js';

let dist: string;
const touch = (...files: string[]) =>
  files.forEach((file) => {
    fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
    fs.writeFileSync(path.join(dist, file), '');
  });
const config = {
  ci: { collect: { url: ['http://localhost:4181/about', 'http://localhost:4181/contact'] } },
};

beforeEach(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-urls-'));
});

afterEach(() => {
  fs.rmSync(dist, { recursive: true, force: true });
});

describe('lighthouseUrls', () => {
  it('adds the blog pages the build wrote to the portfolio pages', () => {
    touch(
      'blog.html',
      'blog/b-post.html',
      'blog/a-post.html',
      'blog/now.html',
      'blog/topic/testing.html',
      'tr/blog.html',
      'tr/blog/a-post.html',
      'nl/blog.html',
      'nl/blog/a-post.html',
    );
    expect(lighthouseUrls({ config, distDir: dist })).toEqual([
      'http://localhost:4181/about',
      'http://localhost:4181/contact',
      'http://localhost:4181/blog',
      'http://localhost:4181/blog/a-post',
      'http://localhost:4181/blog/now',
      'http://localhost:4181/tr/blog',
      'http://localhost:4181/tr/blog/a-post',
      'http://localhost:4181/nl/blog/a-post',
    ]);
  });

  it('follows the content: no Dutch blog, no Now page, no Dutch URLs', () => {
    touch('blog.html', 'blog/only.html', 'tr/blog.html', 'tr/blog/only.html');
    expect(lighthouseUrls({ config, distDir: dist })).toEqual([
      'http://localhost:4181/about',
      'http://localhost:4181/contact',
      'http://localhost:4181/blog',
      'http://localhost:4181/blog/only',
      'http://localhost:4181/tr/blog',
      'http://localhost:4181/tr/blog/only',
    ]);
  });

  it('fails without a blog in dist rather than quietly measuring less', () => {
    expect(() => lighthouseUrls({ config, distDir: dist })).toThrow(/dist\/blog\.html/);
  });

  it('checks blog pages are crawlable exactly when the blog has launched', () => {
    // Before launch every blog page is noindex, so the audit would fail;
    // after it, nothing else would catch a page left noindex.
    for (const file of ['lighthouserc.json', 'lighthouserc.mobile.json']) {
      const blog = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', file), 'utf8'),
      ).ci.assert.assertMatrix.find((entry: { matchingUrlPattern: string }) =>
        entry.matchingUrlPattern.includes('blog(?:/.*)?$'),
      );
      expect(blog, `${file} has a blog assertion block`).toBeDefined();
      expect(blog.assertions['is-crawlable'], file).toEqual(
        BLOG_LAUNCHED ? ['error', { minScore: 1 }] : undefined,
      );
    }
  });

  it('keeps the committed configs free of blog URLs, which come from the build', () => {
    for (const file of ['lighthouserc.json', 'lighthouserc.mobile.json']) {
      const urls: string[] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'))
        .ci.collect.url;
      expect(
        urls.filter((url) => url.includes('/blog')),
        file,
      ).toEqual([]);
    }
  });
});
