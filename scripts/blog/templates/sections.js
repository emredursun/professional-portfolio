/**
 * The trust sections of an article: the evidence card, the
 * corrections log and the table of contents. Each is a small pure function of
 * the validated post.
 */

import { markup } from '../html.js';
import { formatDate, portfolioPath } from './format.js';
import { strings } from '../strings.js';

/** The date a post is due for a re-check: a year after the last one (29 Feb → 28 Feb). */
export function nextRecheck(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${Number(year) + 1}-${month}-${month === '02' && day === '29' ? '28' : day}`;
}

/** The sources after the text: a quiet footnote. Status is already in the header. */
export function evidenceCard(post) {
  const s = strings(post.lang);
  return markup`<aside class="evidence" aria-labelledby="evidence-title">
<h2 id="evidence-title">${s.evidenceTitle}</h2>
<ul class="evidence-sources">${post.evidence.basedOn.map((source) => markup`<li>${source}</li>`)}</ul>
</aside>`;
}

/**
 * One quiet line to report a mistake, and a dated log only when the post has
 * corrections (never an empty "None yet").
 */
export function corrections(post) {
  const s = strings(post.lang);
  const entries = post.corrections.map(
    (entry) =>
      markup`<li><time datetime="${entry.date}">${formatDate(entry.date, post.lang)}</time>: ${entry.text}</li>`,
  );
  const log =
    entries.length > 0
      ? markup`<h2 id="corrections-title">${s.correctionsLog}</h2>
<ol class="corrections-log">${entries}</ol>
`
      : '';
  return markup`<section class="corrections"${entries.length > 0 ? markup` aria-labelledby="corrections-title"` : markup` aria-label="${s.reportMistake}"`}>
${log}<p class="report-line">${s.reportMistake} <a href="${portfolioPath(post.lang, '/contact')}">${s.reportLink}</a></p>
</section>`;
}

export function tableOfContents(post) {
  if (post.toc.length === 0) return '';
  const s = strings(post.lang);
  // Open in the HTML and in the flow, so the list is there without JavaScript;
  // toc.ts marks the nav data-folding and folds it on narrow screens, where the
  // bar then sticks to the top and .toc-panel drops down over the text. .toc-current is filled in by toc.ts with the section
  // being read, and only shows while the list is folded.
  return markup`<nav class="toc" aria-label="${s.toc}">
<details class="toc-disclosure" open>
<summary class="toc-summary"><span class="toc-heading"><span class="toc-title">${s.toc}</span> <span class="toc-count" aria-hidden="true">· ${post.toc.length}</span></span><span class="toc-current" aria-hidden="true"></span></summary>
<div class="toc-panel"><ol>${post.toc.map((entry) => markup`<li class="toc-level-${entry.level}"><a href="#${entry.id}">${entry.text}</a></li>`)}</ol></div>
</details>
</nav>`;
}
