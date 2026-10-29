// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadPosts } from '../../scripts/blog/content.js';
import { scaffoldPost } from '../../scripts/blog/scaffold.js';

let contentDir: string;

beforeEach(() => {
  contentDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'blog-new-')), 'content');
});

afterEach(() => {
  fs.rmSync(path.dirname(contentDir), { recursive: true, force: true });
});

const publish = (slug: string) => {
  for (const lang of ['en', 'tr', 'nl']) {
    const file = path.join(contentDir, slug, `${lang}.md`);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('draft: true', 'draft: false'));
  }
};

describe('scaffoldPost', () => {
  it('writes English, Turkish and Dutch drafts the build accepts and keeps out', () => {
    const files = scaffoldPost({ contentDir, slug: 'green-tests', today: '2026-11-02' });
    expect(files).toEqual([
      'blog/content/green-tests/en.md',
      'blog/content/green-tests/tr.md',
      'blog/content/green-tests/nl.md',
    ]);
    expect(loadPosts(contentDir)).toEqual([]);
  });

  it('gives a post whose versions agree once its drafts are published', () => {
    scaffoldPost({ contentDir, slug: 'agents', kind: 'note', topic: 'ai', today: '2026-11-02' });
    publish('agents');
    const posts = loadPosts(contentDir);
    expect(posts.map((post) => post.lang)).toEqual(['en', 'nl', 'tr']);
    expect(posts.every((post) => post.kind === 'note' && post.topic === 'ai')).toBe(true);
    expect(posts.find((post) => post.lang === 'tr')!.translation).toEqual({
      from: '2026-11-02',
      assistedByAi: false,
    });
    expect(posts.every((post) => post.placeholder === undefined)).toBe(true);
  });

  it.each([
    ['an invalid slug', { slug: 'Green_Tests' }, /lowercase/],
    ['a reserved slug', { slug: 'feed' }, /reserved/],
    ['an unknown kind', { slug: 'x', kind: 'poem' }, /kind/],
    ['an unknown topic', { slug: 'x', topic: 'cooking' }, /topic/],
  ])('refuses %s', (_, options, message) => {
    expect(() => scaffoldPost({ contentDir, today: '2026-11-02', ...options })).toThrow(message);
  });

  it('never overwrites a post that exists', () => {
    scaffoldPost({ contentDir, slug: 'green-tests', today: '2026-11-02' });
    expect(() => scaffoldPost({ contentDir, slug: 'green-tests', today: '2026-11-03' })).toThrow(
      /already exists/,
    );
  });
});
