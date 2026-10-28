/**
 * A complete article page. The rendered Markdown arrives already escaped and
 * checked (scripts/blog/markdown.js) and is the only raw() content.
 */

import { markup, raw } from '../html.js';
import { PERSON_ID, SOCIAL_IMAGE } from '../../lib/route-meta.js';
import { BLOG_NAME, TOPIC_LABELS } from '../config.js';
import { BLOG_URL, formatDate, lastChange, postPath, postUrl } from './format.js';
import { renderPage } from './layout.js';
import { statusChip } from './status.js';
import { aiPanel, corrections, evidenceCard, tableOfContents } from './sections.js';

function articleMeta(post) {
  const url = postUrl(post);
  const modified = lastChange(post);
  return {
    title: `${post.title} · ${BLOG_NAME}`,
    heading: post.title,
    description: post.description,
    url,
    ogType: 'article',
    lcpFont: 'display',
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
<p class="article-kicker">${statusChip(post.status)} ${TOPIC_LABELS[post.topic]} · ${post.minutes} min read</p>
<h1>${post.title}</h1>
<p class="article-dek">${post.description}</p>
<p class="byline">Emre Dursun · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>${post.updatedAt ? markup` · updated <time datetime="${post.updatedAt}">${formatDate(post.updatedAt)}</time>` : ''}</p>
</header>`;
}

function authorCard() {
  return markup`<section class="author" aria-label="About the author">
<img src="/images/emre-dursun-qa-consultant-400.webp" alt="" width="64" height="64" loading="lazy" decoding="async">
<div>
<p class="author-name">Written by Emre Dursun</p>
<p class="author-bio">QA consultant for Pega and Tricentis Tosca in the Netherlands. I write here to think more clearly about my work.</p>
<p><a href="/about">More about me</a></p>
</div>
</section>`;
}

/**
 * Up to two other posts, so a reader who finished has somewhere to go. It sits
 * after the article: links to other posts are not part of this one.
 */
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
  const content = markup`<article class="${post.toc.length > 0 ? 'article has-toc' : 'article'}">
${articleHeader(post)}
${evidenceCard(post)}
${tableOfContents(post)}
<div class="prose">
${raw(post.html)}
</div>
${aiPanel(post)}
${corrections(post)}
${authorCard()}
</article>
${keepReading(related)}`;
  return renderPage({
    lang: post.lang,
    meta: articleMeta(post),
    assets,
    launched,
    content,
    progress: true,
  });
}
