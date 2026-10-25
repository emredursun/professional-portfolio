import fs from 'fs';
import path from 'path';
import { expect, test } from './fixtures';

/**
 * Each route ships its own HTML file with a prerendered <head> (scripts/
 * prerender-routes.js) for crawlers that never run JavaScript. These tests
 * check that head is what the page actually becomes once React has run, so
 * a link preview can never describe a different page than a visitor sees.
 */
const routes = [
  { path: '/about', file: 'about.html' },
  { path: '/resume', file: 'resume.html' },
  { path: '/nl/projects', file: 'nl/projects.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/tr/resume', file: 'tr/resume.html' },
  { path: '/quality', file: 'quality.html' },
  { path: '/about/tricentis-tosca-automation', file: 'about/tricentis-tosca-automation.html' },
  {
    path: '/tr/about/pega-platform-architecture',
    file: 'tr/about/pega-platform-architecture.html',
  },
  { path: '/projects/aegisqa', file: 'projects/aegisqa.html' },
  {
    path: '/nl/projects/banking-payment-automation',
    file: 'nl/projects/banking-payment-automation.html',
  },
];

function staticHead(file: string) {
  const html = fs.readFileSync(path.join(process.cwd(), 'dist', file), 'utf8');
  const decode = (value: string) =>
    value
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  const attr = (pattern: RegExp) => decode(html.match(pattern)?.[1] ?? '');
  return {
    html,
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
    description: attr(/<meta name="description" content="([^"]*)"/),
    canonical: attr(/<link rel="canonical" href="([^"]*)"/),
    ogTitle: attr(/<meta property="og:title" content="([^"]*)"/),
  };
}

test.describe('prerendered route heads', () => {
  test.skip(({ isMobile }) => isMobile, 'The head does not depend on the viewport.');

  for (const { path: route, file } of routes) {
    test(`${route} ships the head the page renders`, async ({ page }) => {
      const expected = staticHead(file);
      expect(expected.title).toMatch(/Emre Dursun/);

      await page.goto(route);
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

      // Poll: the page may still be applying translations on first paint.
      await expect.poll(() => page.title()).toBe(expected.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        expected.description,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        expected.canonical,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        expected.ogTitle,
      );
      // React updates the static tags in place rather than adding copies.
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    });
  }

  test('the HTML served for a deep link already names the page, before any JavaScript', async ({
    request,
  }) => {
    const response = await request.get('/projects/aegisqa');
    const html = await response.text();
    expect(html).toMatch(/<title>AegisQA[^<]*\| Emre Dursun<\/title>/);
    expect(html).toContain(
      '<meta property="og:url" content="https://emredursun.nl/projects/aegisqa" />',
    );
  });

  test('a Dutch page is served as Dutch', async ({ request }) => {
    const html = await (await request.get('/nl/resume')).text();
    expect(html).toMatch(/<html lang="nl"/);
    expect(html).toContain('<meta property="og:locale" content="nl_NL" />');
  });
});
