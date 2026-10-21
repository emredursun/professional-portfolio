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
