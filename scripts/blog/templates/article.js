/**
 * A complete article page. The rendered Markdown arrives already escaped and
 * checked (scripts/blog/markdown.js) and is the only raw() content.
 */

import { markup, raw } from '../html.js';
import { PERSON_ID, SOCIAL_IMAGE } from '../../lib/route-meta.js';
import { BLOG_NAME, STATUS_LABELS, TOPIC_LABELS } from '../config.js';
import { BLOG_URL, formatDate, postPath, postUrl } from './format.js';
import { renderPage } from './layout.js';
import { aiPanel, corrections, evidenceCard, tableOfContents } from './sections.js';

function articleMeta(post) {
  const url = postUrl(post);
  const modified = post.updatedAt ?? post.publishedAt;
  return {
    title: `${post.title} · ${BLOG_NAME}`,
    heading: post.title,
    description: post.description,
    url,
    ogType: 'article',
    published: post.publishedAt,
    modified,
    hasCode: post.hasCode,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: modified,
      inLanguage: post.lang,
      mainEntityOfPage: url,
      image: SOCIAL_IMAGE.url,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      isPartOf: { '@id': `${BLOG_URL}#blog` },
    },
  };
}

function articleHeader(post) {
  return markup`<header class="article-header">
<p class="article-kicker"><span class="status status-${post.status}">${STATUS_LABELS[post.status]}</span> ${TOPIC_LABELS[post.topic]} · ${post.minutes} min read</p>
<h1>${post.title}</h1>
<p class="article-dek">${post.description}</p>
<p class="byline">Emre Dursun · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>${post.updatedAt ? markup` · updated <time datetime="${post.updatedAt}">${formatDate(post.updatedAt)}</time>` : ''}</p>
</header>`;
}

/** Up to two other posts, so a reader who finished has somewhere to go. */
function keepReading(related) {
  if (related.length === 0) return '';
  return markup`<section class="more" aria-labelledby="more-title">
<h2 id="more-title">Keep reading</h2>
<ul class="more-list">${related.map(
    (post) =>
      markup`<li><a href="${postPath(post)}">${post.title}</a><span class="more-meta">${TOPIC_LABELS[post.topic]} · ${post.minutes} min</span></li>`,
  )}</ul>
</section>`;
}

/**
 * @param {{ post: object, related?: object[], assets: object, launched: boolean }} options
 * @returns {string}
 */
export function renderArticlePage({ post, related = [], assets, launched }) {
  const content = markup`<article class="article">
${articleHeader(post)}
${evidenceCard(post)}
${tableOfContents(post)}
<div class="prose">
${raw(post.html)}
</div>
${aiPanel(post)}
${corrections(post)}
${keepReading(related)}
</article>`;
  return renderPage({
    lang: post.lang,
    meta: articleMeta(post),
    assets,
    launched,
    content,
    progress: true,
  });
}
