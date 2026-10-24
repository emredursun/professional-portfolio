import { copy, expect, test } from './fixtures';

// This file exercises the intro, so it opts out of the suite-wide reduced motion.
test.use({ reducedMotion: 'no-preference' });

test('the intro paints before JavaScript and hands over to the page once per session', async ({
  page,
}) => {
  const { titleHighlight } = copy('en', 'about');
  const curtain = page.getByTestId('preloader');

  // Hold the scripts back to prove the static shell in index.html paints alone.
  let releaseScripts: () => void = () => {};
  const scriptsHeld = new Promise<void>((resolve) => (releaseScripts = resolve));
  await page.route('**/assets/*.js', async (route) => {
    await scriptsHeld;
    await route.continue();
  });

  await page.goto('/about', { waitUntil: 'commit' });
  await expect(curtain).toBeVisible();
  releaseScripts();

  await expect(
    page.getByRole('heading', { level: 2 }).filter({ hasText: titleHighlight }).first(),
  ).toBeVisible({
    timeout: 10_000,
  });
  await expect(curtain).toHaveCount(0, { timeout: 10_000 });

  // Second load in the same session: straight to content.
  await page.unroute('**/assets/*.js');
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 2 }).filter({ hasText: titleHighlight }).first(),
  ).toBeVisible();
  await expect(curtain).toHaveCount(0);
});
