import { expect, test } from './fixtures';

/** The machine-readable profile the build writes next to the pages. */
test.describe('machine-readable profile', () => {
  test.skip(({ isMobile }) => isMobile, 'Plain HTTP checks; one browser is enough.');

  test('serves llms.txt as Markdown text, discoverable from the page', async ({
    page,
    request,
  }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^text\/(plain|markdown)/);
    expect(await response.text()).toMatch(/^# Emre Dursun\n\n> /);

    await page.goto('/about');
    await expect(page.locator('link[rel="describedby"]')).toHaveAttribute('href', '/llms.txt');
  });

  test('serves resume.json as JSON Resume', async ({ request }) => {
    const response = await request.get('/resume.json');
    expect(response.status()).toBe(200);
    const resume = await response.json();
    expect(resume.basics).toMatchObject({ name: 'Emre Dursun', url: 'https://emredursun.nl' });
    expect(resume.work[0].name).toBe('Sopra Steria');
  });
});
