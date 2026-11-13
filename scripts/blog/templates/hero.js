/**
 * The top of the blog's index: the headline, the introduction, the newest
 * Now entry as a small status chip, the actions, the newest post as a large
 * "Latest" card, and the topics as linked chips with their counts.
 *
 * The markup follows the desktop layout (the left column, then the card on
 * the right), so keyboard focus moves left column first. On phones the
 * stylesheet shows the card right after the intro (hero.css, order); there
 * the card's link is reached after the actions, which is still a sensible
 * order: the actions are short and come first in the source.
 */

import { markup } from '../html.js';
import { TOPICS } from '../schema.js';
import { strings } from '../strings.js';
import { feedPath, formatDate, postPath, topicPath } from './format.js';
import { nowChip } from './now.js';
import { statusChip } from './status.js';

// The card is the right column from 960 px up (at most about 540 px), the
// full width below that. Keep in step with hero.css (the 960 px breakpoint
// and the equal columns).
const LATEST_SIZES = '(max-width: 959px) calc(100vw - 36px), 540px';

/**
 * The newest post as a feature card. Above the fold, so its cover loads
 * early rather than lazily. One link (the title), stretched over the card.
 */
function latestCard(post, s) {
  const cover = post.coverImage;
  const image = cover
    ? markup`<img class="card-cover" src="${cover.src}" srcset="${cover.srcset}" sizes="${LATEST_SIZES}" width="${cover.width}" height="${cover.height}" alt="${cover.alt}" fetchpriority="high" decoding="async">
`
    : '';
  const meta = markup`<p class="card-meta"><span class="latest-kind">${s.kindLabels[post.kind]}</span> · ${s.topicLabels[post.topic]} · ${post.minutes} ${s.minutesShort} · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt, post.lang)}</time></p>`;
  const text = markup`<h2 class="card-title latest-title" id="latest-title"><a href="${postPath(post)}">${post.title}</a></h2>
<p class="card-dek">${post.description}</p>
${meta}`;
  return markup`<article class="latest-card card${cover ? ' has-cover' : ''}" aria-labelledby="latest-title">
${image}<p class="card-status"><span class="latest-label">${s.latest}</span>${statusChip(post.status, post.lang)}</p>
${cover ? markup`<div class="card-body">\n${text}\n</div>` : text}
</article>`;
}

/**
 * The primary action leads to the rest of the posts (the Latest card already
 * opens the newest), so it is left out when there are no others; the feed
 * is a quiet text link.
 */
function actions({ hasMore, launched, s, lang }) {
  const browse = hasMore
    ? markup`<a class="button button-solid" href="#${ALL_POSTS_ID}">${s.browseAll}</a>`
    : '';
  const feed = launched
    ? markup`<a class="text-link" href="${feedPath(lang)}">${s.followFeed}<span class="text-link-arrow" aria-hidden="true">→</span></a>`
    : '';
  if (!browse && !feed) return '';
  return markup`<p class="index-actions">${browse}${feed}</p>`;
}

/** The id of the posts below the hero, which the browse action jumps to. */
export const ALL_POSTS_ID = 'all-posts';

/**
 * @param {{ newest: object, hasMore: boolean, now?: readonly object[], launched: boolean, lang: string }} options
 *   `hasMore`: whether any post is listed below the hero.
 * @returns {string}
 */
export function indexHero({ newest, hasMore, now, launched, lang }) {
  if (!newest) throw new Error('blog: the index needs at least one post');
  const s = strings(lang);
  return markup`<header class="index-hero">
<h1 class="index-lede">${s.tagline}</h1>
<p class="index-intro">${s.intro}</p>
${nowChip(now, lang)}${actions({ hasMore, launched, s, lang })}
${latestCard(newest, s)}
</header>`;
}

/**
 * The topics that have a page in `lang`, as links with how many posts each
 * page lists (its posts in `lang` and the English ones not yet translated).
 * @param {{ listed: object[], topics: Set<string>, lang: string }} options
 */
export function topicChips({ listed, topics, lang }) {
  const s = strings(lang);
  const chips = TOPICS.filter((topic) => topics.has(topic)).map((topic) => {
    const count = listed.filter((post) => post.topic === topic).length;
    return markup`<li><a class="topic-chip" href="${topicPath(lang, topic)}">${s.topicLabels[topic]} <span class="topic-count">${count}</span><span class="visually-hidden"> ${count === 1 ? s.postOne : s.postMany}</span></a></li>`;
  });
  if (chips.length === 0) return '';
  return markup`<nav class="topic-nav" aria-label="${s.topicsNav}"><ul class="topic-chips">${chips}</ul></nav>`;
}
