# Changelog

All notable changes to emredursun.nl. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Removed
- Plausible analytics and the error reporting that sent to it. The site had no Plausible account, so every visit loaded its script and sent events that were thrown away. Pages now load nothing from third parties (an end-to-end test checks this), and the Content-Security-Policy no longer allows plausible.io.

## 2026-10-25 — post-launch hardening

Post-launch hardening from the follow-up reviews, merged in pull request #9.

### Added
- The Tricentis Testim Product Consultant certificate (Advanced, C26857, valid until September 2028) on the Tosca card, next to the Tosca certificate; its line in the Tosca benefits now shows in all three languages.

### Fixed
- The service detail panel is a named dialog; its previous, next, share and close buttons have names, and related projects, "Get in touch", certificates and course badges are real links.
- Command palette: project commands open the project, "Scroll to Top" works on desktop, category filters filter (`/projects?category=…`), and with recent commands shown only one option is selected and Enter runs it.
- Focus stays inside open modals (palette, project, service panel) and returns to where it was when they close. With the palette open over a project, only the palette handles Tab.
- Leaving a palette category filter (Back, or the plain Projects link) shows all projects again; the filter stayed until a reload.
- Page, card and quality-report entrances move or uncover text but no longer fade it, so text is never shown at reduced contrast while they play.
- The Resume skill bars and the contact success icon animate; their animations were referenced but never defined.
- "Certification path" and "Certified <date>" are translated; dead props and an invisible, untranslated tooltip are gone.
- Every text file is checked out with LF; on a Windows checkout with `core.autocrlf` the unit tests that load build scripts failed.

### Changed
- The portrait loads eagerly with high priority; the service worker no longer precaches the 110 KB social image.
- `main` is protected (pull request with a green quality check, no force push) and production deploys wait for the owner's approval; pull requests deploy a preview only with the `preview` label. The runbook describes both and the rollback through a revert pull request.
- Uptime also checks `/quality`, `/llms.txt` and `/resume.json`.

## 2026-10-25 — production-readiness release

The result of a production-readiness review (preflight score 36/100), merged in pull request #8 and deployed on 25 October 2026.

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
- Total Blocking Time is now under 15 ms on every page (was 175–390 ms, over the 200 ms budget on /about and /contact). The particle field is drawn on a 2D canvas instead of three.js, whose WebGL setup blocked the main thread for ~300 ms (and 125 KB gzip less JavaScript); the scroll tracker no longer watches every DOM change; the app and the decorative layers mount as interruptible transitions; favicon canvases stay off the GPU.
- No forced layouts on the About page's first render: the service cards' entrance is a CSS animation instead of a GSAP tween that read every card's transform, and smooth scrolling (Lenis) starts at the first idle moment. Its animation loop no longer outlives the component.
- The pointer spotlights on the sidebar and the About cards follow the mouse through CSS variables instead of re-rendering in React on every move.
- Lighthouse (same machine and load as before): mobile 57 → 86–87, desktop 91 → 94–99. Accessibility, best practices and SEO are 100.

### Security & privacy
- Strict Content-Security-Policy (no `'unsafe-inline'`), COOP, a tighter Permissions-Policy, and HSTS preload.
- Removed Google Analytics, which ran without consent. Google Maps now loads only on request.
- Runtime dependency advisories fixed: react-router, i18next-http-backend.
- Dropped a Vite `define` that would have inlined `GEMINI_API_KEY` into the client bundle.
- Contact form: honeypot, length limits, response checking.
- Error reports to Plausible carry no personal data: email addresses, credentials, long ids and long numbers are removed, and the contact form reports a fixed code instead of the provider's error text.
- The service worker handles only its own origin (an exact match; look-alike hosts got through a substring test) and deletes only its own old caches.

### Added
- Under the contact form: where a message goes (Web3Forms) and what name and email are used for, with a link to Web3Forms' privacy policy, in all three languages.
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
- A failed contact form submission kept the error but lost the message: the form was replaced and "Try again" brought back an empty one. The form and its input now stay, with the error announced above the send button; a request that never answers times out after 15 s.
- The contact page's on-demand map was centred on the home town; it now shows Nieuwegein, the work location. A test scans every shipped source for the home town and postcode.
- The structured data still published the previous home address with its postcode. It now gives the home province only (Noord-Holland) and Sopra Steria's Nieuwegein office as the work location; the sidebar reads "Nieuwegein (Sopra Steria) · Hybrid". Job title, dates and services in it are current.
- The project view overwrote the page's social tags with a different title, and with a broken image URL for externally hosted project images.
- A direct visit to a service URL (`/about/<service>`) crashed the page before its translations had loaded.
- The "5+ years" counter only counted when it started above the fold: it listened to the window's scroll, but on desktop the page scrolls inside the content panel.
- A tab left open across a deploy reloads once to pick up the new build, instead of hitting the error screen on its next lazy-loaded page.
- Opening, closing or paging a project on `/nl` or `/tr` sent the visitor to the English URL.
- Unknown URLs and unknown service or project slugs showed real pages with a 200 (soft 404s), and missing static files returned the app.
- The command palette's "Go to …" commands did nothing.
- Typing "(", "[" or another regex character into the command palette crashed the page; the search text is now matched literally.
- Dutch and Turkish visitors were sent to English pages from service links.
- The landing page's title was just "About"; project deep links showed "Projects".
- The error boundary missed render errors, yet replaced the whole site on unrelated script errors.
- A third-party grain texture returned 402 on every load.
- The sitemap was restamped on every build, and generated files showed phantom diffs on Windows.

### Accessibility
- The About page's service cards open from the keyboard. They were clickable divs that Tab skipped; each title is now a link that covers its card.
- Button labels, tooltips and the whole command palette are in the page's language; on the Dutch and Turkish pages they were English.
- Decorative icons are hidden from screen readers; they had been leaking glyphs into link names.
- The scrollable content area is keyboard-focusable.
- `prefers-reduced-motion` is respected in CSS, GSAP and framer-motion.
- Light-theme contrast fixes (highlight text was 1.66:1).
- The command palette follows the WAI-ARIA combobox pattern.

### Engineering
- Strict TypeScript (React type definitions had never been installed).
- Vitest unit tests: 129 tests, 86% line coverage on logic modules.
- Playwright end-to-end suite: 190 tests, desktop and mobile, with axe WCAG 2.1 AA checks in both themes, on open overlays and on the 404 page.
- `knip` in CI: unused files, exports and dependencies fail the build.
- ESLint (typescript-eslint, react-hooks with the React Compiler rules, jsx-a11y) and Prettier formatting in CI; any lint warning fails. Their first run found and fixed: project cards and gallery screenshots that the keyboard could not open, a conditionally called hook, a custom cursor 20 px off the pointer, particles retargeted on every render, and state that mirrored the URL.
- CI quality gates in front of every deploy, Lighthouse budgets on desktop and mobile (median of 5 runs each), a production smoke test, uptime monitoring every 30 minutes, and `/version.json`.
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
