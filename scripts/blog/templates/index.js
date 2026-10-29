/**
 * The blog's front page at /blog: a short introduction, the essays as cards
 * and the short notes as a list, newest first. Plain links throughout, so it
 * works without JavaScript and every post is one click from the index.
 */

import { markup } from '../html.js';
import { PERSON_ID, WEBSITE_ID } from '../../lib/route-meta.js';
import { blogUrl, byNewest, feedPath, formatDate, postPath, postUrl } from './format.js';
import { renderPage } from './layout.js';
import { nextRecheck } from './sections.js';
import { statusChip } from './status.js';
import { strings } from '../strings.js';

/**
 * The canvas's band of themes (not the topic taxonomy, which is testing, ai
 * and life): static, so there is nothing to pause (WCAG 2.2.2). */
function topicsBand(s) {
  return markup`<ul class="band" aria-label="${s.bandLabel}">${Object.values(s.band).map(
    (topic, index) =>
      markup`<li>${index > 0 ? markup`<span class="band-mark" aria-hidden="true">✳</span>` : ''}${topic}</li>`,
  )}</ul>`;
}

function heroActions(newest, launched, s, lang) {
  if (!newest) throw new Error('blog: the index needs at least one post');
  return markup`<p class="index-actions"><a class="button button-solid" href="${postPath(newest)}">${s.readLatest}<span class="visually-hidden">: ${newest.title}</span></a>${
    launched ? markup`<a class="button" href="${feedPath(lang)}">${s.followFeed}</a>` : ''
  }</p>`;
}

function indexMeta(posts, s, lang, languages) {
  const url = blogUrl(lang);
  return {
    title: `${s.blogName} · Emre Dursun`,
    heading: s.blogName,
    description: s.description,
    url,
    alternates: languages.map((other) => ({ lang: other, url: blogUrl(other) })),
    ogType: 'website',
    lcpFont: 'reading',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${url}#blog`,
      name: s.blogName,
      description: s.description,
      url,
      inLanguage: lang,
      author: { '@id': PERSON_ID },
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': PERSON_ID },
      // Minimal nodes inline: search engines do not follow @id across pages.
      blogPost: posts.map((post) => ({
        '@type': 'BlogPosting',
        '@id': `${postUrl(post)}#article`,
        headline: post.title,
        url: postUrl(post),
        datePublished: post.publishedAt,
      })),
    },
  };
}

function postMeta(post, chip = '') {
  const s = strings(post.lang);
  return markup`<p class="card-meta">${s.topicLabels[post.topic]} · ${post.minutes} ${s.minutesShort} · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt, post.lang)}</time>${chip}</p>`;
}

// Revealed in the browser by blog/client/stale.ts once the re-check date has
// passed, as on the article's evidence card.
const staleNote = (post) =>
  markup`<p class="stale-note" hidden>${strings(post.lang).staleShort}</p>`;

/**
 * A post shown on another language's index (no translation yet) keeps its
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
 * @param {{ posts: object[], fallback?: object[], assets: object, launched: boolean, lang?: string, languages?: string[] }} options
 *   `posts`: the posts in `lang`. `fallback`: English posts with no `lang`
 *   version yet, listed so a reader still finds them. `languages`: every
 *   language that has an index, for the alternate links.
 * @returns {string}
 */
export function renderIndexPage({
  posts,
  fallback = [],
  assets,
  launched,
  lang = 'en',
  languages = [lang],
}) {
  const s = strings(lang);
  const sorted = [...posts].sort(byNewest);
  const listed = [...posts, ...fallback].sort(byNewest);
  const essays = listed.filter((post) => post.kind === 'essay');
  const notes = listed.filter((post) => post.kind === 'note');
  const content = markup`<div class="index">
<header class="index-header">
<p class="index-eyebrow">${s.blogName}</p>
<h1 class="index-lede">${s.tagline}</h1>
<p class="index-intro">${s.intro}</p>
${heroActions(sorted[0], launched, s, lang)}
</header>
${topicsBand(s)}
${section({ id: 'essays-title', title: s.essays, intro: s.essaysIntro, items: essays.map((post) => essayCard(post, lang)), listClass: 'cards' })}
${section({ id: 'notes-title', title: s.notes, intro: s.notesIntro, items: notes.map((post) => noteItem(post, lang)), listClass: 'notes' })}
</div>`;
  return renderPage({
    lang,
    meta: indexMeta(sorted, s, lang, languages),
    assets,
    launched,
    content,
  });
}
