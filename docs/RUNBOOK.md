# Runbook

Operational reference for emredursun.nl (Firebase Hosting project `emredursun-portfolio`).

## What is live right now?

```bash
curl -s https://emredursun.nl/version.json
```

This returns the deployed commit, branch and build time, written by `scripts/write-version.js` on every build. Compare `commit` with `git log`.

## Releasing

1. Work on a branch and open a pull request. [`preview.yml`](../.github/workflows/preview.yml) runs every quality gate, then posts a preview-channel URL on the PR. Review the change there.
2. Merge to `main`. [`deploy.yml`](../.github/workflows/deploy.yml) runs the same gates, deploys the exact build that passed them, and smoke-tests production.
3. The deploy job finishes only when `/version.json` on the live site reports the merged commit and every route returns 200.

**Approval gate (recommended).** The deploy job uses the `production` environment. In GitHub, go to Settings → Environments → `production` → Required reviewers and add yourself. Every release then pauses until you approve it in the Actions tab.

Only one production deploy runs at a time (`concurrency: production`).

## Rolling back

**Preferred: revert in git.** Production stays reproducible from `main`.

```bash
git revert <bad-commit>
git push origin main
```

`deploy.yml` redeploys the reverted state through the full quality gates, which takes about 8–10 minutes.

**Emergency: restore a previous release instantly.** In the Firebase console, open Hosting → Release history, find the last good release, and choose **Roll back**. It takes effect within seconds. Then revert in git as above, otherwise the next push to `main` redeploys the bad change.

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

Client-side errors appear in Plausible as the custom event **JS Error**, with `message` and `source` properties (`render`, `window` or `promise`). Add it as a goal under Site settings → Goals → Custom event once, then break it down by property. Messages have their query strings stripped and are capped at five per page view.

## Content updates

| Change | Edit | Then |
| --- | --- | --- |
| Copy on a page | `public/locales/{en,nl,tr}/<page>.json` | `npm run build`, then commit the regenerated `public/sitemap.xml` and `scripts/sitemap-state.json` |
| Projects, services, certifications, tech stack | `constants.tsx` | `npm run build`, then commit; if `profile/README.md` changed, `npm run publish:profile-readme` |
| A new technology | Add it to `TECH_STACK` and a badge to `BADGES` in `scripts/generate-profile-readme.js` | The build fails until both exist, by design |

CI fails if the regenerated sitemap or profile README differs from what is committed.

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
