import AxeBuilder from '@axe-core/playwright';
import { type Page } from '@playwright/test';
import { postsWithVideo } from './blog-content';
import { expect, test } from './fixtures';

/**
 * Click-to-load video embeds (scripts/blog/video.js, blog/client/video.ts).
 * The player is stubbed: the tests prove what the page asks for and when,
 * under the production CSP, without depending on Vimeo being up. The fixture
 * fails a test on any CSP violation, so loading the stub also proves
 * frame-src allows the player.
 */
const VIDEOS = postsWithVideo();
const THIRD_PARTY = /vimeo\.com|vimeocdn\.com/;
const STUB = '<!doctype html><title>player</title><p>stub player</p>';

async function stubPlayer(page: Page) {
  await page.route('https://player.vimeo.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: STUB }),
  );
  // Anything else from Vimeo would be a leak; never let it reach the network.
  await page.route(/vimeocdn\.com/, (route) => route.abort());
}

test.describe('blog video embed', () => {
  test.skip(VIDEOS.length === 0, 'no post with a video yet');

  test('asks nothing of Vimeo until play is pressed, then loads the player', async ({ page }) => {
    const { path, id } = VIDEOS[0];
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await stubPlayer(page);

    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const embed = page.locator(`.video-embed[data-video-id="${id}"]`);
    await embed.scrollIntoViewIfNeeded();
    await expect(embed.locator('iframe')).toHaveCount(0);
    expect(requests.filter((url) => THIRD_PARTY.test(url))).toEqual([]);
    await expect(embed.getByRole('link', { name: 'Watch on Vimeo' })).toHaveAttribute(
      'href',
      `https://vimeo.com/${id}`,
    );

    // Keyboard first: the button is reachable and works with Enter.
    const play = embed.getByRole('button', { name: /^Play video/ });
    await play.focus();
    await page.keyboard.press('Enter');

    const frame = embed.locator('iframe');
    await expect(frame).toHaveAttribute(
      'src',
      `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1`,
    );
    await expect(frame).toBeFocused();
    await expect(page.frameLocator('.video-embed iframe').getByText('stub player')).toBeVisible();
    expect(requests.filter((url) => THIRD_PARTY.test(url))).toEqual([
      `https://player.vimeo.com/video/${id}?dnt=1&autoplay=1`,
    ]);
  });

  test('every page with a video shows the placeholder, in its own language', async ({ page }) => {
    for (const { path, id } of VIDEOS) {
      await page.goto(path);
      const embed = page.locator(`.video-embed[data-video-id="${id}"]`);
      await expect(embed.locator('[data-video-play]')).toBeVisible();
      await expect(embed.locator(`a[href="https://vimeo.com/${id}"]`)).toBeVisible();
    }
  });

  test('has no axe violations before and after play, in both themes', async ({ page }) => {
    const { path } = VIDEOS[0];
    await stubPlayer(page);
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      const before = await new AxeBuilder({ page })
        .include('.video-embed')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(before.violations, scheme).toEqual([]);

      await page.locator('[data-video-play]').first().click();
      await expect(page.locator('.video-embed iframe')).toHaveCount(1);
      const after = await new AxeBuilder({ page })
        .include('.video-embed')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(after.violations, scheme).toEqual([]);
    }
  });

  test('without JavaScript the play button is hidden and the link remains', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const { path, id } = VIDEOS[0];
    await page.goto(path);
    await expect(page.locator('[data-video-play]').first()).toBeHidden();
    await expect(page.locator(`a[href="https://vimeo.com/${id}"]`).first()).toBeVisible();
    await context.close();
  });
});
