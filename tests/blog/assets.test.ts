// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emitAsset } from '../../scripts/blog/assets.js';

let dist: string;

beforeEach(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-assets-'));
});

afterEach(() => {
  fs.rmSync(dist, { recursive: true, force: true });
});

describe('emitAsset', () => {
  it('writes the file under assets/ with a content hash and returns its URL', () => {
    const url = emitAsset(dist, 'code', 'css', '.a{color:red}\n');
    expect(url).toMatch(/^\/assets\/blog-code-[0-9a-f]{8}\.css$/);
    expect(fs.readFileSync(path.join(dist, url), 'utf8')).toBe('.a{color:red}\n');
  });

  it('gives the same name to the same bytes and a new name to different bytes', () => {
    const first = emitAsset(dist, 'code', 'css', 'a');
    expect(emitAsset(dist, 'code', 'css', 'a')).toBe(first);
    expect(emitAsset(dist, 'code', 'css', 'b')).not.toBe(first);
  });

  it.each(['../x', 'a/b', 'A', ''])('rejects the unsafe name %j', (name) => {
    expect(() => emitAsset(dist, name, 'css', 'a')).toThrow(/name/);
  });

  it('only writes the extensions the blog serves', () => {
    // @ts-expect-error -- checks the runtime guard against a value the types forbid
    expect(() => emitAsset(dist, 'code', 'html', 'a')).toThrow(/extension/);
  });

  it('writes binary images byte for byte, named by their content', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0x00]);
    const url = emitAsset(dist, 'og-hello-en', 'png', png);
    expect(url).toMatch(/^\/assets\/blog-og-hello-en-[0-9a-f]{8}\.png$/);
    expect(fs.readFileSync(path.join(dist, url)).equals(png)).toBe(true);
  });

  it('refuses text for an image and a buffer for a stylesheet', () => {
    expect(() => emitAsset(dist, 'og', 'png', 'not an image')).toThrow(/Buffer/);
    expect(() => emitAsset(dist, 'code', 'css', Buffer.from('a'))).toThrow(/string/);
  });
});
