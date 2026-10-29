/**
 * The lists of posts the index and the topic pages share: essays as cards,
 * short notes as a list, newest first. Each item links its topic to that
 * topic's page, so every topic page is reachable by a plain link.
 */

import { markup } from '../html.js';
import { strings } from '../strings.js';
import { byNewest, formatDate, postPath, topicPath } from './format.js';
import { nextRecheck } from './sections.js';
import { statusChip } from './status.js';

function postMeta(post, chip = '') {
  const s = strings(post.lang);
  return markup`<p class="card-meta"><a class="topic-link" href="${topicPath(post.lang, post.topic)}">${s.topicLabels[post.topic]}</a> · ${post.minutes} ${s.minutesShort} · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt, post.lang)}</time>${chip}</p>`;
}

// Revealed in the browser by blog/client/stale.ts once the re-check date has
// passed, as on the article's evidence card.
const staleNote = (post) =>
  markup`<p class="stale-note" hidden>${strings(post.lang).staleShort}</p>`;

/**
 * A post shown on another language's page (no translation yet) keeps its
 * own language: the item says so with lang, the link with hreflang, and a
 * chip in the page's language tells the reader before they click.
 */
function foreign(post, pageLang) {
  if (post.lang === pageLang) return { lang: '', hreflang: '', chip: '' };
  return {
    lang: markup` lang="${post.lang}"`,
    hreflang: markup` hreflang="${post.lang}"`,
    chip: markup` <span class="lang-chip" lang="${pageLang}">${strings(pageLang).inEnglish}</span>`,
  };
}

function essayCard(post, pageLang) {
  const { lang, hreflang, chip } = foreign(post, pageLang);
  return markup`<li class="card"${lang} data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
<p class="card-status">${statusChip(post.status, post.lang)}${chip}</p>
<h3 class="card-title"><a href="${postPath(post)}"${hreflang}>${post.title}</a></h3>
<p class="card-dek">${post.description}</p>
${postMeta(post)}
${staleNote(post)}
</li>`;
}

function noteItem(post, pageLang) {
  const { lang, hreflang, chip } = foreign(post, pageLang);
  return markup`<li class="note-item"${lang} data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
${statusChip(post.status, post.lang)}
<a href="${postPath(post)}"${hreflang}>${post.title}</a>
${postMeta(post, chip)}
${staleNote(post)}
</li>`;
}

function section({ id, title, intro, items, listClass }) {
  if (items.length === 0) return '';
  return markup`<section class="index-section" aria-labelledby="${id}">
<h2 id="${id}">${title}</h2>
<p class="section-intro">${intro}</p>
<ul class="${listClass}">${items}</ul>
</section>`;
}

/**
 * The essays and notes sections for a page in `lang`.
 * @param {{ posts: object[], fallback?: object[], lang: string }} options
 *   `fallback`: English posts with no `lang` version yet, listed as English.
 */
export function postSections({ posts, fallback = [], lang }) {
  const s = strings(lang);
  const listed = [...posts, ...fallback].sort(byNewest);
  const essays = listed.filter((post) => post.kind === 'essay');
  const notes = listed.filter((post) => post.kind === 'note');
  return markup`${section({ id: 'essays-title', title: s.essays, intro: s.essaysIntro, items: essays.map((post) => essayCard(post, lang)), listClass: 'cards' })}
${section({ id: 'notes-title', title: s.notes, intro: s.notesIntro, items: notes.map((post) => noteItem(post, lang)), listClass: 'notes' })}`;
}
