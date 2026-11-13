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

/**
 * A card's topic link. An English post on a Turkish or Dutch page links to
 * that language's topic page when it exists, labelled in that language, so
 * the reader stays in it; on the topic page itself the link is the current
 * page.
 */
function topicLink(post, { lang, topics, currentTopic }) {
  const local = post.lang !== lang && topics.has(post.topic);
  const linkLang = local ? lang : post.lang;
  return markup`<a class="topic-link" href="${topicPath(linkLang, post.topic)}"${local ? markup` lang="${lang}"` : ''}${post.topic === currentTopic ? markup` aria-current="page"` : ''}>${strings(linkLang).topicLabels[post.topic]}</a>`;
}

function postMeta(post, page, chip = '') {
  const s = strings(post.lang);
  return markup`<p class="card-meta">${topicLink(post, page)} · ${post.minutes} ${s.minutesShort} · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt, post.lang)}</time>${chip}</p>`;
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

// The rendered width of a cover: the full card on a phone, a grid column
// (at most about 380 px) from there up. A note card is one column below
// 720 px (the grid's breakpoint in index.css), one of two from there: half
// the width less a gutter (up to 40 px) and half the 24 px gap, until the
// 1120 px content width caps it at about 510 px.
const CARD_SIZES = '(max-width: 720px) calc(100vw - 36px), 380px';
const NOTE_SIZES =
  '(max-width: 719px) calc(100vw - 36px), (max-width: 1179px) calc(50vw - 52px), 510px';

/**
 * A post's cover (build-blog.js), lazy because the cards sit below the
 * introduction, and sized so nothing shifts as it loads.
 */
function coverImg(cover, { className, sizes, alt }) {
  return markup`<img class="${className}" src="${cover.src}" srcset="${cover.srcset}" sizes="${sizes}" width="${cover.width}" height="${cover.height}" alt="${alt}" loading="lazy" decoding="async">`;
}

function essayCard(post, page) {
  const { lang, hreflang, chip } = foreign(post, page.lang);
  const cover = post.coverImage;
  const status = markup`<p class="card-status">${statusChip(post.status, post.lang)}${chip}</p>`;
  const text = markup`<h3 class="card-title"><a href="${postPath(post)}"${hreflang}>${post.title}</a></h3>
<p class="card-dek">${post.description}</p>
${postMeta(post, page)}
${staleNote(post)}`;
  if (!cover) {
    return markup`<li class="card"${lang} data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
${status}
${text}
</li>`;
  }
  // The photo fills the card; the text sits on its own dark scrim, so it
  // reads the same whatever the photo and in either theme.
  return markup`<li class="card has-cover"${lang} data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
${coverImg(cover, { className: 'card-cover', sizes: CARD_SIZES, alt: cover.alt })}
${status}
<div class="card-body">
${text}
</div>
</li>`;
}

/**
 * A short note as a card: its cover across the top (text never on the
 * photo, so it stays lighter than an essay card), then the status, the
 * title and the meta line. Without a cover it is the same card, text only.
 */
function noteCard(post, page) {
  const { lang, hreflang, chip } = foreign(post, page.lang);
  const cover = post.coverImage;
  const image = cover
    ? markup`${coverImg(cover, { className: 'note-cover', sizes: NOTE_SIZES, alt: cover.alt })}
`
    : '';
  return markup`<li class="note-card${cover ? ' has-cover' : ''}"${lang} data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
${image}<div class="note-body">
<p class="card-status">${statusChip(post.status, post.lang)}${chip}</p>
<h3 class="note-title"><a href="${postPath(post)}"${hreflang}>${post.title}</a></h3>
${postMeta(post, page)}
${staleNote(post)}
</div>
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
 * @param {{ posts: object[], fallback?: object[], lang: string, topics?: Set<string>, currentTopic?: string }} options
 *   `fallback`: English posts with no `lang` version yet, listed as English.
 *   `topics`: the topics with a page in `lang`. `currentTopic`: the topic
 *   page these sections are on, if any.
 */
export function postSections({ posts, fallback = [], lang, topics = new Set(), currentTopic }) {
  const page = { lang, topics, currentTopic };
  const s = strings(lang);
  const listed = [...posts, ...fallback].sort(byNewest);
  const essays = listed.filter((post) => post.kind === 'essay');
  const notes = listed.filter((post) => post.kind === 'note');
  return markup`${section({ id: 'essays-title', title: s.essays, intro: s.essaysIntro, items: essays.map((post) => essayCard(post, page)), listClass: 'cards' })}
${section({ id: 'notes-title', title: s.notes, intro: s.notesIntro, items: notes.map((post) => noteCard(post, page)), listClass: 'note-cards' })}`;
}
