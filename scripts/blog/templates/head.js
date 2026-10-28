/**
 * The <head> of a blog page: metadata, structured data and assets.
 *
 * Order matters. The theme bootstrap is a small blocking classic script and
 * comes before the stylesheets, so the right theme class is on <html> before
 * the first paint and it never waits for CSS to download. The client module
 * is deferred by nature.
 */

import { markup, raw } from '../html.js';
import { PERSON_ID, SOCIAL_IMAGE, WEBSITE_ID } from '../../lib/route-meta.js';
import { BLOG_NAME } from '../config.js';
import { postUrl } from './format.js';

/** JSON for a <script> block: "<" escaped so text can never close the element. */
function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\' + 'u003c');
}

function structuredData(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${postUrl(post)}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: post.lang,
    mainEntityOfPage: postUrl(post),
    image: SOCIAL_IMAGE.url,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** One line of <head>, or nothing. */
const line = (condition, content) => (condition ? markup`${content}\n` : '');

/**
 * @param {{ post: object, assets: object, launched: boolean }} options
 */
export function renderHead({ post, assets, launched }) {
  const url = postUrl(post);
  const robots = line(!launched, markup`<meta name="robots" content="noindex, nofollow">`);
  const styles = assets.styles.map((href) =>
    line(true, markup`<link rel="stylesheet" href="${href}">`),
  );
  const codeStyles = line(post.hasCode, markup`<link rel="stylesheet" href="${assets.codeCss}">`);
  const fontPreload = line(
    Boolean(assets.fontPreload),
    markup`<link rel="preload" href="${assets.fontPreload ?? ''}" as="font" type="font/woff2" crossorigin>`,
  );

  return markup`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${post.title} · ${BLOG_NAME}</title>
<meta name="description" content="${post.description}">
${robots}<link rel="canonical" href="${url}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#faf7f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1b18" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${BLOG_NAME} · Emre Dursun">
<meta property="og:title" content="${post.title}">
<meta property="og:description" content="${post.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SOCIAL_IMAGE.url}">
<meta property="og:image:width" content="${SOCIAL_IMAGE.width}">
<meta property="og:image:height" content="${SOCIAL_IMAGE.height}">
<meta property="og:image:alt" content="${SOCIAL_IMAGE.alt}">
<meta property="article:published_time" content="${post.publishedAt}">
<meta property="article:modified_time" content="${post.updatedAt ?? post.publishedAt}">
<meta name="twitter:card" content="summary_large_image">
<script src="${assets.themeInit}"></script>
${styles}${codeStyles}${fontPreload}<script type="module" src="${assets.script}"></script>
<script type="application/ld+json">${raw(jsonForScript(structuredData(post)))}</script>
</head>`;
}
