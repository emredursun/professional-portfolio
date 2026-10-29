// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildBlog } from '../../scripts/build-blog.js';
import { loadPosts } from '../../scripts/blog/content.js';
import { launchProblems } from '../../scripts/blog/launch-gate.js';
import { loadNow } from '../../scripts/blog/now.js';
import { blogForAgents } from '../../scripts/blog/agents.js';
import { blogSitemapEntries } from '../../scripts/blog/sitemap.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

let root: string;
let contentDir: string;
let nowDir: string;

const NOW = (extra = '') =>
  `---\nentries:\n  - date: 2026-12-20\n    text: Writing.\n${extra}---\n`;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-gate-'));
  contentDir = path.join(root, 'content');
  nowDir = path.join(root, 'now');
  fs.mkdirSync(nowDir);
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const problems = () => launchProblems({ posts: loadPosts(contentDir), now: loadNow(nowDir) });

describe('the placeholder flag', () => {
  it('is accepted on posts and on Now entries, and only as true', () => {
    writePost(contentDir, 'sample', 'Body\n', 'placeholder: true\n');
    fs.writeFileSync(path.join(nowDir, 'en.md'), NOW('    placeholder: true\n'));
    expect(loadPosts(contentDir)[0].placeholder).toBe(true);
    expect(loadNow(nowDir).en[0].placeholder).toBe(true);
    writePost(contentDir, 'other', 'Body\n', 'placeholder: false\n');
    expect(() => loadPosts(contentDir)).toThrow(/other\/en\.md: placeholder/);
  });
});

describe('launchProblems', () => {
  it('finds nothing in real content', () => {
    writePost(contentDir, 'real', 'Body\n');
    writePost(contentDir, 'real', 'Gövde\n', TRANSLATION, 'tr');
    fs.writeFileSync(path.join(nowDir, 'en.md'), NOW());
    expect(problems()).toEqual([]);
  });

  it('names every placeholder post and Now log', () => {
    writePost(contentDir, 'sample', 'Body\n', 'placeholder: true\n');
    writePost(contentDir, 'sample', 'Gövde\n', `${TRANSLATION}placeholder: true\n`, 'tr');
    fs.writeFileSync(path.join(nowDir, 'en.md'), NOW('    placeholder: true\n'));
    expect(problems()).toEqual([
      'blog/content/sample/en.md is a placeholder',
      'blog/content/sample/tr.md is a placeholder',
      'blog/now/en.md has a placeholder entry',
    ]);
  });

  it('names a translation the English version has outgrown', () => {
    writePost(contentDir, 'real', 'Body\n', 'updatedAt: 2026-12-20\n');
    writePost(contentDir, 'real', 'Gövde\n', TRANSLATION, 'tr');
    expect(problems()).toEqual([
      'blog/content/real/tr.md follows an older English version (update it and translation.from)',
    ]);
  });
});

describe('buildBlog and the launch gate', () => {
  async function build(launched: boolean) {
    const themeInitPath = path.join(root, 'theme-init.js');
    fs.writeFileSync(themeInitPath, '');
    return buildBlog({
      distDir: makeDist(root, 'dist'),
      contentDir,
      nowDir,
      themeInitPath,
      launched,
    });
  }

  it('refuses to launch with placeholders, listing each', async () => {
    writePost(contentDir, 'sample', 'Body\n', 'placeholder: true\n');
    await expect(build(true)).rejects.toThrow(
      /not ready to launch:\n- blog\/content\/sample\/en\.md is a placeholder/,
    );
  });

  it('builds placeholders freely before launch', async () => {
    writePost(contentDir, 'sample', 'Body\n', 'placeholder: true\n');
    await expect(build(false)).resolves.toContain('blog/sample.html');
  });
});

describe('the repository samples', () => {
  it('are marked as placeholders, so they can never launch', () => {
    const repo = path.join(__dirname, '..', '..');
    const posts = loadPosts(path.join(repo, 'blog', 'content'));
    const samples = posts.filter((post) => post.slug.startsWith('sample-'));
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.every((post) => post.placeholder === true)).toBe(true);
  });
});

describe('every launched reader of the content applies the gate', () => {
  // The sitemap runs in prebuild, before the blog build would refuse, so it
  // must refuse too, or a launched sitemap could list sample pages.
  it.each([
    ['the sitemap', () => blogSitemapEntries({ contentDir, nowDir, launched: true })],
    ['llms.txt', () => blogForAgents({ contentDir, launched: true })],
  ])('%s refuses placeholders once launched', (_, read) => {
    writePost(contentDir, 'sample', 'Body\n', 'placeholder: true\n');
    expect(read).toThrow(/not ready to launch:\n- blog\/content\/sample\/en\.md/);
  });

  it('and reads freely before launch', () => {
    writePost(contentDir, 'sample', 'Body\n', 'placeholder: true\n');
    expect(blogSitemapEntries({ contentDir, nowDir, launched: false })).toEqual([]);
    expect(blogForAgents({ contentDir, launched: false })).toEqual([]);
  });
});
