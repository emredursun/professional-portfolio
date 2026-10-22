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

**Release checklist**
- [ ] Owner reviews and approves the branch
- [ ] Settings → Environments → `production` → add a required reviewer (approval gate for every deploy)
- [ ] Web3Forms dashboard → restrict the access key to `emredursun.nl`
- [ ] Plausible → add the `JS Error` custom-event goal
- [ ] Merge; confirm `/version.json` and that the Uptime workflow is green

## Milestone 2 — Engineering hygiene

| Item | Why | Blocked on |
| --- | --- | --- |
| ESLint (typescript-eslint, react-hooks, jsx-a11y) and Prettier in CI | Lint and style gates; preflight D4 | The local `config-protection` hook blocks creating lint configs; owner to allow it once |
| Split `constants.tsx` (1,245 lines) into `data/*.ts` | File-size guideline (800); easier content edits | Profile README generator must bundle instead of evaluating one file — small change |
| Command palette: `role="dialog"`, `aria-modal`, focus trap | Screen-reader semantics; axe does not flag it because it is closed during the scan | — |
| Tailwind CSS 3 → 4 | Clears the remaining build-time advisories (braces, micromatch, postcss-selector-parser). These do not ship to visitors | Visual regression pass |

## Milestone 3 — Mobile performance

Mobile Lighthouse is now 86–87 (was 57–58). The particle field was the blocking cost; it is now allocation-free and skipped on touch devices. What remains is LCP (3.4 s on simulated slow 4G):

| Item | Expected effect |
| --- | --- |
| Use one animation library: GSAP **or** framer-motion (together about 90 KB gzip) | Less JavaScript before first render |
| Prerender routes (Vite SSG or Astro) | Real HTML per route for scrapers that run no JS, such as LinkedIn and WhatsApp. LCP no longer waits on the JS bundle |

## Milestone 4 — Content and assets

| Item | Note |
| --- | --- |
| Self-host the project images now hot-linked from `servcorp.co.uk` and `images.unsplash.com` | Third-party image host and licensing risk. The Lighthouse budget for `/projects` is capped at the current 7 third-party requests until this is done |
| Regenerate favicons from the new profile photo | Favicons still show the previous photo |
| Regenerate `social-share.png` with the new photo | Via `dev-tools/social-share-generator.html`; keep it under 300 KB |
