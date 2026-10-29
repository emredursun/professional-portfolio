# ADR 0001: Build the Field Notes blog as static HTML with our own script

- Status: Accepted; Phases 1–4 complete, not launched
- Date: 2026-10-28
- Deciders: Emre Dursun (owner), with Claude as implementer

## Context

The portfolio is a React 19 + Vite SPA on Firebase Hosting. Every route already
ships its own prerendered `<head>` (`scripts/prerender-routes.js`), but the
body is rendered by React, and `index.tsx` mounts with `createRoot`, which
replaces any HTML it finds in `#root`. A blog needs the whole article in the
first HTML response: for readers on slow devices, for crawlers that do not run
JavaScript, and for link previews.

Constraints that any option must meet:

- The production CSP stays as strict as it is: `script-src 'self'`,
  `style-src 'self'`, `font-src 'self'`, no `'unsafe-inline'`.
- No third-party requests and no tracking.
- Deterministic output: CI fails on any diff in generated files.
- One toolchain to maintain, by one person.
- Firebase Hosting with `cleanUrls: true` and `trailingSlash: false`; unknown
  paths must keep returning a real 404 through `404.html`.

## Decision

Blog pages are standalone static HTML files, generated at build time by
`scripts/build-blog.js` from Markdown in `blog/content/<slug>/<lang>.md`. They
are not part of the React SPA. The portfolio links to them with plain anchors,
so moving between the two is a full page load.

- Markdown: `markdown-it` with raw HTML off and a link allowlist.
- Frontmatter: our own `---` split plus `yaml` (core schema, unique keys, no
  aliases), validated with a strict `zod` schema. Never `gray-matter`.
- Code: Shiki at build time, emitting classes instead of inline styles.
- Templates: escape-by-default tagged templates. No client-side rendering.
- Styles, fonts and the small client script go through the existing Vite
  build as a second entry, so they get hashed, immutable file names.
- Until launch every blog page carries `noindex, nofollow`
  (`BLOG_LAUNCHED = false`).

## Options rejected

| Option | Why not |
| --- | --- |
| Astro | A second framework, dev server and asset pipeline to keep CSP-clean; strong for large content sites, more than four posts need |
| Next.js static export | Ships the React runtime to article pages; would mean moving the whole site |
| Render posts inside the SPA | `createRoot` wipes prerendered HTML; every reader pays for the full app bundle |
| Eleventy | Closest alternative, but adds Nunjucks and another dependency tree for what is a few hundred lines here |
| `gray-matter` | Supports `---js` frontmatter, which evaluates code |
| Headless CMS (Ghost, WordPress) | Accounts, hosting and keys to manage; the owner chose Git and pull requests as the editorial flow |

## Threat model

