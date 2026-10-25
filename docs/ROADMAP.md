# Roadmap

Open work for emredursun.nl, highest value first. Completed work moves to [CHANGELOG.md](../CHANGELOG.md).

## Milestone 1 — Production readiness (done, awaiting release)

Branch `feat/preflight-remediation`. It raises the preflight score from 36/100 by fixing:
- security headers and CSP
- privacy: consent issues and analytics
- performance and asset weight
- seven functional, SEO and accessibility defects found by the new tests
- missing tests and CI gates
- operations: version stamp, smoke test, uptime checks, runbook
- SEO: per-route prerendered heads, linked JSON-LD, image SEO, real 404s
- new: PDF CV, quality report page, `resume.json` and `llms.txt`, case studies

Release extras: run `npm run publish:profile-readme` after the merge (the profile README changed), then resubmit the sitemap in Search Console and re-scrape a project link in LinkedIn's Post Inspector.

**Release checklist**
- [ ] Owner reviews and approves the branch
- [x] Settings → Environments → `production` → add a required reviewer (approval gate for every deploy)
- [x] Web3Forms dashboard: spam filter on, submissions kept 30 days (restricting the key to a domain is a paid feature, not used)
- [x] Analytics: Plausible removed (it had no account); search traffic is in Google Search Console
- [ ] Merge; confirm `/version.json` and that the Uptime workflow is green

## Milestone 2 — Engineering hygiene

| Item | Why | Blocked on |
| --- | --- | --- |
| Split `constants.tsx` (1,245 lines) into `data/*.ts` | File-size guideline (800); easier content edits | Profile README generator must bundle instead of evaluating one file — small change |
| Tailwind CSS 3 → 4 | Clears the remaining build-time advisories (braces, micromatch, postcss-selector-parser). These do not ship to visitors | Visual regression pass |

## Milestone 3 — Mobile performance

Mobile Lighthouse is now about 84 (75–84 on /projects; was 57–58) and has its own CI budget (`lighthouserc.mobile.json`). The particle field was the blocking cost; it is now a 2D canvas, skipped on touch devices. What remains is LCP (about 3.5 s on simulated slow 4G):

| Item | Expected effect |
| --- | --- |
| Prerender route bodies (Vite SSG) | Every route already ships its own prerendered head (link previews, metadata). Rendering the body too would let LCP stop waiting on the JS bundle |

## Milestone 4 — Content and assets

| Item | Note |
| --- | --- |
| Self-host the project images now hot-linked from `servcorp.co.uk` and `images.unsplash.com` | Third-party image host and licensing risk. The Lighthouse budget for `/projects` is capped at the current 7 third-party requests until this is done |
| Regenerate favicons from the new profile photo | Favicons still show the previous photo |
| Per-page social images for projects and services | Built at build time next to the prerendered heads, so each shared link has its own card |
| Measurable results for the remaining projects | Owner to supply figures, as done for ING |
| Calm design pass (less decoration) | Owner wants visual examples first |
| View Transitions for project card → modal | Polish, after the above |
