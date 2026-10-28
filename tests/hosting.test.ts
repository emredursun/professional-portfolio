// @vitest-environment node
import fs from 'fs';
import path from 'path';
import picomatch from 'picomatch';
import { describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';
import { listRoutes } from '../scripts/generate-sitemap.js';

/**
 * firebase.json rewrites only the app's real routes to index.html; anything
 * else gets dist/404.html with a 404 status. A route missing here would 404
 * in production while every local test (vite preview serves the SPA for all
 * paths) still passes, so the patterns are checked against the sitemap.
 */
const firebase = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../firebase.json'), 'utf8'));
const rewrites: Array<{ source: string; destination: string }> = firebase.hosting.rewrites;
const matchers = rewrites.map((rule) => picomatch(rule.source));
const isRewritten = (url: string) => matchers.some((matches) => matches(url));

describe('firebase.json rewrites', () => {
  it('only ever rewrite to the app shell', () => {
    expect(rewrites.every((rule) => rule.destination === '/index.html')).toBe(true);
  });

  it('cover every sitemap route in every language', async () => {
    const routes = listRoutes(await loadConstants());
    const urls = routes.flatMap((route) => [route || '/', `/nl${route}`, `/tr${route}`]);
    expect(urls.filter((url) => !isRewritten(url))).toEqual([]);
  });

  it('leave unknown paths and static files to 404.html', () => {
    for (const url of [
      '/no-such-page',
      '/blog',
      '/nl/no-such-page',
      '/de/about',
      // Only About and Projects have one-level detail pages.
      '/resume/anything',
      '/contact/x',
      '/about/a/b',
      '/nl/projects/a/b',
      // Firebase globs are case-sensitive (React Router is not). Accepted:
      // every link the site, sitemap and CV publish is lowercase.
      '/About',
      '/NL/about',
      '/images/missing.webp',
      '/cv/missing.pdf',
      '/sitemap.xml',
      '/version.json',
      '/assets/index.js',
    ]) {
      expect(isRewritten(url), url).toBe(false);
    }
  });

  it('refuse to deploy a build without the CV PDFs', () => {
    expect(firebase.hosting.predeploy).toContain('node scripts/generate-cv.js --check');
  });
});

describe('firebase.json for the blog', () => {
  const headerRules: Array<{ source: string; headers: Array<{ key: string; value: string }> }> =
    firebase.hosting.headers;
  const cacheControlFor = (url: string) =>
    headerRules
      .filter((rule) => picomatch(rule.source)(url))
      .flatMap((rule) => rule.headers)
      .filter((header) => header.key === 'Cache-Control')
      .map((header) => header.value);

  it('never rewrites a blog path, so unknown posts get a real 404', () => {
    for (const url of ['/blog', '/blog/a-post', '/blog/a/b', '/tr/blog/a-post', '/nl/blog']) {
      expect(isRewritten(url), url).toBe(false);
    }
  });

  it('serves blog pages without caching, like every other page', () => {
    // Header globs match the request path, not the file, so the **/*.html
    // rule never applies to the clean URL /blog/<slug>.
    for (const url of ['/blog', '/blog/a-post', '/tr/blog/a-post']) {
      expect(cacheControlFor(url), url).toContain('public, max-age=0, must-revalidate');
    }
  });

  it('never deploys the Vite build manifest', () => {
    const ignored = (file: string) =>
      (firebase.hosting.ignore as string[]).some((glob) => picomatch(glob, { dot: true })(file));
    expect(ignored('.vite/manifest.json') || ignored('.vite')).toBe(true);
  });
});
