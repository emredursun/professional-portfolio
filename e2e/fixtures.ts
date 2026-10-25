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
