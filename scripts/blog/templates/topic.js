/**
 * A topic's page (/blog/topic/<topic>, and under /tr and /nl): every post on
 * that topic, newest first, in the same cards as the index. Written only for
 * a language that has at least one post on the topic, so there are no empty
 * pages to crawl.
 */

import { markup } from '../html.js';
import { PERSON_ID } from '../../lib/route-meta.js';
import { strings } from '../strings.js';
import { postSections } from './cards.js';
import { blogPath, blogUrl, postUrl, topicUrl } from './format.js';
import { renderPage } from './layout.js';

function topicMeta({ topic, posts, s, lang, languages }) {
  const url = topicUrl(lang, topic);
  const label = s.topicLabels[topic];
  const description = s.topicDescriptions[topic];
  return {
    title: `${label} · ${s.blogName}`,
    heading: label,
    description,
    url,
    alternates: languages.map((other) => ({ lang: other, url: topicUrl(other, topic) })),
    ogType: 'website',
    lcpFont: 'reading',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${url}#page`,
          name: label,
          description,
          url,
          inLanguage: lang,
          isPartOf: { '@id': `${blogUrl(lang)}#blog` },
          author: { '@id': PERSON_ID },
          hasPart: posts.map((post) => ({ '@id': `${postUrl(post)}#article` })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: s.blogName, item: blogUrl(lang) },
            { '@type': 'ListItem', position: 2, name: label, item: url },
          ],
        },
      ],
    },
  };
}

/**
 * @param {{ topic: string, posts: object[], fallback?: object[], assets: object, launched: boolean, lang: string, languages: string[] }} options
 *   `posts`: this topic's posts in `lang`; `fallback`: its English posts with
 *   no `lang` version yet; `languages`: every language with this topic's page.
 * @returns {string}
 */
export function renderTopicPage({
  topic,
  posts,
  fallback = [],
  assets,
  launched,
  lang,
  languages,
}) {
  if (posts.length === 0) throw new Error(`blog: no ${lang} posts on "${topic}"; skip the page`);
  const s = strings(lang);
  const content = markup`<div class="index">
<header class="index-header">
<p class="index-eyebrow"><a href="${blogPath(lang)}">${s.blogName}</a> · ${s.topicEyebrow}</p>
<h1 class="index-lede">${s.topicLabels[topic]}</h1>
<p class="index-intro">${s.topicDescriptions[topic]}</p>
</header>
${postSections({ posts, fallback, lang })}
</div>`;
  return renderPage({
    lang,
    meta: topicMeta({ topic, posts, s, lang, languages }),
    assets,
    launched,
    content,
  });
}
