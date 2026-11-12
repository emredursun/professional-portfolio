// @vitest-environment node
import fs from 'fs';
import path from 'path';
import picomatch from 'picomatch';
import { describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';
import { listRoutes } from '../scripts/generate-sitemap.js';

/**
 * Every real route has its own prerendered file (scripts/prerender-routes.js),
 * and Firebase serves an exact file before anything else. So firebase.json
 * has no rewrites: an unknown URL such as /about/typo gets dist/404.html with
 * a real 404 status. A rewrite to the app shell would answer it with 200 and
 * a "Page not found" view, which Google reports as a soft 404.
 */
const firebase = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../firebase.json'), 'utf8'));
const redirects: Array<{ source: string; destination: string; type: number }> =
  firebase.hosting.redirects;
const redirectFor = (url: string) => redirects.find((rule) => picomatch(rule.source)(url));
const isRewritten = (url: string) =>
  (firebase.hosting.rewrites ?? []).some((rule: { source: string }) => picomatch(rule.source)(url));

describe('firebase.json routing', () => {
  it('rewrites nothing to the app shell, so unknown paths get a real 404', () => {
    expect(firebase.hosting.rewrites).toBeUndefined();
  });

  it.each([
    ['/', '/about'],
    ['/nl', '/nl/about'],
    ['/tr', '/tr/about'],
  ])('permanently redirects %s to %s, the page the app shows there', (from, to) => {
    expect(redirectFor(from)).toMatchObject({ destination: to, type: 301 });
  });

  it('redirects no sitemap route, so the sitemap lists only final URLs', async () => {
    const routes = listRoutes(await loadConstants());
    expect(routes).not.toContain('');
    const urls = routes.flatMap((route) => [route, `/nl${route}`, `/tr${route}`]);
    expect(urls.filter((url) => redirectFor(url))).toEqual([]);
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
    // firebase-tools lists files with glob, where **/.* matches the .vite folder
    // entry but not the files in it; the file itself must match an ignore rule.
    expect(ignored('.vite/manifest.json')).toBe(true);
    expect(ignored('blog/a-post.html')).toBe(false);
  });
});

describe('firebase.json: the blog feed', () => {
  const headerRules: Array<{ source: string; headers: Array<{ key: string; value: string }> }> =
    firebase.hosting.headers;
  const contentTypeFor = (url: string) =>
    headerRules
      .filter((rule) => picomatch(rule.source)(url))
      .flatMap((rule) => rule.headers)
      .filter((header) => header.key === 'Content-Type')
      .map((header) => header.value);

  it.each(['/blog/feed.xml', '/tr/blog/feed.xml', '/nl/blog/feed.xml'])(
    'serves the Atom feed %s as Atom, not generic XML',
    (url) => {
      expect(contentTypeFor(url)).toEqual(['application/atom+xml; charset=utf-8']);
    },
  );

  it('sets no content type anywhere else', () => {
    for (const url of [
      '/blog',
      '/blog/a-post',
      '/tr/blog',
      '/sitemap.xml',
      '/about',
      '/de/blog/feed.xml',
    ]) {
      expect(contentTypeFor(url), url).toEqual([]);
    }
  });
});
