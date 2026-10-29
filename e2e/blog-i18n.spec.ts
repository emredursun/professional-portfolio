import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { BLOG_LAUNCHED } from '../scripts/blog/config.js';
import { strings } from '../scripts/blog/strings.js';
import { copy, expect, test } from './fixtures';

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
        .filter((file) => file.endsWith('.html') && file !== 'now.html')
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

test.describe('the Now page', () => {
  test('the index’s Now line leads to a clean, accessible Now page', async ({ page }) => {
    for (const lang of ['en', 'tr'] as const) {
      const s = strings(lang);
      const base = lang === 'en' ? '/blog' : `/${lang}/blog`;
      await page.goto(base);
      await page.locator('.now-line').getByRole('link', { name: s.nowMore }).click();
      await expect(page).toHaveURL(new RegExp(`${base}/now$`));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveText(s.nowTitle);
      await expect(page.locator('.now-list li').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations, lang).toEqual([]);
    }
  });

  test('fits the screen, and a trailing slash redirects like Firebase', async ({
    page,
    request,
  }) => {
    await page.goto('/nl/blog/now');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect((await request.get('/blog/now/', { maxRedirects: 0 })).status()).toBe(301);
  });
});

test.describe('link previews', () => {
  test('each page names its own card, served as an immutable PNG', async ({ page, request }) => {
    for (const url of [TR_POST, '/blog', '/nl/blog']) {
      await page.goto(url);
      const image = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(image, url).toMatch(/^https:\/\/emredursun\.nl\/assets\/blog-og-[a-z0-9-]+\.png$/);
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image!);
      const response = await request.get(new URL(image!).pathname);
      expect(response.status(), url).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
    }
    await page.goto(TR_POST);
    const alt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    await expect(page.locator('h1')).toHaveText(alt!);
  });
});

test.describe('a missing blog page', () => {
  for (const lang of ['en', 'tr', 'nl'] as const) {
    const base = lang === 'en' ? '/blog' : `/${lang}/blog`;

    test(`under ${base} is a real 404 that leads back to that blog`, async ({ page, problems }) => {
      const notFound = copy(lang, 'common').notFound;
      const response = await page.goto(`${base}/no-such-post`);
      expect(response?.status()).toBe(404);
      // The browser logs the document's own 404 status; that one is expected.
      const own = problems.findIndex((problem) => /status of 404/.test(problem));
      expect(own).toBeGreaterThanOrEqual(0);
      problems.splice(own, 1);
      await expect(page.getByRole('heading', { name: notFound.blogTitle })).toBeVisible();
      const back = page.getByRole('link', { name: notFound.blogIndex });
      await expect(back).toHaveAttribute('href', base);
      await back.click();
      await expect(page).toHaveURL(new RegExp(`${base}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    });
  }
});

test.describe('before launch, the portfolio does not link to the blog', () => {
  test.skip(BLOG_LAUNCHED, 'the blog has launched');

  test('no nav entry and no palette command point at it', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('a[href="/blog"]')).toHaveCount(0);
    await page.keyboard.press('Control+k');
    await page
      .getByRole('combobox', { name: copy('en', 'common').palette.search })
      .fill('Field Notes');
    await expect(
      page.getByRole('option', {
        name: new RegExp(copy('en', 'common').palette.commands.navBlog.label),
      }),
    ).toHaveCount(0);
  });
});

test.describe('the portfolio links to the blog', () => {
  test.skip(!BLOG_LAUNCHED, 'the nav links to the blog only once it has launched');

  test('the mobile bar still fits a 360 px screen with the blog in it', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const path of ['/about', '/tr/about']) {
      await page.goto(path);
      const bar = page.locator('nav.fixed ul');
      await expect(bar.locator('a[href$="/blog"]')).toHaveCount(1);
      const { scroll, client } = await bar.evaluate((ul) => ({
        scroll: ul.scrollWidth,
        client: ul.clientWidth,
      }));
      expect(scroll, path).toBeLessThanOrEqual(client);
    }
  });

  test('the nav opens the blog in the page’s language', async ({ page, isMobile }) => {
    for (const [from, to] of [
      ['/about', '/blog'],
      ['/tr/about', '/tr/blog'],
    ] as const) {
      await page.goto(from);
      // The desktop sidebar and the mobile bottom bar each have the link;
      // only one of them is visible at a time.
      const link = page.locator(`a[href="${to}"]:visible`).first();
      await expect(link).toHaveText(new RegExp(copy('en', 'common').nav.blog, 'i'));
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${to}$`));
      await expect(page.locator('html')).toHaveAttribute(
        'lang',
        from.startsWith('/tr') ? 'tr' : 'en',
      );
    }
    expect(isMobile !== undefined).toBe(true);
  });

  test('the command palette has a Field Notes command', async ({ page }) => {
    await page.goto('/nl/about');
    await page.keyboard.press('Control+k');
    const command = copy('nl', 'common').palette.commands.navBlog.label;
    await page.getByRole('combobox', { name: copy('nl', 'common').palette.search }).fill('blog');
    await page.getByRole('option', { name: new RegExp(command) }).click();
    await expect(page).toHaveURL(/\/nl\/blog$/);
  });
});
