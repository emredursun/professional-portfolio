/**
 * The blog's front page at /blog: a short introduction, the essays as cards
 * and the short notes as a list, newest first. Plain links throughout, so it
 * works without JavaScript and every post is one click from the index.
 */

import { markup } from '../html.js';
import { PERSON_ID, WEBSITE_ID } from '../../lib/route-meta.js';
import { BLOG_NAME, BLOG_TAGLINE, TOPIC_LABELS } from '../config.js';
import { BLOG_URL, FEED_PATH, byNewest, formatDate, postPath, postUrl } from './format.js';
import { renderPage } from './layout.js';
import { nextRecheck } from './sections.js';
import { statusChip } from './status.js';

const TOPICS = [
  'Testing, honestly',
  'Working with AI',
  'Pega and Tosca',
  'Life in three languages',
];

/** The canvas's band of topics: static, so there is nothing to pause (WCAG 2.2.2). */
function topicsBand() {
  return markup`<ul class="band" aria-label="Topics">${TOPICS.map(
    (topic, index) =>
      markup`<li>${index > 0 ? markup`<span class="band-mark" aria-hidden="true">✳</span>` : ''}${topic}</li>`,
  )}</ul>`;
}

function heroActions(newest, launched) {
  return markup`<p class="index-actions"><a class="button button-solid" href="${postPath(newest)}">Read the latest</a>${
    launched ? markup`<a class="button" href="${FEED_PATH}">Follow with a feed reader</a>` : ''
  }</p>`;
}

const DESCRIPTION =
  'Notes on software quality, test automation and working with AI, by Emre Dursun, QA consultant in the Netherlands.';

function indexMeta(posts) {
  return {
    title: `${BLOG_NAME} · Emre Dursun`,
    heading: BLOG_NAME,
    description: DESCRIPTION,
    url: BLOG_URL,
    ogType: 'website',
    lcpFont: 'reading',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${BLOG_URL}#blog`,
      name: BLOG_NAME,
      description: DESCRIPTION,
      url: BLOG_URL,
      inLanguage: 'en',
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

function postMeta(post) {
  return markup`<p class="card-meta">${TOPIC_LABELS[post.topic]} · ${post.minutes} min · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time></p>`;
}

// Revealed in the browser by blog/client/stale.ts once the re-check date has
// passed, as on the article's evidence card.
const staleNote = () => markup`<p class="stale-note" hidden>Needs a re-run</p>`;

function essayCard(post) {
  return markup`<li class="card" data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
<p class="card-status">${statusChip(post.status)}</p>
<h3 class="card-title"><a href="${postPath(post)}">${post.title}</a></h3>
<p class="card-dek">${post.description}</p>
${postMeta(post)}
${staleNote()}
</li>`;
}

function noteItem(post) {
  return markup`<li class="note-item" data-recheck-by="${nextRecheck(post.evidence.recheckedAt)}">
${statusChip(post.status)}
<a href="${postPath(post)}">${post.title}</a>
${postMeta(post)}
${staleNote()}
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
 * @param {{ posts: object[], assets: object, launched: boolean }} options
 * @returns {string}
 */
export function renderIndexPage({ posts, assets, launched }) {
  const sorted = [...posts].sort(byNewest);
  const essays = sorted.filter((post) => post.kind === 'essay');
  const notes = sorted.filter((post) => post.kind === 'note');
  const content = markup`<div class="index">
<header class="index-header">
<p class="index-eyebrow">${BLOG_NAME}</p>
<h1 class="index-lede">${BLOG_TAGLINE}</h1>
<p class="index-intro">I test software for a living, in the Netherlands, in three languages. This is where I write down what I learn: at work, with AI, and in between.</p>
${heroActions(sorted[0], launched)}
</header>
${topicsBand()}
${section({ id: 'essays-title', title: 'Essays', intro: 'Longer pieces, rewritten until they hold.', items: essays.map(essayCard), listClass: 'cards' })}
${section({ id: 'notes-title', title: 'Short notes', intro: 'Smaller thoughts, still being tested.', items: notes.map(noteItem), listClass: 'notes' })}
</div>`;
  return renderPage({ lang: 'en', meta: indexMeta(sorted), assets, launched, content });
}
