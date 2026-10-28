/**
 * The page shell every blog page shares: skip link, site header, main, footer.
 * Static HTML only: no inline styles and no inline scripts beyond the JSON-LD
 * block in <head>, so pages run under the site's CSP unchanged.
 */

import { markup } from '../html.js';
import { BLOG_NAME } from '../config.js';
import { BLOG_PATH, FEED_PATH } from './format.js';
import { renderHead } from './head.js';
import { verificationMark } from './mark.js';

function siteHeader() {
  return markup`<header class="site-header">
<a class="brand" href="/" aria-label="Emre Dursun, portfolio home">${verificationMark({ size: 28 })}<span class="brand-name">emre<span class="brand-dot">.</span></span></a>
<a class="blog-name" href="${BLOG_PATH}">${BLOG_NAME}</a>
<nav class="site-nav" aria-label="Site">
<a href="/">Portfolio</a>
<a href="/contact">Contact</a>
<button type="button" class="theme-toggle" data-theme-toggle aria-label="Dark theme" aria-pressed="false"><svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</nav>
</header>`;
}

function siteFooter() {
  return markup`<footer class="site-footer">
<p><span class="brand-name">emre<span class="brand-dot">.</span></span> Written by a person, checked twice.</p>
<p><a href="${BLOG_PATH}">All notes</a> · <a href="${FEED_PATH}">Feed</a> · <a href="/">Portfolio</a> · <a href="/contact">Contact</a></p>
</footer>`;
}

/**
 * @param {{ lang: string, meta: object, assets: object, launched: boolean, content: unknown, progress?: boolean }} options
 * @returns {string}
 */
export function renderPage({ lang, meta, assets, launched, content, progress = false }) {
  const page = markup`<!doctype html>
<html lang="${lang}">
${renderHead({ meta, assets, launched })}
<body>
<a class="skip-link" href="#main">Skip to content</a>
${progress ? markup`<div class="progress" aria-hidden="true"></div>\n` : ''}${siteHeader()}
<main id="main">
${content}
</main>
${siteFooter()}
</body>
</html>
`;
  return String(page);
}
