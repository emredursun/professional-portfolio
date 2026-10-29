/**
 * The trust sections of an article: the evidence card, the AI note, the
 * corrections log and the table of contents. Each is a small pure function of
 * the validated post.
 */

import { markup } from '../html.js';
import { statusChip } from './status.js';
import { formatDate } from './format.js';
import { strings } from '../strings.js';

/** The date a post is due for a re-check: a year after the last one (29 Feb → 28 Feb). */
export function nextRecheck(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${Number(year) + 1}-${month}-${month === '02' && day === '29' ? '28' : day}`;
}

export function evidenceCard(post) {
  const { evidence } = post;
  const s = strings(post.lang);
  return markup`<aside class="evidence" aria-labelledby="evidence-title" data-recheck-by="${nextRecheck(evidence.recheckedAt)}">
<h2 id="evidence-title" class="visually-hidden">${s.evidenceTitle}</h2>
<dl class="evidence-grid">
<div><dt>${s.status}</dt><dd>${statusChip(post.status, post.lang)}</dd></div>
<div><dt>${s.confidence}</dt><dd>${evidence.confidence}</dd></div>
<div><dt>${s.basedOn}</dt><dd>${evidence.basedOn.join('; ')}</dd></div>
<div><dt>${s.rechecked}</dt><dd><time datetime="${evidence.recheckedAt}">${formatDate(evidence.recheckedAt)}</time>, ${s.nextBy} <time datetime="${nextRecheck(evidence.recheckedAt)}">${formatDate(nextRecheck(evidence.recheckedAt))}</time></dd></div>
</dl>
<p class="stale-note" hidden>${s.staleEvidence}</p>
</aside>`;
}

export function aiPanel(post) {
  const { mine, assisted, promptsUrl } = post.aiAssistance;
  const s = strings(post.lang);
  const list = (items) => markup`<ul>${items.map((item) => markup`<li>${item}</li>`)}</ul>`;
  return markup`<aside class="ai-note" aria-labelledby="ai-title">
<h2 id="ai-title">${s.aiTitle}</h2>
<div class="ai-grid">
<section class="ai-mine" aria-labelledby="ai-mine"><h3 id="ai-mine">${s.aiMine}</h3>${list(mine)}</section>
<section class="ai-assisted" aria-labelledby="ai-assisted"><h3 id="ai-assisted">${s.aiAssisted}</h3>${assisted.length > 0 ? list(assisted) : markup`<p>${s.aiNothing}</p>`}</section>
</div>
<p class="ai-footer">${s.aiChecked}${promptsUrl ? markup` <a href="${promptsUrl}" rel="noopener noreferrer">${s.aiPrompts}</a>` : ''}</p>
</aside>`;
}

export function corrections(post) {
  const s = strings(post.lang);
  const entries = post.corrections.map(
    (entry) =>
      markup`<li><time datetime="${entry.date}">${formatDate(entry.date)}</time>: ${entry.text}</li>`,
  );
  return markup`<section class="corrections" aria-labelledby="corrections-title">
<h2 id="corrections-title">${s.correctionsTitle}</h2>
<p>${s.correctionsIntro}</p>
<p><a class="button" href="/contact">${s.reportBug}</a></p>
<h3>${s.correctionsLog}</h3>
${entries.length > 0 ? markup`<ol class="corrections-log">${entries}</ol>` : markup`<p>${s.correctionsNone}</p>`}
</section>`;
}

export function tableOfContents(post) {
  if (post.toc.length === 0) return '';
  const s = strings(post.lang);
  return markup`<nav class="toc" aria-label="${s.toc}">
<p class="toc-title">${s.toc}</p>
<ol>${post.toc.map((entry) => markup`<li class="toc-level-${entry.level}"><a href="#${entry.id}">${entry.text}</a></li>`)}</ol>
</nav>`;
}
