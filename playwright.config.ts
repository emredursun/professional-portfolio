import { defineConfig, devices } from '@playwright/test';

const PORT = 4180;
const isCI = !!process.env.CI;

/**
 * End-to-end tests run against the production build served by `vite preview`,
 * which replays the security headers from firebase.json - so CSP regressions
 * fail here, not in production.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Skips the intro curtain (it honours reduced motion); e2e/preloader.spec.ts
    // opts back in to cover it.
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // CI builds once in an earlier step; locally, build if dist/ is missing.
    command: isCI ? `npx vite preview --port ${PORT} --strictPort` : `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/about`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
