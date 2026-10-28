/**
 * A complete article page. Static HTML only: no inline styles, no inline
 * scripts apart from the JSON-LD block, so it runs under the site's CSP
 * unchanged. The rendered Markdown arrives already escaped and checked
 * (scripts/blog/markdown.js) and is the only raw() content.
 */

import { markup, raw } from '../html.js';
import { BLOG_NAME, STATUS_LABELS, TOPIC_LABELS } from '../config.js';
import { formatDate } from './format.js';
import { renderHead } from './head.js';
import { verificationMark } from './mark.js';
import { aiPanel, corrections, evidenceCard, tableOfContents } from './sections.js';

function siteHeader() {
  return markup`<header class="site-header">
<a class="brand" href="/" aria-label="Emre Dursun, portfolio home">${verificationMark({ size: 28 })}<span class="brand-name">emre<span class="brand-dot">.</span></span></a>
<span class="blog-name">${BLOG_NAME}</span>
<nav class="site-nav" aria-label="Site">
<a href="/">Portfolio</a>
<a href="/contact">Contact</a>
<button type="button" class="theme-toggle" data-theme-toggle aria-label="Dark theme" aria-pressed="false"><svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
</nav>
</header>`;
}

function articleHeader(post) {
  return markup`<header class="article-header">
<p class="article-kicker"><span class="status status-${post.status}">${STATUS_LABELS[post.status]}</span> ${TOPIC_LABELS[post.topic]} · ${post.minutes} min read</p>
<h1>${post.title}</h1>
<p class="article-dek">${post.description}</p>
<p class="byline">Emre Dursun · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>${post.updatedAt ? markup` · updated <time datetime="${post.updatedAt}">${formatDate(post.updatedAt)}</time>` : ''}</p>
</header>`;
}

function siteFooter() {
  return markup`<footer class="site-footer">
<p><span class="brand-name">emre<span class="brand-dot">.</span></span> Written by a person, checked twice.</p>
<p><a href="/">Portfolio</a> · <a href="/contact">Contact</a></p>
</footer>`;
}

/**
 * @param {{ post: object, assets: object, launched: boolean }} options
 * @returns {string}
 */
export function renderArticlePage({ post, assets, launched }) {
  const page = markup`<!doctype html>
<html lang="${post.lang}">
${renderHead({ post, assets, launched })}
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
${siteHeader()}
<main id="main">
<article class="article">
${articleHeader(post)}
${evidenceCard(post)}
${tableOfContents(post)}
<div class="prose">
${raw(post.html)}
</div>
${aiPanel(post)}
${corrections(post)}
</article>
</main>
${siteFooter()}
</body>
</html>
`;
  return String(page);
}
