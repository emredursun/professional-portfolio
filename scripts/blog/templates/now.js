/**
 * The "Now" page (/blog/now, and under /tr and /nl): what Emre is working on,
 * newest first, as a dated list. Its date is the newest entry's, never the
 * build's, so the page stays deterministic.
 */

import { markup } from '../html.js';
import { PERSON_ID, SITE_URL } from '../../lib/route-meta.js';
import { strings } from '../strings.js';
import { blogPath, blogUrl, formatDate, nowPath } from './format.js';
import { previewImage } from './head.js';
import { renderPage } from './layout.js';

/**
 * The newest entry as a small status chip for the index: a dot (it pulses
 * unless the reader asked for less motion), the label, the text, its date
 * and a link to the page.
 */
export function nowChip(entries, lang) {
  if (!entries) return '';
  const s = strings(lang);
  const [latest] = entries;
  return markup`<p class="now-chip"><span class="now-dot" aria-hidden="true"></span><span class="now-label">${s.nowTitle}</span> <span class="now-text">${latest.text}</span> <time datetime="${latest.date}">${formatDate(latest.date, lang)}</time> <a href="${nowPath(lang)}">${s.nowMore}</a></p>
`;
}

/**
 * @param {{ entries: readonly { date: string, text: string }[], assets: object, launched: boolean, lang: string, languages: string[] }} options
 *   `languages`: every language with a Now log, for the alternate links.
 * @returns {string}
 */
export function renderNowPage({ entries, assets, launched, lang, languages }) {
  const s = strings(lang);
  const url = `${SITE_URL}${nowPath(lang)}`;
  const content = markup`<div class="index">
<header class="index-header">
<p class="index-eyebrow"><a href="${blogPath(lang)}">${s.blogName}</a></p>
<h1 class="index-lede">${s.nowTitle}</h1>
<p class="index-intro">${s.nowIntro}</p>
</header>
<ol class="now-list">${entries.map(
    (entry) =>
      markup`<li><time datetime="${entry.date}">${formatDate(entry.date, lang)}</time><p>${entry.text}</p></li>`,
  )}</ol>
</div>`;
  return renderPage({
    lang,
    meta: {
      title: `${s.nowTitle} · ${s.blogName}`,
      heading: s.nowTitle,
      description: s.nowIntro,
      url,
      alternates: languages.map((other) => ({ lang: other, url: `${SITE_URL}${nowPath(other)}` })),
      image: previewImage(assets, `_site.${lang}`, `${s.blogName}: ${s.tagline}`),
      ogType: 'website',
      lcpFont: 'reading',
      headingFont: 'display',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${url}#page`,
        name: s.nowTitle,
        description: s.nowIntro,
        url,
        inLanguage: lang,
        dateModified: entries[0].date,
        isPartOf: { '@id': `${blogUrl(lang)}#blog` },
        author: { '@id': PERSON_ID },
      },
    },
    assets,
    launched,
    content,
  });
}