| Threat | Control |
| --- | --- |
| HTML or script in a post | `html: false`; templates escape every value; unit test asserts no `style=`, no `on*=`, no executable inline `<script>` |
| `javascript:`, `data:`, `vbscript:`, `file:` or protocol-relative links | Allowlist (`http`, `https`, `mailto`, relative, `#`); any other scheme fails the build |
| Code execution through frontmatter | No `gray-matter`; `---js` style openers rejected; YAML core schema, unknown tags and aliases rejected |
| YAML alias bombs | Aliases disabled |
| Path traversal through a slug | Slug pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`, must equal its folder name; output path checked to stay inside `dist/blog` |
| External images breaking CSP | External image URLs fail the build |
| Supply chain | Markdown, YAML, Shiki and zod are build-time devDependencies; only font files ship; lockfile committed; runtime audit in CI |
| Drafts or the spike indexed from a public preview channel | `noindex, nofollow` on every blog page until launch |
| Build manifest published | `dist/.vite/` matches `firebase.json` `ignore: **/.*`; a test locks it |
| Anything that slips through | The CSP is the second layer: no inline script or style can run |

## Must criteria for Phase 1

1. `npm run build` emits `dist/blog/<slug>.html`; preview serves it with 200,
   an unknown blog path returns 404 and a trailing slash returns 301.
2. Zero CSP violations in e2e; no `style=`, `on*=` or inline executable script.
3. All Markdown, frontmatter and slug security tests pass.
4. Two builds are byte-identical; changing the system clock changes nothing.
5. Portfolio output differs from the baseline only where expected; its
   Lighthouse budgets still pass.
6. Blog page budget: script ≤ 20 KB, total ≤ 300 KB, LCP ≤ 2.0 s desktop /
   2.5 s mobile, CLS ≤ 0.1, TBT ≤ 100 ms, no third-party requests,
   accessibility and best practices = 1.
7. axe: no violations in light and dark, desktop and mobile.
8. No theme flash; the theme choice is shared with the portfolio.
9. `noindex, nofollow` on every blog page while `BLOG_LAUNCHED` is false.
10. Coverage thresholds hold; every new module ≥ 80 % lines.

## Fallback

If a Must criterion still fails after reasonable effort, run a one-day,
time-boxed Astro spike against the same criteria and record the outcome here.

## Launch checklist (later phases)

- Set `BLOG_LAUNCHED = true`. This also writes `/blog/feed.xml` and adds
  the feed links, which stay out before launch because `noindex` cannot
  reach XML and feed services cache what they find.
- ~~Serve the feed as `application/atom+xml; charset=utf-8`~~ Done in
  Phase 2 (`firebase.json` header, pinned by `tests/hosting.test.ts`).
- ~~Extend the preview check to the feeds' headers~~ Done in 4b:
  `scripts/check-blog-live.sh` (feeds as Atom with `nosniff`, a post
  indexable, an unknown post 404) runs in the preview check, the deploy
  smoke test and the uptime check, and switches itself on once the feed
  exists.
- Re-enable the Lighthouse `is-crawlable` audit for blog pages.
- ~~Add blog routes to the sitemap and the deploy smoke test~~ Done in 4b,
  behind the flag (see Phase 4b results).
- ~~Extend the path-aware 404 to `/tr/blog/*` and `/nl/blog/*`~~ Done in 4b.
- Have the Turkish and Dutch sample text reviewed, or replaced by the real
  posts, before launch.
- ~~Add the blog link to the portfolio navigation~~ Done in 4b (it ships
  with the launch merge, since `feat/blog` never deploys).
- ~~Check that `/blog` resolves to `blog.html` next to the `blog/` folder~~
  Checked on every labelled PR by `preview.yml` from Phase 2 on.
- Replace the samples (`placeholder: true`) with real posts: the build
  refuses to launch while any placeholder remains (Phase 4c). Lighthouse,
  e2e and the preview check take their pages from the build, so nothing
  else changes.
- Merge `feat/blog` into `main` only in the launch PR (see Branches below).

### Branches

`feat/blog` does not merge into `main` before launch. `deploy.yml` ships
every push to `main`, so an early merge would publish the blog and its
placeholder posts on emredursun.nl (noindex, but reachable). Keeping the
branch apart is simpler and safer than a build switch. Each phase is a PR
into `feat/blog`; the launch PR is the one into `main`.

### Languages and URLs (decided before launch)

- English at `/blog/<slug>`, Turkish at `/tr/blog/<slug>`, Dutch at
  `/nl/blog/<slug>`, matching the portfolio's `/tr` and `/nl` prefixes.
- One slug per post folder, shared by every language
  (`blog/content/<slug>/{en,tr,nl}.md`); slugs are not translated.
- The launch post set is in all three languages; later posts may exist in
  fewer. hreflang links only the languages a post actually has, plus
  `x-default` to English.
- Each language gets its own index and feed (Phase 3a).
- A translation must share the original's publishedAt, kind, topic,
  status and evidence re-check date, or the build fails. It records the
  English version it follows
  (`translation.from`) and whether AI helped; when the English changes
  later, the page says so and links to it. Until a post is translated, the
  other indexes list it as English (`lang="en"`, `hreflang="en"`, a chip).
- "Field Notes" stays the name in every language, like the mark.
- "Keep reading" at the end of an article suggests posts in the same
  language only: an article is not the place to switch language, and the
  index and the language menu already offer English posts.

Fixed from launch on: post slugs and the domain. Atom entry ids are the post
URLs, so changing either would make every reader show every post as new.

## Baseline (T0, before any blog code)

Measured on 709b1c4 in the `pp-blog` worktree, Windows, Node 22.

- Build (`npm run build`, including pre- and postbuild): 10.3 s cold, 8.2 s warm.
- `dist`: 175 files (hashes kept outside the repo for the before/after diff).
- Unit tests: 15 files, 124 tests. Coverage: statements 86.49 %, branches
  87.95 %, functions 91.37 %, lines 85.41 %.
- Lighthouse medians (5 runs, this machine): see the table below.

## Phase 1 results

**Decision: go.** Every must criterion is met; the Astro fallback is not
needed.

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Page built; 200 / unknown 404 / trailing slash 301 | Met (e2e and preview plugin match Firebase; hosting test proves no rewrite) |
| 2 | No CSP violations, inline style or script | Met (0 violations across the e2e suite; template test) |
| 3 | Markdown, frontmatter, slug security tests | Met (two security reviews; no bypass found; findings fixed with tests) |
| 4 | Deterministic output | Met (byte-identical builds under two clocks) |
| 5 | Portfolio output unchanged | Met (dist identical to T0 apart from version.json and resume.json's build time, which already change on every build) |
| 6 | Blog budget | Met (table below) |
| 7 | axe clean in both themes | Met (system light, system dark, dark pinned on a light system) |
| 8 | No theme flash; shared choice | Met (client script held back in e2e; choice carries to /about) |
| 9 | noindex until launch | Met |
| 10 | Coverage | Met (overall 90.4 % lines; every new module ≥ 80 %) |

All 15 CI gates passed locally in CI order. Unit tests: 124 → 328.

Lighthouse medians on this Windows machine (CI runners are faster; mobile
numbers here sit well below what CI reports for the same pages):

| Page | Form factor | Perf | LCP | CLS | TBT | Transfer |
| --- | --- | --- | --- | --- | --- | --- |
| /about (T0) | mobile | 0.85 | 3.26 s | 0 | 184 ms | 306 KB |
| /about (T1) | mobile | 0.88 | 3.11 s | 0 | 104 ms | 306 KB |
| /blog/sample (T1) | mobile | 0.99 | 1.82 s | 0.031 | 0 ms | 149 KB |
| /about (T1) | desktop | 0.98 | 0.77 s | 0 | 0 ms | 306 KB |
| /blog/sample (T1) | desktop | 1.00 | 0.42 s | 0.001 | 0 ms | 149 KB, of which 4 KB script and 111 KB fonts |

Choices made during the spike:

- Fonts: Bricolage Grotesque as one variable file (41 KB Latin) instead of
  three static weights; Newsreader 400 and italic; JetBrains Mono 400.
  Browsers fetch only the faces and subsets a page uses.
- Code theme: Shiki's github-dark-high-contrast on the dark code
  background, in both site themes; colours come from classes.
- Colours are written out per theme rather than with light-dark(), so
  Safari before 17.5 and Chrome before 123 keep colours and focus rings.
- Content loading is strict: every folder under blog/content must be a
  valid slug and every post, drafts included, must validate.

Follow-ups, not blocking:

- ~~Small CLS (0.031) from the font swap~~ Fixed in Phase 2: each page
  preloads the face its largest text uses; article CLS is now 0.000.
- The service worker's offline fallback for an uncached blog page is the
  SPA shell; a plain offline page for /blog would be clearer.
- The browser theme-color follows the system setting, not a pinned theme.

## Phase 2 results

Discoverability while still noindex.

- `/blog` index (essays as cards, short notes as a list, newest first),
  Blog JSON-LD with inline BlogPosting nodes, "Keep reading" after each
  article, an author card and a closing invitation on every page.
- Status icons (hypothesis, testing, verified, revised); stale evidence is
  flagged on the article and the index, in the browser, so the build never
  reads the clock.
- The last-change date counts corrections (feed, dateModified).
- The Atom feed is built but written only after launch: noindex cannot
  reach XML and feed services cache what they find.
- A second, clearly marked placeholder post makes the notes list and the
  related links part of every e2e and Lighthouse run.
- CI rebuilds the blog after the build and compares hashes; labelled PRs
  check blog paths on real Firebase Hosting.

Lighthouse medians on this machine (mobile): `/blog` LCP 1.84 s, CLS 0.001,
perf 0.99; article LCP 1.82 s, CLS 0.000 (was 0.031), perf 0.99. Desktop
article: LCP 0.45 s, CLS 0.001, perf 1.00.

Deferred, with the reason:

| Item | Phase |
| --- | --- |
| Topic filter (as crawlable topic pages) | Done in 3b (see below) |
| "Now" log | Done in 3c (see below) |
| Illustrations | When there is real artwork |
| Turkish and Dutch | Done in 3a (see below) |
| Per-post link preview images | Done in 4a (see below) |
| Navigation link, sitemap, smoke test, path-aware 404 | Launch |
| "This site tests itself" strip | Later; it is a site-wide claim, not a blog one |
| Offline page for /blog, theme-color for a pinned theme | Later |

## Phase 3a results (Turkish and Dutch)

- UI text moved to `scripts/blog/strings.js` first; the English pages
  were byte-identical before and after (sha256 of `dist/blog*`).
- That gate found a real determinism bug: Shiki prints a line plain once
  tokenizing it takes over 500 ms, and a cold regex engine hit that on the
  first TypeScript line. `tokenizeTimeLimit: 0` fixes it; content is our
  own, so there is no hostile input to bound.
- Pages for all three languages, one index and feed each, hreflang only
  for versions that exist (a build test and an e2e test check that every
  alternate exists and links back), a static language menu, English
  fallbacks on the other indexes, and a note when the English version is
  newer than its translation.
- Turkish pages preload the latin-ext file of their largest text's face
  (ğ, ş and İ live there); measured: both faces' latin-ext files load.
- Firebase applies header rules whatever the status, so before launch
  the feed URLs' 404 carries the Atom Content-Type. The preview check
  asserts only the 404, and the local preview server answers it the same
  way. Nothing links to the feeds before launch.
- Checks: 443 unit tests (lines 91.9%), the blog build twice gives
  identical files, e2e 244 passed on desktop and mobile, code and
  security reviews with no critical or high findings.

Still to do in Phase 3: crawlable topic pages (3b) and the "Now" log
(3c). Illustrations wait for real artwork.

## Phase 3b results (topic pages)

- `/blog/topic/<topic>` and the same under `/tr` and `/nl`, written only
  for a language that has posts on that topic, so there are no empty
  pages to crawl. hreflang lists the languages that have the same topic
  page; English always does, because every post has an English version on
  the same topic.
- The cards on the index and topic pages come from one module
  (`templates/cards.js`); every card's topic and the article's kicker link
  to the topic page, so each page is one plain link away.
- JSON-LD: `CollectionPage` inside the language's blog, with
  `BreadcrumbList`. The preview check also loads two topic pages on real
  Hosting.
- The front page's band of themes ("Pega and Tosca", "Life in three
  languages") stays plain text: those are themes of the writing, not the
  three-topic taxonomy, and linking them would promise pages that do not
  exist.

## Phase 3c results ("Now" log)

- `blog/now/<lang>.md`, frontmatter only: `entries` of `{ date, text }`
  (280 characters at most), newest first, strict schema; English is
  required, like every post. A language gets a Now page only if it has a
  blog, so its alternates never point at a missing page.
- `/blog/now` (and under `/tr`, `/nl`) lists every entry; each index shows
  the newest one with a link. The page's `dateModified` is the newest
  entry's date, never the build's.
- Illustrations stay deferred until there is real artwork.

## Phase 4a results (link-preview images)

- One card per post and language, and one per language for the index,
  topic and Now pages, 1200 × 630, rendered by `npm run blog:og` in a local
  Chromium with the site's own Fontsource files (inlined as data URIs) and
  committed to `blog/og/`.
- The build never renders: it checks `blog/og/manifest.json` (a hash of
  each card's text, the language's strings, the template files and the font
  versions) and fails with the list of cards to re-render. It then copies
  each card to `/assets/blog-og-<id>-<hash>.png`, cached `immutable`, not
  under `/blog/**`, which is served `no-cache`.
- Pages carry `og:image` (with type, size and alt), `twitter:image` and the
  article's JSON-LD `image`. The blog build is still byte-deterministic
  (26 files, 8 of them images, identical over two builds).
- Cards are 14–22 KB each; a test keeps every committed card at 1200 × 630
  and under 150 KB.

## Phase 4b results (launch wiring behind the flag)

- **Sitemap:** `generate-sitemap.js` runs in prebuild, before the blog is
  built, so `scripts/blog/sitemap.js` reads the content itself and lists
  exactly the pages the build writes (indexes, posts, topic and Now pages).
  `lastmod` is each page's last content change, including what an index or
  topic page shows besides its own posts (untranslated English posts, the
  newest Now entry); alternates name only the versions that exist. A test
  builds the blog and checks the sitemap lists exactly the pages written. Empty before launch: the committed sitemap does not
  change until the flag flips (a dry run lists the samples' 16 pages).
- **404:** a missing page under `/blog`, `/tr/blog` or `/nl/blog` gets the
  app's 404 (a real 404 status) with "This note doesn't exist (yet)" in its
  language and a link back to that blog.
- **Navigation:** the sidebar, the mobile bottom bar and the command
  palette link to the blog in the page's language, as plain full-page
  links (the blog is outside the router). They appear only when
  `BLOG_LAUNCHED` is true (`BLOG_IN_NAV` in `src/utils/blog.ts` reads the
  same flag), so this branch could never link visitors to sample pages. The
  bottom bar's items went from a 54 px to a 50 px minimum: six items
  overflowed a 360 px screen by 2–3 px.
- **Monitoring:** one script, `scripts/check-blog-live.sh`, in the deploy
  smoke test, the hourly uptime check and the preview check. Whether the
  blog is launched comes from the checkout's `BLOG_LAUNCHED`, never from the
  site, so a launched blog whose feed disappears fails instead of passing
  as "not launched". The pages it checks come from the live sitemap, so it
  follows the languages and topics the content has. A test runs it against
  a local server, healthy and broken in six ways. The preview check takes
  its pages from `dist` and applies its pre-launch assertions (noindex, no
  feed) only while the build has no feed. Launch day needs no workflow
  change.
- **llms.txt:** a Field Notes section with the English posts, once launched.
  The WebSite JSON-LD is unchanged: the Blog node already points to it.
- **A stale-card test:** PR #21's first CI run failed in its build because a
  comment added to the card renderer after rendering made every card stale.
  A unit test now runs the build's card check on the real content, so
  `npm test` catches it before a push.

## Phase 4c results (content readiness, content-agnostic CI)

- **Launch gate:** posts and Now entries take `placeholder: true`; the
  samples carry it. With `BLOG_LAUNCHED`, the build lists every
  placeholder and every language without a published post, and refuses to
  build, so launch cannot ship a sample or a nav link to a 404 (the nav
  links the blog in all three languages). A translation the English
  version has outgrown is a warning, not an error: its page already shows
  readers a notice, and blocking would fail every deploy after an English
  edit until all translations caught up.
- **`npm run blog:new`:** starts a post as drafts in three languages with
  valid frontmatter, each marked `placeholder: true` until written, so an
  unwritten translation published by removing only `draft` still cannot
  launch; refuses an invalid, reserved or existing slug.
- **One gate for every reader:** the sitemap and `llms.txt` read the content
  before the blog is built (prebuild), so they call the same
  `assertLaunchable` as the build; a launched sitemap can never list a
  sample page. A failing `lighthouse-urls.js` stops the Lighthouse step
  instead of quietly measuring only the portfolio.
- **CI follows the content:**
  - Lighthouse measures the pages the build wrote (`scripts/lighthouse-urls.js`
    passes them as `--collect.url`, which replace the config's list).
  - The e2e specs take what to expect from the source content
    (`e2e/blog-content.ts`, via `loadPosts` and `loadNow`) and check `dist`
    against it, so a rendering bug fails a test instead of skipping it; a
    case the content lacks is skipped with its reason. Checked by running them
    on a reduced content set (English and Turkish, one post): 64 passed,
    14 skipped, none failed.
  - The rules behind each skipped case stay covered by fixture unit tests.

Launch day is now: replace the samples with real posts, render their
cards, flip `BLOG_LAUNCHED`, re-enable `is-crawlable`, update the
CHANGELOG, merge `feat/blog` into `main`.
