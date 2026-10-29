// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildBlog } from '../../scripts/build-blog.js';
import { OG_SIZE, ogCards, ogHash, readOgImages, syncOgImages } from '../../scripts/blog/og.js';
import { renderOgCard } from '../../scripts/blog/templates/og-card.js';
import { TRANSLATION, makeDist, writePost } from './fixtures';

let root: string;
let contentDir: string;
let ogDir: string;
let themeInitPath: string;

const post = { slug: 'hello', lang: 'en', title: 'Hello', status: 'verified', topic: 'testing' };
const fakePng = (id: string) => Buffer.from(`png:${id}`);
const render = async (card: { id: string }) => fakePng(card.id);

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-og-'));
  contentDir = path.join(root, 'content');
  ogDir = path.join(root, 'og');
  themeInitPath = path.join(root, 'theme-init.js');
  fs.writeFileSync(themeInitPath, 'document.documentElement.className = "js";\n');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('ogCards and ogHash', () => {
  it('needs one card per post and language, and one per blog language', () => {
    const cards = ogCards([post, { ...post, lang: 'tr', title: 'Merhaba' }], ['en', 'tr']);
    expect(cards.map((card) => card.id)).toEqual(['hello.en', 'hello.tr', '_site.en', '_site.tr']);
    expect(cards[3]).toMatchObject({ kind: 'site', lang: 'tr' });
  });

  it('changes the hash when anything on the card changes, and only then', () => {
    const [card] = ogCards([post], []);
    expect(ogHash(card)).toBe(ogHash({ ...card }));
    expect(ogHash({ ...card, title: 'Hello!' })).not.toBe(ogHash(card));
    expect(ogHash({ ...card, status: 'revised' })).not.toBe(ogHash(card));
    expect(ogHash({ ...card, lang: 'nl' })).not.toBe(ogHash(card));
  });
});

describe('syncOgImages and readOgImages', () => {
  it('renders what is missing, keeps what is current and removes what no card needs', async () => {
    const cards = ogCards([post], ['en']);
    fs.mkdirSync(ogDir);
    fs.writeFileSync(path.join(ogDir, 'gone.en.png'), 'old');
    const first = await syncOgImages({ ogDir, cards, render });
    expect(first).toEqual({ rendered: ['hello.en', '_site.en'], removed: ['gone.en'] });
    const second = await syncOgImages({ ogDir, cards, render });
    expect(second).toEqual({ rendered: [], removed: [] });
    const manifest = JSON.parse(fs.readFileSync(path.join(ogDir, 'manifest.json'), 'utf8'));
    expect(Object.keys(manifest)).toEqual(['_site.en', 'hello.en']);
  });

  it('returns every committed card when all are current', async () => {
    const cards = ogCards([post], ['en']);
    await syncOgImages({ ogDir, cards, render });
    const images = readOgImages({ ogDir, cards });
    expect(images.get('hello.en')!.equals(fakePng('hello.en'))).toBe(true);
  });

  it('fails the build, naming each card, when one is missing or out of date', async () => {
    const cards = ogCards([post], ['en']);
    await syncOgImages({ ogDir, cards, render });
    const renamed = ogCards(
      [
        { ...post, title: 'Hello again' },
        { ...post, slug: 'new' },
      ],
      ['en'],
    );
    expect(() => readOgImages({ ogDir, cards: renamed })).toThrow(
      /hello\.en, new\.en.*npm run blog:og/,
    );
  });
});

describe('renderOgCard', () => {
  it('escapes the title and labels the card in its language', () => {
    const [card] = ogCards([{ ...post, lang: 'tr', title: '<script>x</script>' }], []);
    const html = renderOgCard({ card, fontCss: '' });
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<html lang="tr">');
    expect(html).toContain('Doğrulandı');
  });
});

describe('buildBlog with link-preview images', () => {
  async function build() {
    writePost(contentDir, 'hello', 'Body\n');
    writePost(contentDir, 'hello', 'Gövde\n', TRANSLATION, 'tr');
    const dist = makeDist(root, 'dist');
    return {
      dist,
      run: () => buildBlog({ distDir: dist, contentDir, ogDir, themeInitPath, launched: false }),
    };
  }
  const read = (dist: string, ...parts: string[]) =>
    fs.readFileSync(path.join(dist, ...parts), 'utf8');
  const meta = (html: string, property: string) =>
    html.match(new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)">`))?.[1];

  it('fails until the images have been rendered', async () => {
    const { run } = await build();
    await expect(run()).rejects.toThrow(/hello\.en.*npm run blog:og/);
  });

  it('gives each article its own card and the other pages their language’s card', async () => {
    const { dist, run } = await build();
    const posts = [
      { ...post, title: 'A green test' },
      { ...post, lang: 'tr', title: 'A green test' },
    ];
    await syncOgImages({ ogDir, cards: ogCards(posts, ['en', 'tr']), render });
    await run();
    const article = read(dist, 'tr', 'blog', 'hello.html');
    const image = meta(article, 'og:image')!;
    expect(image).toMatch(/^https:\/\/emredursun\.nl\/assets\/blog-og-hello-tr-[0-9a-f]{8}\.png$/);
    expect(
      fs.readFileSync(path.join(dist, new URL(image).pathname)).equals(fakePng('hello.tr')),
    ).toBe(true);
    expect(meta(article, 'twitter:image')).toBe(image);
    expect(meta(article, 'og:image:type')).toBe('image/png');
    expect(meta(article, 'og:image:width')).toBe(String(OG_SIZE.width));
    expect(meta(article, 'og:image:alt')).toBe('A green test');
    const ld = JSON.parse(
      article.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1],
    );
    expect(ld.image).toBe(image);
    const index = read(dist, 'tr', 'blog.html');
    expect(meta(index, 'og:image')).toMatch(/\/assets\/blog-og-site-tr-[0-9a-f]{8}\.png$/);
  });
});

describe('committed link-preview images', () => {
  const dir = path.join(__dirname, '..', '..', 'blog', 'og');
  const pngs = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.png')) : [];

  it.each(pngs)('%s is 1200 × 630 and under 150 KB', async (file) => {
    const { width, height, format } = await sharp(path.join(dir, file)).metadata();
    expect({ width, height, format }).toEqual({ ...OG_SIZE, format: 'png' });
    expect(fs.statSync(path.join(dir, file)).size).toBeLessThan(150 * 1024);
  });
});
