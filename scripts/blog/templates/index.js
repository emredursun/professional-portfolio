/**
 * The blog's front page at /blog: the hero (hero.js: headline, introduction,
 * the newest post as a Latest card, the Now chip, the actions and the topic
 * chips), then the essays and the short notes as cards, newest first. Plain links throughout, so it
 * works without JavaScript and every post is one click from the index.
 */

import { markup } from '../html.js';
import { PERSON_ID, WEBSITE_ID } from '../../lib/route-meta.js';
import { blogUrl, byNewest, postUrl } from './format.js';
import { postSections } from './cards.js';
import { indexHero, topicChips } from './hero.js';
import { previewImage } from './head.js';
import { renderPage } from './layout.js';
import { strings } from '../strings.js';

function indexMeta(posts, s, lang, languages, assets) {
  const url = blogUrl(lang);
  return {
    title: `${s.blogName} · Emre Dursun`,
    heading: s.blogName,
    description: s.description,
    url,
    alternates: languages.map((other) => ({ lang: other, url: blogUrl(other) })),
    image: previewImage(assets, `_site.${lang}`, `${s.blogName}: ${s.tagline}`),
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
  // Default: the topics of the posts in `lang`, each of which has a page.
  const pageTopics = topics ?? new Set(posts.map((post) => post.topic));
  const content = markup`<div class="index-top">
${indexHero({ newest: sorted[0], now, launched, lang })}
${topicChips({ listed: [...posts, ...fallback], topics: pageTopics, lang })}
</div>
<div class="index index-posts">
${postSections({ posts, fallback, lang, topics: pageTopics })}
</div>`;
  return renderPage({
    lang,
    meta: indexMeta(sorted, s, lang, languages, assets),
    assets,
    launched,
    content,
  });
}
