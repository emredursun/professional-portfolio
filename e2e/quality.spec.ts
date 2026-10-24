import AxeBuilder from '@axe-core/playwright';
import { copy, expect, test } from './fixtures';

const report = {
  commit: 'abcdef1234567',
  shortCommit: 'abcdef1',
  builtAt: '2026-10-24T12:00:00.000Z',
  unit: { passed: 113, failed: 0, coverage: 88 },
  e2e: { passed: 107, failed: 0, flaky: 0, skipped: 13 },
  a11y: { scans: 26, violations: 0 },
  lighthouse: { performance: 95, accessibility: 100, bestPractices: 100, seo: 100 },
  security: { runtimeAdvisories: 0, strictCsp: true },
};

const serveReport = (page: import('@playwright/test').Page, body: unknown, status = 200) =>
  page.route('**/quality.json', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
  );

const { quality } = copy('en', 'common');

test.describe('quality report', () => {
  test('shows every check from the CI report', async ({ page }) => {
    await serveReport(page, report);
    await page.goto('/quality');

    await expect(page.getByRole('heading', { level: 2 })).toContainText('Quality');
    await expect(
      page.getByText('$ npm run verify · build abcdef1', { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'unit' })).toContainText(
      '113 passed · coverage 88%',
    );
    await expect(page.getByRole('listitem').filter({ hasText: 'axe violations' })).toContainText(
      '0 axe violations · WCAG 2.1 AA',
    );
    await expect(page.getByText('220 passed · 0 failed · 0 flaky')).toBeVisible();
    await expect(page.getByText(quality.metrics.monitoringValue)).toBeVisible();
    await expect(page).toHaveTitle(`${quality.title} | Emre Dursun`);
  });

  test('sends nobody to the source code', async ({ page }) => {
    await serveReport(page, report);
    await page.goto('/quality');
    await expect(page.getByText('220 passed · 0 failed · 0 flaky')).toBeVisible();
    await expect(
      page.locator('main a[href*="github.com/emredursun/professional-portfolio"]'),
    ).toHaveCount(0);
  });

  test('marks a failing check instead of hiding it', async ({ page }) => {
    await serveReport(page, { ...report, lighthouse: { ...report.lighthouse, performance: 72 } });
    await page.goto('/quality');
    const line = page.getByRole('listitem').filter({ hasText: 'lighthouse' });
    await expect(line).toContainText('✗');
    await expect(line).toContainText('perf 72');
  });

  test('says so when the report is incomplete, rather than showing numbers', async ({ page }) => {
    // A 404 is covered by the same branch, but the browser logs it as a
    // console error, which the fixture rightly treats as a failure.
    await serveReport(page, { shortCommit: 'abcdef1' });
    await page.goto('/quality');
    await expect(page.getByRole('status')).toContainText(quality.unavailable);
    await expect(page.getByText(/passed ·/)).toHaveCount(0);
  });

  test('the About stats card links to it, keeping the language', async ({ page }) => {
    await serveReport(page, report);
    await page.goto('/nl/about');
    const entry = page.getByRole('link', {
      name: new RegExp(copy('nl', 'common').quality.entryTitle),
    });
    // Centre it first: scrolled to the bottom edge it sits under the mobile
    // bottom navigation, which would take the tap.
    await entry.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await entry.click();
    await expect(page).toHaveURL(/\/nl\/quality$/);
    await expect(page.getByRole('heading', { level: 2 })).toContainText(
      copy('nl', 'common').quality.headingRest,
    );
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no axe violations (WCAG 2.1 AA, ${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await serveReport(page, report);
      await page.goto('/quality');
      await expect(page.getByText('220 passed · 0 failed · 0 flaky')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.print-container')
        .analyze();
      expect(
        results.violations.map(
          (v) =>
            `${v.id} (${v.impact}): ${v.nodes.map((n) => `${n.target.join(' ')} [${n.any[0]?.message ?? ''}]`).join(' | ')}`,
        ),
      ).toEqual([]);
    });
  }
});
