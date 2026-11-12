import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type Locale = 'en' | 'tr' | 'nl';

/** Read a locale file, so assertions follow the copy instead of duplicating it. */
// Untyped JSON read by path in assertions (copy(...).services.x.title).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function copy(locale: Locale, namespace: string): Record<string, any> {
  const file = path.resolve(process.cwd(), `public/locales/${locale}/${namespace}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

type Fixtures = {
  /** Problems collected during the test; asserted empty after every test. */
  problems: string[];
};

/**
 * Every test fails if the page logs a console error, throws, or violates the
 * Content-Security-Policy - not only the tests that look for those things.
 */
export const test = base.extend<Fixtures>({
  /**
   * Route pages arrive with their content in the HTML
   * (scripts/prerender-content.js), a phone and a desktop copy, until React
   * replaces them. Tests drive the live app, so a navigation waits for that
   * hand-over; one that asks only for 'commit' sees the HTML as it arrives.
   */
  // Named `provide`, not `use`: react-hooks would read `use` here as a hook.
  page: async ({ page }, provide) => {
    const live = async () => {
      await page.waitForFunction(() => !document.querySelector('.prerender-desktop'), undefined, {
        timeout: 15_000,
      });
      // The app loads its idle-time parts (command palette, print CV) next.
      await page.waitForLoadState('networkidle');
    };
    const goto = page.goto.bind(page);
    const reload = page.reload.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      if (options?.waitUntil !== 'commit') await live();
      return response;
    };
    page.reload = async (options) => {
      const response = await reload(options);
      if (options?.waitUntil !== 'commit') await live();
      return response;
    };
    await provide(page);
  },
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];

      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) => {
          console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
        });
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));

      await use(problems);

      expect(problems, 'console errors, page errors or CSP violations').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
