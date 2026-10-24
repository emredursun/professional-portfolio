import AxeBuilder from '@axe-core/playwright';
import { copy, expect, test } from './fixtures';

test.describe('command palette', () => {
  test('opens with Ctrl+K, filters, navigates and closes', async ({ page }) => {
    await page.goto('/about');
    // The shortcut listener attaches when the app mounts; wait for it.
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    const search = page.getByRole('combobox', { name: 'Search commands' });

    await page.keyboard.press('Control+k');
    await expect(search).toBeVisible();

    await search.fill('contact');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact$/);

    await page.keyboard.press('Control+k');
    await expect(search).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(search).toBeHidden();
  });
});

test.describe('command palette search', () => {
  test('regex characters in the search are plain text, not a crash', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The palette opens with a keyboard shortcut.');
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await page.keyboard.press('Control+k');
    const search = page.getByRole('combobox', { name: 'Search commands' });

    // Each used to reach new RegExp() unescaped; "(" threw and took the page down.
    for (const query of ['(', 'c++', '[', 'a|b', '\\']) {
      await search.fill(query);
      await expect(search).toHaveValue(query);
    }
    await search.fill('(contact');
    await expect(page.getByRole('option', { name: /Go to Contact/ })).toBeVisible();
  });
});

test.describe('localised controls', () => {
  test('buttons, the palette and service cards speak the page language', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The palette opens with a keyboard shortcut.');
    const nl = copy('nl', 'common');
    await page.goto('/nl/about');
    await expect(page.getByRole('button', { name: nl.labels.toggleTheme }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: nl.labels.changeLanguage }).first()).toBeVisible();
    await expect(page.getByText(nl.buttons.learnMore).first()).toBeAttached();

    await page.keyboard.press('Control+k');
    const search = page.getByRole('combobox', { name: nl.palette.search });
    await expect(search).toHaveAttribute('placeholder', nl.palette.placeholder);
    await expect(page.getByRole('option', { name: new RegExp(nl.palette.commands.navContact.label) })).toBeVisible();
  });
});

test.describe('projects', () => {
  test('a project opens in a deep-linkable modal and closes with Escape', async ({ page }) => {
    await page.goto('/projects');
    await page.getByText('Quilyn — Certification Exam Prep').first().click();

    await expect(page).toHaveURL(/\/projects\/quilyn-exam-prep$/);
    await expect(page.getByRole('heading', { name: /Quilyn — Certification Exam Prep/, level: 1 }).or(
      page.getByRole('heading', { name: /Quilyn — Certification Exam Prep/, level: 2 }),
    ).first()).toBeVisible();

    // The modal registers its Escape handler in an effect right after it
    // renders; retry the key press instead of racing that registration.
    await expect(async () => {
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/projects$/, { timeout: 1000 });
    }).toPass();
  });

  test('a project URL opens the modal directly', async ({ page }) => {
    await page.goto('/projects/aegisqa');
    await expect(page.getByText(/AegisQA/).first()).toBeVisible();
    await expect(page).toHaveTitle(/AegisQA/);
  });

  test('a case study shows its measurable results, translated', async ({ page }) => {
    const nl = copy('nl', 'projects').projects['banking-payment-automation'].results;
    await page.goto('/nl/projects/banking-payment-automation');
    await expect(page.getByText(nl.runtime.metric).first()).toBeVisible();
    await expect(page.getByText(nl.runtime.value, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(nl.scenarios.description).first()).toBeVisible();
  });

  test('opening and closing a project on /nl/projects stays in Dutch', async ({ page }) => {
    await page.goto('/nl/projects');
    await page.getByText('Quilyn — Certification Exam Prep').first().click();
    await expect(page).toHaveURL(/\/nl\/projects\/quilyn-exam-prep$/);

    await expect(async () => {
      await page.keyboard.press('Escape');
      await expect(page).toHaveURL(/\/nl\/projects$/, { timeout: 1000 });
    }).toPass();
  });

  test('an unknown project slug shows the not-found page', async ({ page }) => {
    await page.goto('/tr/projects/no-such-project');
    await expect(page.getByRole('heading', { level: 2, name: copy('tr', 'common').notFound.title })).toBeVisible();
    await expect(page).toHaveURL(/\/tr\/projects\/no-such-project$/);
  });
});

