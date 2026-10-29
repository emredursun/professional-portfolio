/**
 * The page shell every blog page shares: skip link, site header, main, footer.
 * Static HTML only: no inline styles and no inline scripts beyond the JSON-LD
 * block in <head>, so pages run under the site's CSP unchanged.
 */

import { markup } from '../html.js';
import { blogPath, feedPath, portfolioPath } from './format.js';
import { renderHead } from './head.js';
import { verificationMark } from './mark.js';
import { strings } from '../strings.js';

/**
 * Links to this page in the other languages it exists in. Plain links, not
 * the portfolio's React switcher: these pages run without the app. Each name
 * is in its own language, so a screen reader pronounces it right.
 */
function languageNav(s, lang, alternates) {
  if (alternates.length < 2) return '';
  return markup`<nav class="lang-nav" aria-label="${s.languageNav}">${alternates.map(
    ({ lang: other, url }) =>
      markup`<a href="${new URL(url).pathname}" lang="${other}" hreflang="${other}"${other === lang ? markup` aria-current="page"` : ''}><span>${other.toUpperCase()}</span><span class="visually-hidden"> ${s.languageNames[other]}</span></a>`,
  )}</nav>\n`;
}

function siteHeader(s, lang, alternates) {
  return markup`<header class="site-header">
<a class="brand" href="${portfolioPath(lang, '/')}" aria-label="${s.brandHome}">${verificationMark({ size: 28 })}<span class="brand-name">emre<span class="brand-dot">.</span></span></a>
<a class="blog-name" href="${blogPath(lang)}">${s.blogName}</a>
<nav class="site-nav" aria-label="${s.siteNav}">
<a href="${portfolioPath(lang, '/')}">${s.navPortfolio}</a>
<a href="${portfolioPath(lang, '/contact')}">${s.navContact}</a>
</nav>
${languageNav(s, lang, alternates)}<button type="button" class="theme-toggle" data-theme-toggle aria-label="${s.darkTheme}" aria-pressed="false"><svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</header>`;
}

/** The canvas's closing band: one invitation to talk, at the end of every page. */
function closing(s, lang) {
  return markup`<section class="closing" aria-labelledby="closing-title">
<p class="closing-kicker">${s.closingKicker}</p>
<h2 id="closing-title" class="closing-title">${s.closingTitle}</h2>
<a class="closing-link" href="${portfolioPath(lang, '/contact')}">${s.closingLink} <span aria-hidden="true">↗</span></a>
</section>`;
}

function siteFooter(s, lang, launched) {
  return markup`<footer class="site-footer">
<p><span class="brand-name">emre<span class="brand-dot">.</span></span> ${s.footerLine}</p>
<p><a href="${blogPath(lang)}">${s.allPosts}</a> · ${launched ? markup`<a href="${feedPath(lang)}">${s.feed}</a> · ` : ''}<a href="${portfolioPath(lang, '/')}">${s.navPortfolio}</a> · <a href="${portfolioPath(lang, '/contact')}">${s.navContact}</a></p>
</footer>`;
}

/**
 * @param {{ lang: string, meta: object, assets: object, launched: boolean, content: unknown, progress?: boolean }} options
 * @returns {string}
 */
export function renderPage({ lang, meta, assets, launched, content, progress = false }) {
  const s = strings(lang);
  const page = markup`<!doctype html>
<html lang="${lang}">
${renderHead({ meta, assets, launched, lang })}
<body>
<a class="skip-link" href="#main">${s.skipLink}</a>
${progress ? markup`<div class="progress" aria-hidden="true"></div>\n` : ''}${siteHeader(s, lang, meta.alternates ?? [])}
<main id="main">
${content}
${closing(s, lang)}
</main>
${siteFooter(s, lang, launched)}
</body>
</html>
`;
  return String(page);
}
