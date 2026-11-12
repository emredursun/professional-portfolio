import { copy, expect, test } from './fixtures';

// This file exercises the intro, so it opts out of the suite-wide reduced motion.
test.use({ reducedMotion: 'no-preference' });

/** Hold the app's scripts back, to see what the HTML paints on its own. */
async function holdScripts(page: import('@playwright/test').Page) {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/assets/*.js', async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

test('a route page paints its own content before JavaScript, and the app takes over without the intro', async ({
  page,
}) => {
  const { titleHighlight } = copy('en', 'about');
  const heading = page.getByRole('heading', { level: 2 }).filter({ hasText: titleHighlight });

  const releaseScripts = await holdScripts(page);
  await page.goto('/about', { waitUntil: 'commit' });
  // scripts/prerender-content.js put the page in the HTML: no curtain over it.
  await expect(heading.first()).toBeVisible();
  await expect(page.getByTestId('preloader')).toHaveCount(0);
  releaseScripts();

  await expect(page.locator('html')).toHaveAttribute('data-prerendered', '');
  await expect(page.locator('.prerender-desktop')).toHaveCount(0, { timeout: 10_000 });
  await expect(heading.first()).toBeVisible();
  await expect(page.getByTestId('preloader')).toHaveCount(0);
});

test('a page without prerendered content shows the intro, then hands over once per session', async ({
  page,
}) => {
  const curtain = page.getByTestId('preloader');

  const releaseScripts = await holdScripts(page);
  // Not a prerendered route: the app shell with the static curtain.
  await page.goto('/about/no-such-service', { waitUntil: 'commit' });
  await expect(curtain).toBeVisible();
  releaseScripts();
  await expect(curtain).toHaveCount(0, { timeout: 10_000 });

  // Second load in the same session: straight to content.
  await page.unroute('**/assets/*.js');
  await page.reload();
  await expect(curtain).toHaveCount(0);
});
