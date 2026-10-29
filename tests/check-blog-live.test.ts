// @vitest-environment node
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * scripts/check-blog-live.sh against a small local site, in a temporary copy
 * of the repo whose config.js says launched or not. Every case that should
 * fail must fail with its own ::error:: line, never silently.
 */
const SCRIPT = path.join(__dirname, '..', 'scripts', 'check-blog-live.sh');
const SITE = 'https://emredursun.nl';

type Route = { status?: number; body?: string; headers?: Record<string, string> };
let routes: Record<string, Route> = {};
let server: http.Server;
let base: string;

const page = (canonical: string, extra = '') =>
  `<html><head>${extra}<link rel="canonical" href="${SITE}${canonical}"></head></html>`;
const ATOM = {
  'content-type': 'application/atom+xml; charset=utf-8',
  'x-content-type-options': 'nosniff',
};

function healthySite(): Record<string, Route> {
  const locs = ['/blog', '/blog/hello', '/blog/topic/testing', '/tr/blog', '/tr/blog/hello'];
  return {
    '/sitemap.xml': {
      body: `<urlset><url><loc>${SITE}/about</loc></url>${locs.map((loc) => `<url><loc>${SITE}${loc}</loc></url>`).join('')}</urlset>`,
    },
    ...Object.fromEntries(locs.map((loc) => [loc, { body: page(loc) }])),
    '/blog/feed.xml': { body: '<feed/>', headers: ATOM },
    '/tr/blog/feed.xml': { body: '<feed/>', headers: ATOM },
  };
}

function run(launched: boolean) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-live-'));
  fs.mkdirSync(path.join(repo, 'scripts', 'blog'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(repo, 'scripts', 'check-blog-live.sh'));
  fs.writeFileSync(
    path.join(repo, 'scripts', 'blog', 'config.js'),
    `export const BLOG_LAUNCHED = ${launched};\n`,
  );
  // Async: the local site runs in this process and must keep answering.
  return new Promise<{ code: number | null; out: string }>((resolve) => {
    const child = spawn('bash', [path.join(repo, 'scripts', 'check-blog-live.sh'), base]);
    let out = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (out += chunk));
    child.on('close', (code) => {
      fs.rmSync(repo, { recursive: true, force: true });
      resolve({ code, out });
    });
  });
}

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const route = routes[(req.url ?? '/').split('?')[0]];
    res.writeHead(
      route ? (route.status ?? 200) : 404,
      route?.headers ?? { 'content-type': 'text/html' },
    );
    res.end(req.method === 'HEAD' ? undefined : (route?.body ?? 'not found'));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

afterAll(() => {
  server.close();
});

// Each case runs the real script: bash, then curl several times (eight at a
// time). Under a full parallel test run, process start-up alone can pass
// Vitest's default 5 s, so these cases get more.
describe('check-blog-live.sh', { timeout: 30_000 }, () => {
  it('passes without checking anything while this checkout is not launched', async () => {
    routes = {};
    const { code, out } = await run(false);
    expect(code).toBe(0);
    expect(out).toMatch(/not launched/);
  });

  it('passes a healthy launched blog, following the languages in the sitemap', async () => {
    routes = healthySite();
    const { code, out } = await run(true);
    expect(out).toMatch(/live checks passed \(5 pages, 2 feeds\)/);
    expect(code).toBe(0);
  });

  it.each([
    [
      'a missing feed',
      (site: Record<string, Route>) => delete site['/tr/blog/feed.xml'],
      /\/tr\/blog\/feed\.xml is not served/,
    ],
    [
      'a feed served as XML',
      (site: Record<string, Route>) =>
        (site['/blog/feed.xml'].headers = {
          'content-type': 'application/xml',
          'x-content-type-options': 'nosniff',
        }),
      /not served as Atom/,
    ],
    [
      'a missing page',
      (site: Record<string, Route>) => delete site['/blog/topic/testing'],
      /\/blog\/topic\/testing is not served/,
    ],
    [
      'a noindex post',
      (site: Record<string, Route>) =>
        (site['/blog/hello'].body = page(
          '/blog/hello',
          '<meta name="robots" content="noindex, nofollow">',
        )),
      /noindex after launch/,
    ],
    [
      'a sitemap without the blog',
      (site: Record<string, Route>) => (site['/sitemap.xml'].body = '<urlset></urlset>'),
      /lists no blog pages/,
    ],
    [
      'a site that is down',
      (site: Record<string, Route>) => Object.keys(site).forEach((key) => delete site[key]),
      /::error::/,
    ],
  ])('fails, saying why, on %s', async (_, breakSite, message) => {
    routes = healthySite();
    breakSite(routes);
    const { code, out } = await run(true);
    expect(code).not.toBe(0);
    expect(out).toMatch(message);
  });
});
