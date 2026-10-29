import AxeBuilder from '@axe-core/playwright';
import { BLOG_LAUNCHED } from '../scripts/blog/config.js';
import { strings } from '../scripts/blog/strings.js';
import { blogPath, hasNow, languages, postPath, slugs, topics, untranslated } from './blog-content';
import { copy, expect, test } from './fixtures';

/**
 * Field Notes in every language the build wrote (scripts/build-blog.js).
 * Accessible names come from scripts/blog/strings.js, so a copy change never
 * breaks a test, and every case is taken from dist (e2e/blog-content.ts), so
 * real posts can replace the samples; a case the content lacks is skipped
 * with its reason.
 */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const translated = languages.filter((lang) => lang !== 'en');
/** A translated post and its language, when the content has one. */
const translation = translated
  .map((lang) => ({ lang, slug: slugs(lang)[0] }))
  .find(({ slug }) => slug);

for (const lang of translated) {
  const s = strings(lang);
  const post = postPath(lang);

  test.describe(`blog in ${lang}`, () => {
    test('the index is in its language, clean and accessible in both themes', async ({ page }) => {
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        const response = await page.goto(blogPath(lang));
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
      test.skip(!post, `no ${lang} post yet`);
      await page.goto(post!);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.getByRole('complementary', { name: s.evidenceTitle })).toBeVisible();
      await expect(page.getByRole('heading', { name: s.aiTitle })).toBeVisible();
      // Says how the translation was made, whichever way it was.
      await expect(page.locator('.ai-footer')).toContainText(
        new RegExp(`${s.aiTranslatedWithAi}|${s.aiTranslatedByMe}`),
      );
      const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });

    test('uppercase text sits inside its own language, so Turkish i becomes İ', async ({
      page,
    }) => {
      for (const url of [blogPath(lang), post].filter(Boolean) as string[]) {
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
      expect((await request.get(`${blogPath(lang)}/no-such-post`)).status()).toBe(404);
    });
  });
}

test.describe('switching language', () => {
  test('the language menu keeps the reader on the same post', async ({ page }) => {
    test.skip(!translation, 'no translated post yet');
    const { lang, slug } = translation!;
    const name = strings(lang).languageNames[lang];
    await page.goto(postPath('en', slug)!);
    await page
      .getByRole('navigation', { name: strings('en').languageNav })
      .getByRole('link', { name })
      .click();
    await expect(page).toHaveURL(new RegExp(`${postPath(lang, slug)}$`));
    await expect(
      page.getByRole('navigation', { name: strings(lang).languageNav }).getByRole('link', { name }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('each language link is named by the code it shows, for voice control', async ({ page }) => {
    test.skip(!translation, 'no translated post yet');
    const { lang, slug } = translation!;
    await page.goto(postPath(lang, slug)!);
    const nav = page.getByRole('navigation', { name: strings(lang).languageNav });
    for (const code of ['EN', lang.toUpperCase()]) {
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
    const urls = translated.flatMap((lang) => [
      blogPath(lang),
      ...slugs(lang).map((slug) => postPath(lang, slug)!),
    ]);
    for (const url of urls) {
      const own = await alternatesOf(url);
      expect(own, url).toContain(url);
      for (const target of own) {
        expect((await request.get(target)).status(), target).toBe(200);
        expect(await alternatesOf(target), `${target} -> ${url}`).toContain(url);
      }
    }
  });

  test('an index lists each untranslated post as English, before the click', async ({ page }) => {
    const lang = translated.find((other) => untranslated(other).length > 0);
    test.skip(!lang, 'every post exists in every language');
    await page.goto(blogPath(lang!));
    await expect(page.locator('[lang="en"] a[hreflang="en"]')).toHaveCount(
      untranslated(lang!).length,
    );
    await expect(page.locator('.lang-chip').first()).toHaveText(strings(lang!).inEnglish);
  });
});

test.describe('topic pages', () => {
  test('an article’s topic link leads to a clean page of that topic only', async ({ page }) => {
    const lang = translation?.lang ?? 'en';
    await page.goto(postPath(lang, translation?.slug)!);
    const link = page.locator('.article-kicker .topic-link');
    const label = (await link.textContent())!;
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${blogPath(lang)}/topic/[a-z]+$`));
    await expect(page.locator('h1')).toHaveText(label);
    const shown = await page.locator('.card-meta .topic-link').allTextContents();
    expect(shown.length).toBeGreaterThan(0);
    expect(new Set(shown)).toEqual(new Set([label]));
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test('a topic with no posts in a language has no page there', async ({ request }) => {
    const gap = translated
      .flatMap((lang) =>
        topics('en')
          .filter((topic) => !topics(lang).includes(topic))
          .map((topic) => ({ lang, topic })),
      )
      .at(0);
    test.skip(!gap, 'every topic has posts in every language');
    const { lang, topic } = gap!;
    expect((await request.get(`${blogPath(lang)}/topic/${topic}`)).status()).toBe(404);
    expect((await request.get(`/blog/topic/${topic}`)).status()).toBe(200);
  });
});

test.describe('the Now page', () => {
  test('the index’s Now line leads to a clean, accessible Now page', async ({ page }) => {
    const withNow = languages.filter(hasNow);
    test.skip(withNow.length === 0, 'no Now log yet');
    for (const lang of withNow) {
      const s = strings(lang);
      await page.goto(blogPath(lang));
      await page.locator('.now-line').getByRole('link', { name: s.nowMore }).click();
      await expect(page).toHaveURL(new RegExp(`${blogPath(lang)}/now$`));
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
    test.skip(!hasNow('en'), 'no Now log yet');
    await page.goto('/blog/now');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect((await request.get('/blog/now/', { maxRedirects: 0 })).status()).toBe(301);
  });
});

test.describe('link previews', () => {
  test('each page names its own card, served as an immutable PNG', async ({ page, request }) => {
    const article = postPath(translation?.lang ?? 'en', translation?.slug)!;
    for (const url of [article, ...languages.map(blogPath)]) {
      await page.goto(url);
      const image = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(image, url).toMatch(/^https:\/\/emredursun\.nl\/assets\/blog-og-[a-z0-9-]+\.png$/);
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image!);
      const response = await request.get(new URL(image!).pathname);
      expect(response.status(), url).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
    }
    await page.goto(article);
    const alt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
    await expect(page.locator('h1')).toHaveText(alt!);
  });
});

test.describe('a missing blog page', () => {
  for (const lang of languages) {
    const base = blogPath(lang);

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

  test('the nav opens the blog in the page’s language', async ({ page }) => {
    for (const [from, to, lang] of [
      ['/about', '/blog', 'en'],
      ['/tr/about', '/tr/blog', 'tr'],
    ] as const) {
      await page.goto(from);
      // The desktop sidebar and the mobile bottom bar each have the link;
      // only one of them is visible at a time.
      const link = page.locator(`a[href="${to}"]:visible`).first();
      await expect(link).toHaveText(new RegExp(copy(lang, 'common').nav.blog, 'i'));
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${to}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    }
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
