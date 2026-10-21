# Changelog

All notable changes to emredursun.nl. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

The result of a production-readiness review (preflight score 36/100). On branch `feat/preflight-remediation`, not yet deployed.

### Performance
- Removed an unused, render-blocking `@babel/standalone` (2.8 MB) and the AI Studio import map from `<head>`.
- Self-hosted the fonts and Font Awesome; Font Awesome CSS no longer blocks first paint.
- A static app shell in `index.html` paints before any JavaScript.
- Shortened the preloader from 4.3 s to about 1.3 s. It no longer holds the page unmounted, and it plays once per session and never with reduced motion.
- Split the entry bundle (app code 123 → 32 KB gzip). Vendor chunks now stay cached across deploys.
- Deployed assets went from 37 MB to 1.5 MB:
  - unused images archived
  - images converted to WebP
  - favicons that were really 1024 px now 96 px
  - the OG image cut from 588 to 110 KB
- Lighthouse desktop 97 / 100 / 100 / 100.

### Security & privacy
- Strict Content-Security-Policy (no `'unsafe-inline'`), COOP, a tighter Permissions-Policy, and HSTS preload.
- Removed Google Analytics, which ran without consent. Google Maps now loads only on request.
- Runtime dependency advisories fixed: react-router, i18next-http-backend.
- Dropped a Vite `define` that would have inlined `GEMINI_API_KEY` into the client bundle.
- Contact form: honeypot, length limits, response checking.

### Fixed
- The command palette's "Go to …" commands did nothing.
- Dutch and Turkish visitors were sent to English pages from service links.
- The landing page's title was just "About"; project deep links showed "Projects".
- The error boundary missed render errors, yet replaced the whole site on unrelated script errors.
- A third-party grain texture returned 402 on every load.
- The sitemap was restamped on every build, and generated files showed phantom diffs on Windows.

### Accessibility
- Decorative icons are hidden from screen readers; they had been leaking glyphs into link names.
- The scrollable content area is keyboard-focusable.
- `prefers-reduced-motion` is respected in CSS, GSAP and framer-motion.
- Light-theme contrast fixes (highlight text was 1.66:1).
- The command palette follows the WAI-ARIA combobox pattern.

### Engineering
- Strict TypeScript (React type definitions had never been installed).
- Vitest unit tests: 71 tests, 88% line coverage on logic modules.
- Playwright end-to-end suite: 67 tests, desktop and mobile, with axe WCAG 2.1 AA checks in both themes and on open overlays.
- CI quality gates in front of every deploy, Lighthouse budgets, a production smoke test, uptime monitoring every 30 minutes, and `/version.json`.
- Node 22+.

## 2026-09-03

### Changed
- Profile photo switched to `portfolio-pic-1.jpeg` ([#7](https://github.com/emredursun/professional-portfolio/pull/7)).

## 2026-08-23

### Added
- The GitHub profile README is generated from portfolio data, with a drift guard that fails the build ([#4](https://github.com/emredursun/professional-portfolio/pull/4)).

### Fixed
- Current location corrected to Nieuwegein in all languages ([#4](https://github.com/emredursun/professional-portfolio/pull/4)).
- Sitemap `lastmod` only changes when the content it covers changes ([#5](https://github.com/emredursun/professional-portfolio/pull/5), [#6](https://github.com/emredursun/professional-portfolio/pull/6)).
