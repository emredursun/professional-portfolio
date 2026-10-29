/**
 * The blog's front page at /blog: a short introduction, the essays as cards
 * and the short notes as a list, newest first. Plain links throughout, so it
 * works without JavaScript and every post is one click from the index.
 */

import { markup } from '../html.js';
import { PERSON_ID, WEBSITE_ID } from '../../lib/route-meta.js';
import { blogUrl, byNewest, feedPath, postPath, postUrl } from './format.js';
import { postSections } from './cards.js';
import { renderPage } from './layout.js';
import { nowLine } from './now.js';
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
    headingFont: 'display',
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

/**
 * @param {{ posts: object[], fallback?: object[], now?: readonly object[], assets: object, launched: boolean, lang?: string, languages?: string[] }} options
 *   `now`: this language's Now entries, newest first; the newest shows here.
 *   `posts`: the posts in `lang`. `fallback`: English posts with no `lang`
 *   version yet, listed so a reader still finds them. `languages`: every
 *   language that has an index, for the alternate links. `topics`: the
 *   topics with a page in `lang`.
 * @returns {string}
 */
export function renderIndexPage({
  posts,
  fallback = [],
  topics,
  now,
  assets,
  launched,
  lang = 'en',
  languages = [lang],
}) {
  const s = strings(lang);
  const sorted = [...posts].sort(byNewest);
  const content = markup`<div class="index">
<header class="index-header">
<p class="index-eyebrow">${s.blogName}</p>
<h1 class="index-lede">${s.tagline}</h1>
<p class="index-intro">${s.intro}</p>
${nowLine(now, lang)}${heroActions(sorted[0], launched, s, lang)}
</header>
${topicsBand(s)}
${postSections({ posts, fallback, lang, topics })}
</div>`;
  return renderPage({
    lang,
    meta: indexMeta(sorted, s, lang, languages),
    assets,
    launched,
    content,
  });
}
