// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BLOG_ENTRY, readBlogAssets } from '../../scripts/blog/manifest.js';

let dist: string;

function writeManifest(manifest: unknown) {
  fs.mkdirSync(path.join(dist, '.vite'), { recursive: true });
  fs.writeFileSync(path.join(dist, '.vite', 'manifest.json'), JSON.stringify(manifest));
}

beforeEach(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-manifest-'));
});

afterEach(() => {
  fs.rmSync(dist, { recursive: true, force: true });
});

describe('readBlogAssets', () => {
  it('returns the hashed script, styles and fonts of the blog entry', () => {
    writeManifest({
      'index.html': { file: 'assets/main-1.js', isEntry: true },
      [BLOG_ENTRY]: {
        file: 'assets/article-abc.js',
        isEntry: true,
        css: ['assets/article-def.css'],
        assets: ['assets/newsreader-latin-400.woff2', 'assets/logo.svg'],
      },
    });
    expect(readBlogAssets(dist)).toEqual({
      script: '/assets/article-abc.js',
      styles: ['/assets/article-def.css'],
      fonts: ['/assets/newsreader-latin-400.woff2'],
    });
  });

  it('explains what to do when the build has not run', () => {
    expect(() => readBlogAssets(dist)).toThrow(/vite build/);
  });

  it('fails when the manifest has no blog entry', () => {
    writeManifest({ 'index.html': { file: 'assets/main-1.js', isEntry: true } });
    expect(() => readBlogAssets(dist)).toThrow(BLOG_ENTRY);
  });

  it('fails when the blog entry pulls in a shared chunk, such as the React vendor bundle', () => {
    writeManifest({
      [BLOG_ENTRY]: { file: 'assets/article-abc.js', isEntry: true, imports: ['_vendor-react.js'] },
    });
    expect(() => readBlogAssets(dist)).toThrow(/shared chunk/);
  });

  it('allows an empty imports list', () => {
    writeManifest({ [BLOG_ENTRY]: { file: 'assets/a.js', isEntry: true, imports: [] } });
    expect(readBlogAssets(dist).styles).toEqual([]);
  });

  it('rejects paths that would leave the assets folder', () => {
    writeManifest({ [BLOG_ENTRY]: { file: '../evil.js', isEntry: true } });
    expect(() => readBlogAssets(dist)).toThrow(/assets/);
  });
});
