// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST_IMAGE, emitPostImages } from '../../scripts/blog/images.js';

let root: string;
let contentDir: string;
let distDir: string;

const svg = (body = '<rect width="10" height="10"/>', size = 'viewBox="0 0 640 320"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${size}>${body}</svg>`;
const put = (slug: string, name: string, content: string | Buffer) => {
  fs.mkdirSync(path.join(contentDir, slug), { recursive: true });
  fs.writeFileSync(path.join(contentDir, slug, name), content);
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-images-'));
  contentDir = path.join(root, 'content');
  distDir = path.join(root, 'dist');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('POST_IMAGE', () => {
  it.each(['chart.svg', 'trace-chain.png', 'a1.jpg', 'x.webp'])('accepts %s', (name) => {
    expect(POST_IMAGE.test(name)).toBe(true);
  });

  it.each(['/images/a.svg', 'sub/a.svg', 'A.svg', 'a.gif', 'a.svg.md', '../a.svg'])(
    'refuses %s',
    (name) => {
      expect(POST_IMAGE.test(name)).toBe(false);
    },
  );
});

describe('emitPostImages', () => {
  it('copies each image under a content hash and reports its size', async () => {
    put('hello', 'chart.svg', svg());
    const images = await emitPostImages({ distDir, contentDir, slugs: ['hello'] });
    const chart = images.get('hello/chart.svg')!;
    expect(chart).toMatchObject({ width: 640, height: 320 });
    expect(chart.src).toMatch(/^\/assets\/blog-img-hello-chart-[0-9a-f]{8}\.svg$/);
    expect(fs.readFileSync(path.join(distDir, chart.src), 'utf8')).toBe(svg());
  });

  it('sizes raster images from their pixels', async () => {
    const png = await sharp({
      create: { width: 300, height: 200, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
    put('hello', 'photo.png', png);
    const images = await emitPostImages({ distDir, contentDir, slugs: ['hello'] });
    expect(images.get('hello/photo.png')).toMatchObject({ width: 300, height: 200 });
  });

  it('ignores the Markdown files and posts without images', async () => {
    put('hello', 'en.md', '---\n---\n');
    expect((await emitPostImages({ distDir, contentDir, slugs: ['hello'] })).size).toBe(0);
  });

  it.each([
    ['a script', '<script>alert(1)</script>'],
    ['an event handler', '<rect width="1" height="1" onload="alert(1)"/>'],
    ['embedded HTML', '<foreignObject><div/></foreignObject>'],
    ['an outside reference', '<image href="https://cdn.example/x.png"/>'],
    ['an outside xlink reference', '<use xlink:href="other.svg#a"/>'],
    ['an upper-case script', '<SCRIPT>alert(1)</SCRIPT>'],
    ['a reference under another namespace prefix', '<use l:href="https://cdn.example/x.svg"/>'],
    ['a DOCTYPE', '<!DOCTYPE svg [<!ENTITY x "y">]>'],
    ['a stylesheet import', '<style>@import "https://cdn.example/x.css";</style>'],
    ['an outside url()', '<rect fill="url(https://cdn.example/x.svg#p)"/>'],
    ['an animated link', '<set attributeName="href" to="https://cdn.example"/>'],
  ])('refuses an SVG with %s', async (_label, body) => {
    put('hello', 'chart.svg', svg(body));
    await expect(emitPostImages({ distDir, contentDir, slugs: ['hello'] })).rejects.toThrow(
      /blog\/content\/hello\/chart\.svg/,
    );
  });

  it('refuses an SVG that is not plain UTF-8, which the checks could not read', async () => {
    // UTF-16 with its byte-order mark, as some editors save it.
    put('hello', 'chart.svg', Buffer.from(String.fromCharCode(0xfeff) + svg(), 'utf16le'));
    await expect(emitPostImages({ distDir, contentDir, slugs: ['hello'] })).rejects.toThrow(
      /UTF-8/,
    );
  });

  it('refuses a link or folder in place of an image file', async () => {
    const outside = path.join(root, 'outside.svg');
    fs.writeFileSync(outside, svg());
    fs.mkdirSync(path.join(contentDir, 'hello'), { recursive: true });
    fs.mkdirSync(path.join(contentDir, 'hello', 'folder.svg'));
    await expect(emitPostImages({ distDir, contentDir, slugs: ['hello'] })).rejects.toThrow(
      /folder\.svg: not a regular file/,
    );
    fs.rmdirSync(path.join(contentDir, 'hello', 'folder.svg'));
    try {
      fs.symlinkSync(outside, path.join(contentDir, 'hello', 'chart.svg'));
    } catch {
      return; // Creating links needs extra rights on Windows; the folder case covers the check.
    }
    await expect(emitPostImages({ distDir, contentDir, slugs: ['hello'] })).rejects.toThrow(
      /chart\.svg: not a regular file/,
    );
  });

  it('allows references inside the same SVG', async () => {
    put('hello', 'chart.svg', svg('<defs><path id="a" d="M0 0"/></defs><use href="#a"/>'));
    const images = await emitPostImages({ distDir, contentDir, slugs: ['hello'] });
    expect(images.has('hello/chart.svg')).toBe(true);
  });

  it('refuses an SVG with no size, which would shift the page as it loads', async () => {
    put('hello', 'chart.svg', svg('<rect/>', ''));
    await expect(emitPostImages({ distDir, contentDir, slugs: ['hello'] })).rejects.toThrow(/size/);
  });
});
