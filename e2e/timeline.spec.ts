import { expect, test } from './fixtures';

/**
 * The Resume timeline beam (index.css) is scroll-linked: a segment fills as
 * it passes through the viewport. Desktop scrolls inside the content panel
 * and mobile scrolls the window, so both projects run this.
 */
const fill = (page: import('@playwright/test').Page, index: number) =>
  page.locator('.timeline-beam').nth(index).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d);

test.describe('resume timeline beam', () => {
  test('fills a segment once the reader has scrolled past it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/resume');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

    const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    test.skip(!supported, 'Scroll-driven animations are not supported in this browser.');

    // Bring the second role to the middle of the screen: the first segment
    // has then been read and should be (close to) full.
    await page.locator('.timeline-segment').nth(1).evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect.poll(() => fill(page, 0), { timeout: 5000 }).toBeGreaterThan(0.9);
    // Segments further down have not been reached yet.
    expect(await fill(page, 3)).toBeLessThan(0.1);
  });

  test('stays static for visitors who asked for reduced motion', async ({ page }) => {
    // The suite's default (playwright.config.ts): reducedMotion 'reduce'.
    await page.goto('/resume');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await expect(page.locator('.timeline-beam').first()).toBeHidden();
    await expect(page.locator('.timeline-pulse')).toBeHidden();
  });
});
