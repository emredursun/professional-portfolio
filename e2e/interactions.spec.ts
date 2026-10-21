import AxeBuilder from '@axe-core/playwright';
import { copy, expect, test } from './fixtures';

test.describe('command palette', () => {
  test('opens with Ctrl+K, filters, navigates and closes', async ({ page }) => {
    await page.goto('/about');
    const search = page.getByPlaceholder(/command or search/i);

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

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/projects$/);
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
