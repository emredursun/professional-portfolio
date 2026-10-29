// @vitest-environment jsdom
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildBlog } from '../../scripts/build-blog.js';
import { loadNow } from '../../scripts/blog/now.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

let root: string;
let contentDir: string;
let nowDir: string;
let themeInitPath: string;

const NOW = `---
entries:
  - date: 2026-10-28
    text: Writing the first Field Notes posts.
  - date: 2026-09-01
    text: Starting a Pega project in Utrecht.
---
`;

function writeNow(lang: string, source = NOW) {
  fs.mkdirSync(nowDir, { recursive: true });
  fs.writeFileSync(path.join(nowDir, `${lang}.md`), source);
}

const doc = (dist: string, ...parts: string[]) =>
  new DOMParser().parseFromString(fs.readFileSync(path.join(dist, ...parts), 'utf8'), 'text/html');

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-now-'));
  contentDir = path.join(root, 'content');
  nowDir = path.join(root, 'now');
  themeInitPath = path.join(root, 'theme-init.js');
  fs.writeFileSync(themeInitPath, 'document.documentElement.className = "js";\n');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('loadNow', () => {
  it('reads each language’s entries, newest first', () => {
    writeNow('en');
    writeNow('tr');
    const now = loadNow(nowDir);
    expect(Object.keys(now)).toEqual(['en', 'tr']);
    expect(now.en.map((entry: { date: string }) => entry.date)).toEqual([
      '2026-10-28',
      '2026-09-01',
    ]);
  });

  it('returns nothing when there is no log yet', () => {
    expect(loadNow(path.join(root, 'missing'))).toEqual({});
  });

  it('requires an English log, like every post', () => {
    writeNow('nl');
    expect(() => loadNow(nowDir)).toThrow(/now\/en\.md/);
  });

  it('fails when entries are not newest first, naming the file', () => {
    writeNow('en', NOW.replace('2026-10-28', '2026-08-01'));
    expect(() => loadNow(nowDir)).toThrow(/now\/en\.md.*newest first/);
  });

  it.each([
    ['an unknown key', NOW.replace('entries:', 'mood: good\nentries:')],
    ['an empty log', '---\nentries: []\n---\n'],
    ['a made-up date', NOW.replace('2026-09-01', '2026-02-30')],
    ['text in the body', `${NOW}Some prose.\n`],
  ])('rejects %s', (_, source) => {
    writeNow('en', source);
    expect(() => loadNow(nowDir)).toThrow(/now\/en\.md/);
  });

  it('rejects a file that is not a language', () => {
    writeNow('en');
    writeNow('de');
    expect(() => loadNow(nowDir)).toThrow(/de\.md/);
  });
});

describe('the Now page', () => {
  async function build() {
    writePost(contentDir, 'hello', 'Body\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    const written = await buildBlog({
      distDir: dist,
      contentDir,
      nowDir,
      themeInitPath,
      launched: false,
    });
    return { dist, written };
  }

  it('is written for each language that has a log, and lists its entries', async () => {
    writeNow('en');
    writeNow('tr');
    const { dist, written } = await build();
    expect(written).toContain('blog/now.html');
    expect(written).toContain('tr/blog/now.html');
    const page = doc(dist, 'tr', 'blog', 'now.html');
    expect(page.documentElement.lang).toBe('tr');
    expect([...page.querySelectorAll('.now-list time')].map((t) => t.textContent)).toEqual([
      '28 Ekim 2026',
      '1 Eylül 2026',
    ]);
    expect(page.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(3);
  });

  it('preloads its heading font, so the Bricolage h1 does not re-wrap when fonts load', async () => {
    writeNow('en');
    const { dist } = await build();
    const hrefs = [
      ...doc(dist, 'blog', 'now.html').querySelectorAll('link[rel="preload"][as="font"]'),
    ].map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/assets/bricolage-grotesque-latin-wght-normal-y2.woff2');
  });

  it('puts the newest entry on the index, linking to the page', async () => {
    writeNow('en');
    const { dist } = await build();
    const line = doc(dist, 'blog.html').querySelector('.now-line')!;
    expect(line.textContent).toContain('Writing the first Field Notes posts.');
    expect(line.querySelector('a')!.getAttribute('href')).toBe('/blog/now');
  });

  it('writes no Now page in a language that has no blog', async () => {
    writeNow('en');
    writeNow('nl');
    const { written } = await build();
    expect(written).not.toContain('nl/blog/now.html');
  });

  it('writes no page and no index line without a log', async () => {
    const { dist, written } = await build();
    expect(written).not.toContain('blog/now.html');
    expect(doc(dist, 'blog.html').querySelector('.now-line')).toBeNull();
  });
});
