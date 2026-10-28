import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { expect, test } from './fixtures';

/**
 * The static Field Notes pages (scripts/build-blog.js), served by vite preview
 * with the production headers. The fixture fails every test on a console
 * error or CSP violation, so each test here also proves the page is clean.
 */
const blogDir = path.join(process.cwd(), 'dist', 'blog');
const pages = fs.existsSync(blogDir)
  ? fs.readdirSync(blogDir).filter((file) => file.endsWith('.html'))
  : [];
if (pages.length === 0) {
  throw new Error('e2e/blog.spec.ts: no pages in dist/blog; run `npm run build` first');
}
const POST = `/blog/${pages.sort()[0].replace(/\.html$/, '')}`;
const DARK_PAPER = 'rgb(28, 27, 24)';
const LIGHT_PAPER = 'rgb(250, 247, 240)';

test.describe('blog article', () => {
  test('is a complete article page under the production CSP', async ({ page }) => {
    const response = await page.goto(POST);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-security-policy']).toContain("script-src 'self'");

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.getByRole('complementary', { name: 'Evidence for this note' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How this was written' })).toBeVisible();

    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld ?? '{}')['@type']).toBe('BlogPosting');
  });

  test('table of contents links land on their sections', async ({ page }) => {
    await page.goto(POST);
    const toc = page.getByRole('navigation', { name: 'On this page' });
    const first = toc.getByRole('link').first();
    const target = (await first.getAttribute('href'))!;
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    // [id="..."] rather than #id: a heading such as "3 questions" gives an id
    // that is not a valid CSS id selector.
    await expect(page.locator(`[id="${target.slice(1)}"]`)).toBeInViewport();
  });

  test('loads nothing from third parties and none of the portfolio app', async ({
    page,
    baseURL,
  }) => {
    const own = new URL(baseURL ?? '').origin;
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(POST);
    await page.waitForLoadState('networkidle');

    const http = requests.filter((url) => url.startsWith('http'));
    expect(http.filter((url) => new URL(url).origin !== own)).toEqual([]);
    expect(http.filter((url) => /vendor-|\/main-/.test(url))).toEqual([]);
    await expect(page.locator('script[type="module"]')).toHaveCount(1);
  });

  test('passes axe in the light and dark themes', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto(POST);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations, colorScheme).toEqual([]);
    }
  });

  test('passes axe with dark pinned while the system is light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('userToggledTheme', 'true');
    });
    await page.goto(POST);
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('shows a visible focus ring on keyboard focus', async ({ page }) => {
    await page.goto(POST);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  });

  test('fits the screen without horizontal scrolling', async ({ page }) => {
    await page.goto(POST);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('blog without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('is fully readable, and hides the toggle that would not work', async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.prose p').first()).toBeVisible();
    await expect(page.locator('[data-theme-toggle]')).toBeHidden();
  });
});

test.describe('blog theme', () => {
  test('a theme pinned on the portfolio applies before the first paint', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('userToggledTheme', 'true');
    });
    // Hold the client module: the colour must already be right without it.
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/assets/article-*.js', async (route) => {
      await held;
      await route.continue();
    });

    await page.goto(POST, { waitUntil: 'commit' });
    await page.waitForFunction(
      () =>
        document.body !== null &&
        getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)',
    );
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      DARK_PAPER,
    );
    release();
  });

  test('follows the system setting when the visitor never chose', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(POST);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      DARK_PAPER,
    );
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      LIGHT_PAPER,
    );
  });

  test('a choice made on the blog holds on the portfolio', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(POST);
    const toggle = page.getByRole('button', { name: 'Dark theme' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/about');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });
});

test.describe('blog paths behave like Firebase', () => {
  test('an unknown post is a real 404, and a trailing slash redirects', async ({ request }) => {
    expect((await request.get('/blog/no-such-post')).status()).toBe(404);
    const slashed = await request.get(`${POST}/`, { maxRedirects: 0 });
    expect(slashed.status()).toBe(301);
    expect(slashed.headers().location).toBe(POST);
  });
});

test.describe('blog index and feed', () => {
  test('the index lists the posts and links to them', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await page.locator(`a[href="${POST}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${POST}$`));
  });

  test('the index passes axe and fits the screen', async ({ page }) => {
    await page.goto('/blog');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the Atom feed is served and lists the post', async ({ request }) => {
    const response = await request.get('/blog/feed.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('xmlns="http://www.w3.org/2005/Atom"');
    expect(body).toContain(`https://emredursun.nl${POST}`);
  });
});
