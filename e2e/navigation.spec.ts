import { copy, expect, test } from './fixtures';

const pages = [
  { path: '/about', namespace: 'about' },
  { path: '/resume', namespace: 'resume' },
  { path: '/projects', namespace: 'projects' },
  { path: '/contact', namespace: 'contact' },
] as const;

test.describe('pages', () => {
  for (const { path, namespace } of pages) {
    test(`${path} renders its heading and metadata`, async ({ page }) => {
      const { title, titleHighlight } = copy('en', namespace);
      await page.goto(path);

      const heading = page.getByRole('heading', { level: 2 }).filter({ hasText: titleHighlight }).first();
      await expect(heading).toContainText(title);

      await expect(page).toHaveTitle(/Emre Dursun/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://emredursun.nl${path}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    });
  }

  test('the root redirects to /about', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/about$/);
  });

  test('an unknown URL shows a noindex "not found" page instead of redirecting', async ({ page }) => {
    const { notFound } = copy('en', 'common');
    await page.goto('/no-such-page');

    await expect(page.getByRole('heading', { level: 2, name: notFound.title })).toBeVisible();
    await expect(page).toHaveURL(/\/no-such-page$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');

    await page.getByRole('link', { name: notFound.home }).click();
    await expect(page).toHaveURL(/\/about$/);
    // Leaving the 404 must drop the noindex again, or /about would inherit it.
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('a localised unknown URL keeps its language', async ({ page }) => {
    const { notFound } = copy('nl', 'common');
    await page.goto('/nl/geen-pagina');
    await expect(page.getByRole('heading', { level: 2, name: notFound.title })).toBeVisible();
    await expect(page.getByRole('link', { name: notFound.projects })).toHaveAttribute('href', '/nl/projects');
  });
});

test.describe('languages', () => {
  for (const locale of ['tr', 'nl'] as const) {
    test(`/${locale} serves translated content and sets <html lang>`, async ({ page }) => {
      const { titleHighlight } = copy(locale, 'about');
      await page.goto(`/${locale}/about`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: titleHighlight }).first()).toBeVisible();
      await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveAttribute(
        'href',
        `https://emredursun.nl/${locale}/about`,
      );
    });
  }
});

test.describe('in-app navigation', () => {
  test('sidebar links switch pages without a reload', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The sidebar navigation is desktop-only; mobile uses the bottom bar.');
    await page.goto('/about');
    await page.evaluate(() => ((window as unknown as { __marker: boolean }).__marker = true));

    for (const target of ['Resume', 'Projects', 'Contact']) {
      await page.getByRole('link', { name: target, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(`/${target.toLowerCase()}$`));
    }

    // Still the same document: client-side routing, not full page loads.
    expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBe(true);
  });
});

test.describe('locale loading', () => {
  const localeRequests = (page: import('@playwright/test').Page) => {
    const urls: string[] = [];
    page.on('request', (req) => {
      const match = req.url().match(/\/locales\/(\w+)\/(\w+)\.json/);
      if (match) urls.push(`${match[1]}/${match[2]}`);
    });
    return urls;
  };

  test('an English page fetches only English files, even for a returning Turkish visitor', async ({ page }) => {
    // The language detector caches the last language in localStorage; the URL
    // must still win, without first fetching the cached language's files.
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'tr'));
    const requests = localeRequests(page);
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    expect(requests.every((r) => r.startsWith('en/'))).toBe(true);
    expect(new Set(requests).size).toBe(6);
  });

  test('a Dutch page fetches Dutch plus the English fallback, never Turkish', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'tr'));
    const requests = localeRequests(page);
    await page.goto('/nl/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    expect(requests.some((r) => r.startsWith('nl/'))).toBe(true);
    expect(requests.some((r) => r.startsWith('tr/'))).toBe(false);
  });
});

test.describe('locale is preserved by in-app navigation', () => {
  test('opening a service on /nl/about stays in Dutch', async ({ page }) => {
    await page.goto('/nl/about');
    const title = copy('nl', 'about').services.toscaAutomation.title;
    await page.getByRole('heading', { name: title }).first().click();
    await expect(page).toHaveURL(/\/nl\/about\/tricentis-tosca-automation$/);
  });

  test('command palette navigation on /tr stays in Turkish', async ({ page }) => {
    await page.goto('/tr/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox', { name: 'Search commands' }).fill('contact');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tr\/contact$/);
  });
});

test.describe('structured data', () => {
  test('every JSON-LD block parses and the Person schema is complete', async ({ page }) => {
    await page.goto('/about');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    const parsed = blocks.map((text) => JSON.parse(text));
    const person = parsed.find((b) => b['@type'] === 'Person');
    expect(person).toMatchObject({ name: 'Emre Dursun', url: 'https://emredursun.nl' });
    expect(person.image).toMatch(/^https:\/\/emredursun\.nl\/images\//);
  });
});
