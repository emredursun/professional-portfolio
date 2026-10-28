# ADR 0001: Build the Field Notes blog as static HTML with our own script

- Status: Accepted (Phase 1 spike in progress)
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
- Serve the feed as `application/atom+xml; charset=utf-8` (a `firebase.json`
  header); Firebase's default for `.xml` is `application/xml`.
- Re-enable the Lighthouse `is-crawlable` audit for blog pages.
- Add blog routes to the sitemap and the deploy smoke test.
- Add the blog link to the portfolio navigation.
- Check once on a preview channel or the Firebase emulator that `/blog`
  resolves to `blog.html` next to the `blog/` folder under `cleanUrls`.

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

- Small CLS (0.031) from the font swap: a metric-matched fallback face
  would bring it to zero.
- The service worker's offline fallback for an uncached blog page is the
  SPA shell; a plain offline page for /blog would be clearer.
- The browser theme-color follows the system setting, not a pinned theme.