test.describe('services', () => {
  test('a service URL is its own page with its own title and description', async ({ page }) => {
    const service = copy('en', 'about').services.pegaPlatform;
    await page.goto('/about/pega-platform-architecture');
    await expect(page).toHaveTitle(new RegExp(service.title));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', service.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://emredursun.nl/about/pega-platform-architecture',
    );
  });

  test('a service card opens from the keyboard, keeping the language', async ({ page }) => {
    // The cards were clickable divs: no tab stop, so Enter did nothing.
    const service = copy('nl', 'about').services.toscaAutomation;
    await page.goto('/nl/about');
    const card = page.getByRole('link', { name: service.title, exact: true });
    await card.scrollIntoViewIfNeeded();
    await card.focus();
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/nl\/about\/tricentis-tosca-automation$/);
  });

  test('a certification links to the issuer-hosted proof', async ({ page }) => {
    await page.goto('/about/test-automation-architecture');
    const verify = page.getByRole('link', { name: copy('en', 'about').services.details.verifyCredential });
    await expect(verify).toHaveAttribute('href', /^https:\/\/app\.diplomasafe\.com\//);
    await expect(verify).toHaveAttribute('rel', /noopener/);
  });

  test('an unknown service slug shows the not-found page', async ({ page }) => {
    await page.goto('/about/no-such-service');
    await expect(page.getByRole('heading', { level: 2, name: copy('en', 'common').notFound.title })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  });

  test('going from an unknown service back to About renders the full page', async ({ page }) => {
    // Same route (/about/:serviceSlug?), so this used to reuse the instance
    // that had rendered NotFound: the header stayed invisible, the counter at 0.
    const about = copy('en', 'about');
    await page.goto('/about/no-such-service');
    await page.getByRole('link', { name: copy('en', 'common').notFound.home }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: about.titleHighlight }).first()).toBeVisible();
    // The counter starts once it is on screen; it can sit below the fold.
    const counter = page.getByText(/^\d\+$/).first();
    await counter.scrollIntoViewIfNeeded();
    await expect(counter).toHaveText('5+');
  });

  test('the years counter counts up when scrolled into view inside the content panel', async ({ page }) => {
    // On desktop the page scrolls in the content panel, not the window: a
    // window-based ScrollTrigger left the counter at "0+" below the fold.
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/about');
    const counter = page.getByText(/^\d\+$/).first();
    await counter.scrollIntoViewIfNeeded();
    await expect(counter).toHaveText('5+');
  });
});

test.describe('theme', () => {
  test('the theme toggle switches and persists across reloads', async ({ page }) => {
    await page.goto('/about');
    const html = page.locator('html');
    const startsDark = (await html.getAttribute('class'))?.includes('dark') ?? false;

    await page.getByRole('button', { name: /theme|dark|light/i }).first().click();
    await expect(html).toHaveClass(startsDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);

    await page.reload();
    await expect(html).toHaveClass(startsDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
  });
});

test.describe('print', () => {
  test('the printable CV is in the DOM and is the only thing printed', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('.print-container')).toBeAttached();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.print-container')).toBeVisible();
    await expect(page.locator('main')).toBeHidden();
  });
});

for (const colorScheme of ['light', 'dark'] as const) test.describe(`accessibility (WCAG 2.1 AA, ${colorScheme})`, () => {
  test.use({ colorScheme });
  // axe on the projects grid can take a while on a loaded CI runner.
  test.describe.configure({ timeout: 60_000 });
  for (const path of ['/about', '/resume', '/projects', '/contact']) {
    test(`${path} has no axe violations`, async ({ page }) => {
      await page.goto(path);
      const { titleHighlight } = copy('en', path.slice(1));
      await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: titleHighlight }).first()).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.print-container') // print-only layout, hidden on screen
        .analyze();

      expect(
        results.violations.map(
          (v) =>
            `${v.id} (${v.impact}): ${v.help} -> ${v.nodes
              .map((node) => `${node.target.join(' ')} [${node.any[0]?.message ?? node.failureSummary ?? ''}]`)
              .join(' | ')}`,
        ),
      ).toEqual([]);
    });
  }

  test('the not-found page has no axe violations', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.getByRole('heading', { level: 2, name: copy('en', 'common').notFound.title })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.print-container')
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}`)).toEqual([]);
  });
});

test.describe('accessibility of overlays (WCAG 2.1 AA)', () => {
  test.describe.configure({ timeout: 60_000 });
  const scan = async (page: import('@playwright/test').Page, include: string) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include(include)
      .analyze();
    return results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
    );
  };

  test('the open command palette has no axe violations', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox', { name: 'Search commands' }).fill('pro');
    await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
    await expect(page.getByRole('option').first()).toBeVisible();
    // Items fade in with a stagger; measure contrast on the settled state.
    await expect
      .poll(() =>
        page.$$eval('[role="option"]', (els) => els.every((el) => getComputedStyle(el).opacity === '1')),
      )
      .toBe(true);
    expect(await scan(page, '[role="dialog"]')).toEqual([]);
  });

  test('an open project modal has no axe violations', async ({ page }) => {
    await page.goto('/projects/aegisqa');
    const modal = page.locator('[data-modal-content]');
    await expect(modal).toBeVisible();
    expect(await scan(page, '[data-modal-content]')).toEqual([]);
  });
});
