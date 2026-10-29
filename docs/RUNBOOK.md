# Runbook

Operational reference for emredursun.nl (Firebase Hosting project `emredursun-portfolio`).

## What is live right now?

```bash
curl -s https://emredursun.nl/version.json
```

This returns the deployed commit, branch and build time, written by `scripts/write-version.js` on every build. Compare `commit` with `git log`.

## Releasing

1. Work on a branch and open a pull request. [`preview.yml`](../.github/workflows/preview.yml) runs every quality gate. To also get a Firebase preview channel (its URL is commented on the PR), add the `preview` label to the PR; without it nothing is deployed.
2. Merge to `main` once the `quality` check is green; branch protection allows nothing else (see below). [`deploy.yml`](../.github/workflows/deploy.yml) runs the same gates, then waits for your approval (Actions → the run → Review deployments → Approve).
3. After approval it deploys the exact build that passed the gates and smoke-tests production. The deploy job finishes only when `/version.json` on the live site reports the merged commit and every route returns 200.

**Guards (active).** `main` is protected: changes arrive only through a pull request whose `quality / Typecheck, test, build, e2e, Lighthouse` check passed; force pushes and deleting the branch are refused, for admins too. The `production` environment requires the owner's approval for every deploy and accepts deploys only from protected branches. Both are set in Settings → Branches and Settings → Environments → `production`.

Only one production deploy runs at a time (`concurrency: production`).

## Rolling back

**Preferred: revert in git.** Production stays reproducible from `main`.

```bash
git switch -c revert/<short-name> origin/main
git revert <bad-commit>
git push -u origin revert/<short-name>
```

Open a pull request, merge it when `quality` is green, and approve the deploy. `deploy.yml` redeploys the reverted state through the full quality gates, which takes about 15–20 minutes including the approval.

**Emergency: restore a previous release instantly.** In the Firebase console, open Hosting → Release history, find the last good release, and choose **Roll back**. It takes effect within seconds. Then revert in git as above, otherwise the next merge to `main` redeploys the bad change.

## Alerts

[`uptime.yml`](../.github/workflows/uptime.yml) checks production every 30 minutes. When a scheduled run fails, GitHub emails the repository owner.

| Failing step | Likely cause | First action |
| --- | --- | --- |
| Pages respond | Hosting outage, bad rewrite, or a broken deploy | Open the site. If it is down after a recent deploy, roll back in the console. Check https://status.firebase.google.com |
| Security headers present | `firebase.json` headers changed or were dropped | Diff `firebase.json` against the last good release |
| Build stamp and sitemap | `version.json` or `sitemap.xml` missing from the build | Check the last deploy run's build step |
| Social preview image | `social-share.png` re-exported above about 300 KB, so WhatsApp drops the preview | Re-encode it (see the asset section below) |

To re-run a check by hand, open Actions → Uptime → Run workflow.

## Errors in the field

There is no client-side error reporting: the site has no analytics service to send it to. A render error shows the error boundary's "Something went wrong" screen; anything else stays in the visitor's browser console. To investigate, reproduce it in the browser with the console open, or run the e2e suite, which fails on any console error. The Uptime workflow and the deploy smoke test cover outages.

## Content updates

| Change | Edit | Then |
| --- | --- | --- |
| Copy on a page | `public/locales/{en,nl,tr}/<page>.json` | `npm run build`, then commit the regenerated `public/sitemap.xml` and `scripts/sitemap-state.json` |
| Projects, services, certifications, tech stack | `constants.tsx` | `npm run build`, then commit; if `profile/README.md` changed, `npm run publish:profile-readme` |
| A new technology | Add it to `TECH_STACK` and a badge to `BADGES` in `scripts/generate-profile-readme.js` | The build fails until both exist, by design |

| A new top-level page | Its route in `components/MainContent.tsx` and a rewrite in `firebase.json` | Without the rewrite the page returns 404 in production only; `tests/hosting.test.ts` catches it if the route is in the sitemap |

CI fails if the regenerated sitemap or profile README differs from what is committed.

The CV PDFs (`/cv/Emre-Dursun-CV-<lang>.pdf`) are not committed: CI renders them from the build on every deploy, so a content change reaches the PDF automatically. To check one locally: `npm run build && npm run generate:cv`, then open `dist/cv/`.

