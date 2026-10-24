import { copy, expect, test } from './fixtures';

const locales = [
  { locale: 'en', path: '/about' },
  { locale: 'nl', path: '/nl/about' },
  { locale: 'tr', path: '/tr/about' },
] as const;

test.describe('downloadable CV', () => {
  for (const { locale, path } of locales) {
    test(`${path} offers the ${locale} CV as a real PDF`, async ({ page, request }) => {
      await page.goto(path);
      // Wait for the app as the other specs do; under a loaded parallel run
      // the sidebar can take longer than one assertion timeout to mount.
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
      const button = page.getByRole('link', { name: copy(locale, 'common').buttons.downloadCV });
      const file = `Emre-Dursun-CV-${locale}.pdf`;

      await expect(button).toHaveAttribute('href', `/cv/${file}`);
      await expect(button).toHaveAttribute('download', file);

      const response = await request.get(`/cv/${file}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
      const body = await response.body();
      expect(body.subarray(0, 5).toString()).toBe('%PDF-');
      expect(body.length).toBeGreaterThan(30_000);
    });
  }

  test('clicking the button downloads the file', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Same link on mobile; one browser is enough for the download itself.');
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: copy('en', 'common').buttons.downloadCV }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('Emre-Dursun-CV-en.pdf');
  });

  test('the command palette downloads the PDF in the page language', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The palette opens with a keyboard shortcut.');
    await page.goto('/nl/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await page.keyboard.press('Control+k');
    // The palette is in Dutch here; English keywords still find the command.
    await page
      .getByRole('combobox', { name: copy('nl', 'common').palette.search })
      .fill('download resume');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.keyboard.press('Enter'),
    ]);
    expect(download.suggestedFilename()).toBe('Emre-Dursun-CV-nl.pdf');
  });
});
