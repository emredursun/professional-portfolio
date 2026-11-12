# ADR 0002: Serve each portfolio page's content in its HTML

- Status: Accepted
- Date: 2026-11-12
- Deciders: Emre Dursun (owner), with Claude as implementer

## Context

Google Search Console reported "Soft 404" for emredursun.nl, including for
pages in the sitemap. Two causes were certain and are fixed separately
(CHANGELOG): unknown sub-pages answered 200 with a "Page not found" view, and
`/`, `/nl` and `/tr` were sitemap URLs that only redirected in JavaScript.

The underlying weakness was how pages are built. Every route had its own
prerendered `<head>` (`scripts/prerender-routes.js`), but every body was the
same: the intro curtain, with all content left to React. Google renders
JavaScript, but in a second, later pass and not always fully; Bing, link
previews and AI crawlers mostly do not run it. Google's guidance for
JavaScript sites is to serve the content in the HTML: server-side rendering,
static rendering, or hydration.

Constraints: the CSP stays strict (`style-src 'self'`, no inline styles); the
app keeps its client-side behaviour; no server; one maintainer.

## Options

1. **Server-side rendering with hydration** (`renderToString`, `hydrateRoot`).
   The app reads `window` during render (`isMobileView`, theme, language),
   loads translations over HTTP and lazy-loads parts. Making all of that
   server-safe is a rewrite of the app's boot, with hydration mismatches as
   the standing risk.
2. **Static snapshots of the built app** (chosen). After the build, load
   every route in Chromium and write what it rendered into that route's HTML.
3. **Leave rendering to Google.** Keeps the weakness that caused the reports.

## Decision

`scripts/prerender-content.js` runs in `postbuild`, after the heads. For every
sitemap route in every language it loads the built page in Chromium with
reduced motion, waits until the title is the route's own (SEO.tsx sets it only
once the translations have loaded), and takes the `#root` content at a
desktop (1280 px) and, for About, a phone width (390 px), because the app
lays out differently below 1024 px. Both snapshots go between the prerender markers in
`#root`, each in a wrapper that `index.css` shows only at its width. The
print-only CV is removed (it would repeat the CV on every page), and so are
style attributes, which the CSP blocks in HTML anyway.

At runtime, `index.tsx` sees the snapshot, waits for the translations (at
most 4 s) and then lets React render: `createRoot` replaces the snapshot with
the same page, live. The intro curtain does not play over content that is
already there.

## Consequences

- Every crawler gets the full text, headings and links of every page in the
  first response. Visitors see the page before the JavaScript runs.
- The raw i18n keys that flashed before the translations loaded are gone on
  route pages: React's first render now has the translations.
- The build needs Playwright's Chromium (`npx playwright install chromium`);
  CI installs it before the build. The build takes about a minute longer.
- HTML is larger (about 200–290 KB raw, 12–15 KB brotli per page): two layouts.
- Until React takes over (a few hundred milliseconds), buttons on the page do
  nothing; links work as normal links. The e2e fixture waits for the
  hand-over before driving the app.
- `/quality` keeps the app shell: its report (`/quality.json`) is written by
  CI after the build, so a snapshot would say "not available", which Google
  reads as a soft 404.
- Only About snapshots the phone layout. On a phone every other page scrolls
  past the sidebar to its content as it loads, which a static page cannot do;
  the visitor would see the sidebar, then a jump, and the hand-over left
  nothing that counted as a largest contentful paint (Lighthouse NO_LCP).
  Those pages keep the curtain on phones and boot as before; their text is
  still in the HTML through the desktop snapshot, which is what crawlers that
  do not run JavaScript read.
- React's first render on a prerendered page skips framer-motion entrances
  (`MotionGlobalConfig.skipAnimations` for two frames): the content is already
  on screen, and replacing it invalidates the static LCP in the browser's
  trace, so React's content must paint at full opacity to count again.