## Blog (Field Notes)

Static pages built after the app by `scripts/build-blog.js`; the design and
the launch checklist are in [ADR 0001](adr/0001-static-blog-build.md).

- **Write a post:** `blog/content/<slug>/en.md`. The folder name is the URL
  (`/blog/<slug>`): lowercase words and dashes, fixed once published.
  Frontmatter is validated strictly (`scripts/blog/schema.js`): title,
  description (160 characters at most), publishedAt, optional updatedAt,
  topic, kind (essay or note), status, evidence, aiAssistance, corrections.
- **Translate a post:** add `tr.md` or `nl.md` next to `en.md` (served at
  `/tr/blog/<slug>` and `/nl/blog/<slug>`; the slug stays English). It must
  keep the English publishedAt, kind, topic, status and evidence
  recheckedAt, and needs
  `translation: { from: <date of the English version you translated>,
  assistedByAi: true|false }`; the AI panel says how it was translated.
  When the English post changes later (updatedAt or a correction), the
  translation shows "the English version has changed" until you update it
  and move `from` forward. A post without a translation still appears on
  that language's index, marked as English. UI text for all three languages
  is in `scripts/blog/strings.js`.
- **Link-preview images:** after adding or changing a post (title, status,
  topic) run `npm run blog:og` and commit `blog/og/`. It renders each
  missing or stale card in a local Chromium (`npx playwright install
  chromium` once) and removes cards no post needs. The build never renders
  cards: it fails with the list of cards to re-render until you do.
- **Now log:** add an entry at the top of `blog/now/en.md` (and `tr.md`,
  `nl.md`): `- date: YYYY-MM-DD` and `text:` (280 characters at most),
  newest first, frontmatter only. The newest entry shows on that
  language's index; all of them on `/blog/now`.
- **Drafts:** `draft: true` keeps a post out of the build, but the repository
  is public: keep unfinished text out of Git until it is ready.
- **Corrections:** add an entry to `corrections` with its date; the page,
  the feed and the structured data all pick up the new date.
- **Build and look:** `npm run build`, then `npx vite preview` and open
  `/blog`. `npm run build:blog` rebuilds only the blog after a full build.
- **Preview on Firebase:** label the PR `preview`; `preview.yml` also checks
  the blog paths on real Hosting.
- **Launch:** follow the checklist in the ADR. Until then every blog page is
  noindex and there is no feed.

## Quality report

`/quality` reads `dist/quality.json`, which the last step of `quality.yml` writes from that run's Vitest, Playwright, Lighthouse and audit reports. If the page says the report isn't available, the deployed build has no complete `quality.json`: check that step in the deploy run. Locally: run the unit tests with coverage, the e2e suite and Lighthouse, write `reports/audit.json` with `npm audit --omit=dev --json`, then `node scripts/write-quality.js`.

## Search Console

The domain is verified in Google Search Console through DNS (the `google-site-verification` TXT records), so nothing in the HTML is needed.

- After a release that adds pages: Indexing → Sitemaps → submit `https://emredursun.nl/sitemap.xml` (resubmitting is harmless).
- Performance → Search results, filtered on the query `emre dursun`, shows impressions, position and which URL Google shows.
- URL inspection → Test live URL renders a page as Googlebot; use it after changing structured data, then check Enhancements for the ProfilePage report.
- Link previews: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) re-fetches a URL. LinkedIn caches previews, so posts made before a fix keep the old card.

## Assets

- `public/` deploys as-is. Unused images live in `assets-archive/`, which is not deployed.
- Raster images referenced by the site should be WebP, at most 1600 px wide.
- `social-share.png` must stay PNG (some scrapers ignore WebP) and under 300 KB.
- If you replace a file under the same name, bump `CACHE_NAME` in `public/sw.js`. Unhashed images are cached for a week.

## Security headers

Headers are defined once, in `firebase.json`. `vite preview` and the e2e suite read them from there, so check any CSP change locally with:

```bash
npm run build && npm run test:e2e
```

Any violation fails the run. If a new third-party origin is genuinely needed, add it to the narrowest directive (`img-src`, `connect-src` and so on), never to `default-src`.
