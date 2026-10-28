/**
 * The trust sections of an article: the evidence card, the AI note, the
 * corrections log and the table of contents. Each is a small pure function of
 * the validated post.
 */

import { markup } from '../html.js';
import { STATUS_LABELS } from '../config.js';
import { formatDate } from './format.js';

/** The date a post is due for a re-check: a year after the last one (29 Feb → 28 Feb). */
export function nextRecheck(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${Number(year) + 1}-${month}-${month === '02' && day === '29' ? '28' : day}`;
}

export function evidenceCard(post) {
  const { evidence } = post;
  return markup`<aside class="evidence" aria-labelledby="evidence-title">
<h2 id="evidence-title" class="visually-hidden">Evidence for this note</h2>
<dl class="evidence-grid">
<div><dt>Status</dt><dd class="status status-${post.status}">${STATUS_LABELS[post.status]}</dd></div>
<div><dt>Confidence</dt><dd>${evidence.confidence}</dd></div>
<div><dt>Based on</dt><dd>${evidence.basedOn.join('; ')}</dd></div>
<div><dt>Re-checked</dt><dd><time datetime="${evidence.recheckedAt}">${formatDate(evidence.recheckedAt)}</time>, next by <time datetime="${nextRecheck(evidence.recheckedAt)}">${formatDate(nextRecheck(evidence.recheckedAt))}</time></dd></div>
</dl>
</aside>`;
}

export function aiPanel(post) {
  const { mine, assisted, promptsUrl } = post.aiAssistance;
  const list = (items) => markup`<ul>${items.map((item) => markup`<li>${item}</li>`)}</ul>`;
  return markup`<aside class="ai-note" aria-labelledby="ai-title">
<h2 id="ai-title">How this was written</h2>
<div class="ai-grid">
<section class="ai-mine" aria-labelledby="ai-mine"><h3 id="ai-mine">Mine</h3>${list(mine)}</section>
<section class="ai-assisted" aria-labelledby="ai-assisted"><h3 id="ai-assisted">With AI’s help</h3>${assisted.length > 0 ? list(assisted) : markup`<p>Nothing.</p>`}</section>
</div>
<p class="ai-footer">I checked every claim myself before publishing.${promptsUrl ? markup` <a href="${promptsUrl}" rel="noopener noreferrer">See the prompts I used</a>` : ''}</p>
</aside>`;
}

export function corrections(post) {
  const entries = post.corrections.map(
    (entry) =>
      markup`<li><time datetime="${entry.date}">${formatDate(entry.date)}</time>: ${entry.text}</li>`,
  );
  return markup`<section class="corrections" aria-labelledby="corrections-title">
<h2 id="corrections-title">Found a mistake?</h2>
<p>Report it the way you would in a sprint. Fixes are logged here.</p>
<p><a class="button" href="/contact">Report a bug</a></p>
<h3>Corrections</h3>
${entries.length > 0 ? markup`<ol class="corrections-log">${entries}</ol>` : markup`<p>None yet.</p>`}
</section>`;
}

export function tableOfContents(post) {
  if (post.toc.length === 0) return '';
  return markup`<nav class="toc" aria-label="On this page">
<p class="toc-title">On this page</p>
<ol>${post.toc.map((entry) => markup`<li class="toc-level-${entry.level}"><a href="#${entry.id}">${entry.text}</a></li>`)}</ol>
</nav>`;
}
