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
- The WebGL particle field no longer allocates per frame, and it is skipped on touch devices.
- Lighthouse (same machine and load as before): mobile 57 → 86–87, desktop 91 → 94–99. Accessibility, best practices and SEO are 100.

### Security & privacy
- Strict Content-Security-Policy (no `'unsafe-inline'`), COOP, a tighter Permissions-Policy, and HSTS preload.
- Removed Google Analytics, which ran without consent. Google Maps now loads only on request.
- Runtime dependency advisories fixed: react-router, i18next-http-backend.
- Dropped a Vite `define` that would have inlined `GEMINI_API_KEY` into the client bundle.
- Contact form: honeypot, length limits, response checking.

### Added
- The Resume timeline fills with light as you scroll through it, lighting each role as you reach it, with a slow pulse on the current role. CSS scroll-driven animation only (no JavaScript, compositor-friendly); static for reduced motion and in browsers without scroll-driven animations.
- A machine-readable profile: `/resume.json` (JSON Resume, schema-validated) for résumé and ATS tools, and `/llms.txt` (llmstxt.org) for AI assistants, both generated from the site's own data at build time and linked from every page's head.
- A `/quality` page with the results of the CI run behind the live build: unit tests and coverage, end-to-end tests, accessibility scans, Lighthouse and security checks. A verification card in the About section leads to it. Every number comes from the run itself (`dist/quality.json`); without a complete report the page says so instead of showing numbers.
- Per-route HTML heads at build time: every page and every service and project detail page, in all three languages, has its own title, description, canonical, hreflang and Open Graph tags in the HTML itself, so shared links preview the right page.
- Structured data as one linked graph (`@id`), with a `ProfilePage` for the About page and the portrait as an `ImageObject`. The portrait is renamed `emre-dursun-qa-consultant.jpg` (old URLs redirect with a 301) and listed in the image sitemap.
- Downloadable PDF CV in English, Dutch and Turkish, rendered from the site's print layout at build time. It replaces the browser print dialog.
- Service and project detail pages are in the sitemap (75 URLs across three languages). Each service page has its own title and description.
- A localized `noindex` "not found" page, served with a real 404 status by Firebase.
- Certifications link to the issuer's verification page (ISTQB on Diplomasafe, Pega CPBA/CPSA), on the site, in the JSON-LD and in the profile README.
- A "Skip to content" link as the first tab stop.

### Changed
- ING case study with measurable results: 400 legacy payment scenarios migrated and 450 new ones onboarded (850), with a full regression run and its report cut from several days to 3–5 hours.
- Claims audit against the public record: AegisQA is described as the work in progress its repository shows (23 tests; database, AI and CI/CD on the roadmap); QASmartTestLab is described by what its repository shows (parallel thread-safe scenarios, local or remote Grid runs, four report formats) instead of unverified percentages, API/database layers and multi-browser support it does not have, and without the "100+ stars" card (the repository has none); the About intro gives Dutch as B2, matching the language list; BeSync's links to its private repository (404s) are removed and its self-issued certificate is labelled as such; Devran AI Kit's skill count matches its README (44).
- Content synced with the current LinkedIn profile: Tricentis Testim Product Consultant (Advanced, September 2026), Playwright, AI Backbone at Sopra Steria.
- Experience: the ING entry explains the first year through Sogyo and the second internal, with the FFV validations and the Belgium, Italy, Hungary and Slovakia rollouts. Nerex Motors and BSG Auto Parts are shown as one group with their own dates (from September 2020).
- The About bento grid and services grid respond to their container instead of the viewport. At about 1100 px, the content was squeezed into an 8/4 split.

### Fixed
- The contact page's on-demand map was centred on the home town; it now shows Nieuwegein, the work location. A test scans every shipped source for the home town and postcode.
- The structured data still published the previous home address with its postcode. It now gives the home province only (Noord-Holland) and Sopra Steria's Nieuwegein office as the work location; the sidebar reads "Nieuwegein (Sopra Steria) · Hybrid". Job title, dates and services in it are current.
- The project view overwrote the page's social tags with a different title, and with a broken image URL for externally hosted project images.
- A direct visit to a service URL (`/about/<service>`) crashed the page before its translations had loaded.
- The "5+ years" counter only counted when it started above the fold: it listened to the window's scroll, but on desktop the page scrolls inside the content panel.
- A tab left open across a deploy reloads once to pick up the new build, instead of hitting the error screen on its next lazy-loaded page.
- Opening, closing or paging a project on `/nl` or `/tr` sent the visitor to the English URL.
- Unknown URLs and unknown service or project slugs showed real pages with a 200 (soft 404s), and missing static files returned the app.
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
- Vitest unit tests: 122 tests, 87% line coverage on logic modules.
- Playwright end-to-end suite: 148 tests, desktop and mobile, with axe WCAG 2.1 AA checks in both themes, on open overlays and on the 404 page.
- `knip` in CI: unused files, exports and dependencies fail the build.
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
