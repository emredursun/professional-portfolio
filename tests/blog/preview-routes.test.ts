// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlogRouteHandler } from '../../scripts/lib/blog-preview-routes.js';

let dist: string;
const HEADERS = { 'Content-Security-Policy': "default-src 'self'", 'X-Frame-Options': 'DENY' };

function fakeResponse() {
  const headers: Record<string, string> = {};
  return {
    statusCode: 200,
    headers,
    body: '',
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    end(body = '') {
      this.body = String(body);
    },
  };
}

function handle(url: string) {
  const res = fakeResponse();
  const next = vi.fn();
  createBlogRouteHandler({ distDir: dist, headers: HEADERS })({ url, method: 'GET' }, res, next);
  return { res, next };
}

beforeEach(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-preview-'));
  fs.mkdirSync(path.join(dist, 'blog'));
  fs.writeFileSync(path.join(dist, 'blog', 'known.html'), '<h1>Known</h1>');
  fs.writeFileSync(path.join(dist, '404.html'), '<h1>Not found</h1>');
});

afterEach(() => {
  fs.rmSync(dist, { recursive: true, force: true });
});

describe('blog preview routes', () => {
  it('lets Vite serve a page that exists', () => {
    expect(handle('/blog/known').next).toHaveBeenCalled();
    expect(handle('/blog/known?ref=x').next).toHaveBeenCalled();
  });

  it.each(['/blog/nope', '/tr/blog/nope', '/nl/blog/a/b', '/blog'])(
    'answers %s with the 404 page and the production headers',
    (url) => {
      const { res, next } = handle(url);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe('<h1>Not found</h1>');
      expect(res.headers['Content-Security-Policy']).toBe("default-src 'self'");
      expect(res.headers['Content-Type']).toBe('text/html; charset=utf-8');
    },
  );

  it('redirects a trailing slash permanently, as Firebase does with trailingSlash false', () => {
    const { res, next } = handle('/blog/known/?x=1');
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(301);
    expect(res.headers.Location).toBe('/blog/known?x=1');
  });

  it.each(['/about', '/blogger', '/projects/blog', '/assets/blog-code-1.css', '/'])(
    'leaves %s to the portfolio',
    (url) => {
      expect(handle(url).next).toHaveBeenCalled();
    },
  );

  it('cannot be walked out of dist', () => {
    const { res } = handle('/blog/..%2f..%2fpackage');
    expect(res.statusCode).toBe(404);
  });
});
