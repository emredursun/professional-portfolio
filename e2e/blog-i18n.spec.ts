import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { strings } from '../scripts/blog/strings.js';
import { expect, test } from './fixtures';

/**
 * Field Notes in Turkish and Dutch (scripts/build-blog.js). Accessible names
 * come from scripts/blog/strings.js, so a copy change never breaks a test.
 * The samples: the essay exists in all three languages, the note in English
 * and Turkish only, so the Dutch index shows it as an English post.
 */
const dist = path.join(process.cwd(), 'dist');
const articles = (lang: string) => {
  const dir = path.join(dist, lang, 'blog');
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((file) => file.endsWith('.html'))
        .sort()
        .map((file) => `/${lang}/blog/${file.replace(/\.html$/, '')}`)
    : [];
};
const TR_POST = articles('tr')[0];
const NL_POSTS = articles('nl');
if (!TR_POST || NL_POSTS.length === 0) {
  throw new Error('e2e/blog-i18n.spec.ts: no Turkish or Dutch pages in dist; run `npm run build`');
}
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const lang of ['tr', 'nl'] as const) {
  const s = strings(lang);

  test.describe(`blog in ${lang}`, () => {
    test('the index is in its language, clean and accessible in both themes', async ({ page }) => {
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        const response = await page.goto(`/${lang}/blog`);
        expect(response?.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('h1')).toHaveText(s.tagline);
        const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
        expect(results.violations, colorScheme).toEqual([]);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('an article is in its language, with its trust sections named in it', async ({ page }) => {
      const post = lang === 'tr' ? TR_POST : NL_POSTS[0];
      await page.goto(post);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('complementary', { name: s.evidenceTitle })).toBeVisible();
      await expect(page.getByRole('heading', { name: s.aiTitle })).toBeVisible();
      await expect(page.locator('.ai-footer')).toContainText(s.aiTranslatedWithAi);
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test('uppercase text sits inside its own language, so Turkish i becomes İ', async ({
      page,
    }) => {
      for (const url of [`/${lang}/blog`, lang === 'tr' ? TR_POST : NL_POSTS[0]]) {
        await page.goto(url);
        const wrong = await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((el) => getComputedStyle(el).textTransform === 'uppercase')
            .filter((el) => el.textContent?.trim())
            .filter((el) => {
              // Text in another language is right only where the page says
              // so on purpose: a language menu link or an English-only card.
              const owner = el.closest('[lang]');
              if (owner?.getAttribute('lang') === document.documentElement.lang) return false;
              return !owner?.matches('.lang-nav a, li.card[lang], li.note-item[lang]');
            })
            .map((el) => `${el.className}: ${el.closest('[lang]')?.getAttribute('lang')}`),
        );
        expect(wrong, url).toEqual([]);
      }
    });

    test('an unknown post is a real 404', async ({ request }) => {
      expect((await request.get(`/${lang}/blog/no-such-post`)).status()).toBe(404);
    });
  });
}

test.describe('switching language', () => {
  test('the language menu keeps the reader on the same post', async ({ page }) => {
    const slug = TR_POST.split('/').at(-1);
    await page.goto(`/blog/${slug}`);
    const nav = page.getByRole('navigation', { name: strings('en').languageNav });
    await nav.getByRole('link', { name: 'Türkçe' }).click();
    await expect(page).toHaveURL(new RegExp(`/tr/blog/${slug}$`));
    await expect(
      page
        .getByRole('navigation', { name: strings('tr').languageNav })
        .getByRole('link', { name: 'Türkçe' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('each language link is named by the code it shows, for voice control', async ({ page }) => {
    await page.goto(TR_POST);
    const nav = page.getByRole('navigation', { name: strings('tr').languageNav });
    for (const code of ['EN', 'TR']) {
      await expect(nav.getByRole('link', { name: new RegExp(`^${code}\\b`) })).toHaveCount(1);
    }
  });

  test('every hreflang alternate exists and links back', async ({ page, request }) => {
    const alternatesOf = async (url: string) => {
      await page.goto(url);
      return page
        .locator('link[rel="alternate"][hreflang]:not([hreflang="x-default"])')
        .evaluateAll((links) => links.map((link) => new URL(link.getAttribute('href')!).pathname));
    };
    for (const url of [TR_POST, ...NL_POSTS, '/tr/blog', '/nl/blog']) {
      const own = await alternatesOf(url);
      expect(own, url).toContain(url);
      for (const target of own) {
        expect((await request.get(target)).status(), target).toBe(200);
        expect(await alternatesOf(target), `${target} -> ${url}`).toContain(url);
      }
    }
  });

  test('the Dutch index lists an untranslated post as English, before the click', async ({
    page,
  }) => {
    await page.goto('/nl/blog');
    const english = page.locator('.notes [lang="en"] a[hreflang="en"]');
    await expect(english).toHaveCount(1);
    await expect(page.locator('.notes .lang-chip')).toHaveText(strings('nl').inEnglish);
  });
});

test.describe('topic pages', () => {
  test('an article’s topic link leads to a clean page of that topic only', async ({ page }) => {
    await page.goto(TR_POST);
    const link = page.locator('.article-kicker .topic-link');
    const label = (await link.textContent())!;
    await link.click();
    await expect(page).toHaveURL(/\/tr\/blog\/topic\/[a-z]+$/);
    await expect(page.locator('h1')).toHaveText(label);
    const topics = await page.locator('.card-meta .topic-link').allTextContents();
    expect(topics.length).toBeGreaterThan(0);
    expect(new Set(topics)).toEqual(new Set([label]));
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test('a topic with no posts in a language has no page there', async ({ request }) => {
    // The Dutch samples are on testing only; the ai note is English and Turkish.
    expect((await request.get('/nl/blog/topic/ai')).status()).toBe(404);
    expect((await request.get('/tr/blog/topic/ai')).status()).toBe(200);
  });
});
