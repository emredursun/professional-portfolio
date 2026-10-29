/**
 * A complete article page. The rendered Markdown arrives already escaped and
 * checked (scripts/blog/markdown.js) and is the only raw() content.
 */

import { markup, raw } from '../html.js';
import { PERSON_ID } from '../../lib/route-meta.js';
import { previewImage } from './head.js';
import {
  blogUrl,
  formatDate,
  lastChange,
  portfolioPath,
  postPath,
  postUrl,
  topicPath,
} from './format.js';
import { renderPage } from './layout.js';
import { statusChip } from './status.js';
import { aiPanel, corrections, evidenceCard, tableOfContents } from './sections.js';
import { strings } from '../strings.js';

/** The other language versions of a post, as JSON-LD links (schema.org translations). */
function translationLinks(post) {
  const link = (lang) => ({ '@id': `${postUrl({ ...post, lang })}#article` });
  if (post.lang !== 'en') return { translationOfWork: link('en') };
  const others = (post.translations ?? []).filter((lang) => lang !== 'en');
  return others.length > 0 ? { workTranslation: others.map(link) } : {};
}

function articleMeta(post, assets) {
  const url = postUrl(post);
  const modified = lastChange(post);
  const image = previewImage(assets, `${post.slug}.${post.lang}`, post.title);
  return {
    title: `${post.title} · ${strings(post.lang).blogName}`,
    heading: post.title,
    description: post.description,
    url,
    alternates: (post.translations ?? [post.lang]).map((lang) => ({
      lang,
      url: postUrl({ ...post, lang }),
    })),
    image,
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
      image: image.url,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      isPartOf: { '@id': `${blogUrl(post.lang)}#blog` },
      ...translationLinks(post),
    },
  };
}

/** On a translation the English version has outgrown: say so, and link to it. */
function translationNote(post, s) {
  if (!post.englishIsNewer) return '';
  return markup`<p class="translation-note">${s.englishNewer} <a href="${postPath({ ...post, lang: 'en' })}" hreflang="en">${s.readEnglish}</a></p>\n`;
}

function articleHeader(post) {
  const s = strings(post.lang);
  return markup`<header class="article-header">
<p class="article-kicker">${statusChip(post.status, post.lang)} <a class="topic-link" href="${topicPath(post.lang, post.topic)}">${s.topicLabels[post.topic]}</a> · ${post.minutes} ${s.minutesRead}</p>
<h1>${post.title}</h1>
<p class="article-dek">${post.description}</p>
${translationNote(post, s)}<p class="byline">Emre Dursun · <time datetime="${post.publishedAt}">${formatDate(post.publishedAt, post.lang)}</time>${post.updatedAt ? markup` · ${s.updated} <time datetime="${post.updatedAt}">${formatDate(post.updatedAt, post.lang)}</time>` : ''}</p>
</header>`;
}

function authorCard(s, lang) {
  return markup`<section class="author" aria-label="${s.aboutAuthor}">
<img src="/images/emre-dursun-qa-consultant-400.webp" alt="" width="64" height="64" loading="lazy" decoding="async">
<div>
<p class="author-name">${s.writtenBy}</p>
<p class="author-bio">${s.authorBio}</p>
<p><a href="${portfolioPath(lang, '/about')}">${s.moreAboutMe}</a></p>
</div>
</section>`;
}

/**
 * Up to two other posts, so a reader who finished has somewhere to go. It sits
 * after the article: links to other posts are not part of this one.
 */
function keepReading(related, s) {
  if (related.length === 0) return '';
  return markup`<section class="more" aria-labelledby="more-title">
<h2 id="more-title">${s.keepReading}</h2>
<ul class="more-list">${related.map(
    (post) =>
      markup`<li><a href="${postPath(post)}">${post.title}</a><span class="more-meta">${s.topicLabels[post.topic]} · ${post.minutes} ${s.minutesShort}</span></li>`,
  )}</ul>
</section>`;
}

/**
 * @param {{ post: object, related?: object[], assets: object, launched: boolean }} options
 * @returns {string}
 */
export function renderArticlePage({ post, related = [], assets, launched }) {
  const s = strings(post.lang);
  const content = markup`<article class="${post.toc.length > 0 ? 'article has-toc' : 'article'}">
${articleHeader(post)}
${tableOfContents(post)}
<div class="prose">
${raw(post.html)}
</div>
${evidenceCard(post)}
${aiPanel(post)}
${corrections(post)}
${authorCard(s, post.lang)}
</article>
${keepReading(related, s)}`;
  return renderPage({
    lang: post.lang,
    meta: articleMeta(post, assets),
    assets,
    launched,
    content,
    progress: true,
  });
}
