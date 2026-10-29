/**
 * The <head> shared by every blog page: metadata, structured data, assets.
 *
 * Order matters. The theme bootstrap is a small blocking classic script and
 * comes before the stylesheets, so the right theme class is on <html> before
 * the first paint and it never waits for CSS to download. The client module
 * is deferred by nature.
 */

import { markup, raw } from '../html.js';
import { OG_LOCALES, SITE_URL, SOCIAL_IMAGE } from '../../lib/route-meta.js';
import { OG_SIZE } from '../config.js';
import { strings } from '../strings.js';
import { feedPath } from './format.js';

/** JSON for a <script> block: "<" escaped so text can never close the element. */
function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\' + 'u003c');
}

/**
 * One line of <head>, or nothing. The content is a function so a line whose
 * condition is false is never built (its values may not exist).
 */
const line = (condition, content) => (condition ? markup`${content()}\n` : '');

/**
 * @typedef {object} PageMeta
 * @property {string} title         Full <title>, already including the blog name.
 * @property {string} heading       Title for sharing (og:title).
 * @property {string} description
 * @property {string} url           Canonical URL.
 * @property {{ lang: string, url: string }[]} [alternates]  Every language version, this one included.
 * @property {'article' | 'website'} ogType
 * @property {string} [published]   YYYY-MM-DD, articles only.
 * @property {string} [modified]    YYYY-MM-DD, articles only.
 * @property {boolean} [hasCode]
 * @property {'reading' | 'display'} lcpFont  The face of the page's largest text, preloaded
 *   (on Turkish pages its extended Latin file too: readingExt or displayExt).
 * @property {'reading' | 'display'} [headingFont]  The h1's face when it differs from
 *   lcpFont; preloaded too, so the heading does not re-wrap when fonts load.
 * @property {{ url: string, width: number, height: number, alt: string }} [image]
 *   The link-preview image (previewImage); the site's own card when absent.
 * @property {object} jsonLd
 */

/**
 * The link-preview image for a page: its committed card (blog/og/, copied to
 * /assets/ by the build) or, when the build has none (unit tests), the site's.
 * @param {{ og?: Record<string, string> }} assets
 * @param {string} cardId  "<slug>.<lang>" for an article, "_site.<lang>" otherwise.
 * @param {string} alt
 */
export function previewImage(assets, cardId, alt) {
  const file = assets.og?.[cardId];
  if (!file)
    return {
      url: SOCIAL_IMAGE.url,
      width: SOCIAL_IMAGE.width,
      height: SOCIAL_IMAGE.height,
      alt: SOCIAL_IMAGE.alt,
    };
  return { url: `${SITE_URL}${file}`, ...OG_SIZE, alt };
}

/** The lines that depend on the page, its assets or the launch flag. */
function optionalLines({ meta, assets, launched, blogName, lang }) {
  const alternates = meta.alternates ?? [];
  const english = alternates.find((alternate) => alternate.lang === 'en');
  // The largest text's face first, then the h1's if it differs, so neither
  // swaps in after the first paint and moves the page. Turkish needs ğ, ş
  // and İ from each face's extended Latin file as well.
  const faces = [...new Set([meta.lcpFont, meta.headingFont ?? meta.lcpFont])];
  const preloads = faces
    .flatMap((face) => [face, lang === 'tr' ? `${face}Ext` : undefined])
    .map((key) => key && assets.preload?.[key])
    .filter(Boolean);
  return {
    robots: line(!launched, () => markup`<meta name="robots" content="noindex, nofollow">`),
    // Each version names the others and English as the default; only
    // versions that exist are listed (content.js knows which).
    alternates: alternates.map(({ lang: other, url }) =>
      line(true, () => markup`<link rel="alternate" hreflang="${other}" href="${url}">`),
    ),
    xDefault: line(
      Boolean(english),
      () => markup`<link rel="alternate" hreflang="x-default" href="${english.url}">`,
    ),
    // The feed exists only after launch: noindex cannot reach XML, and feed
    // services cache what they find.
    feedLink: line(
      launched,
      () =>
        markup`<link rel="alternate" type="application/atom+xml" hreflang="${lang}" title="${blogName}" href="${feedPath(lang)}">`,
    ),
    localeAlternates: alternates
      .filter((alternate) => alternate.lang !== lang)
      .map(({ lang: other }) =>
        line(
          true,
          () => markup`<meta property="og:locale:alternate" content="${OG_LOCALES[other]}">`,
        ),
      ),
    articleTimes: line(
      meta.ogType === 'article',
      () => markup`<meta property="article:published_time" content="${meta.published}">
<meta property="article:modified_time" content="${meta.modified}">`,
    ),
    styles: assets.styles.map((href) =>
      line(true, () => markup`<link rel="stylesheet" href="${href}">`),
    ),
    codeStyles: line(
      Boolean(meta.hasCode && assets.codeCss),
      () => markup`<link rel="stylesheet" href="${assets.codeCss}">`,
    ),
    fontPreload: preloads.map((href) =>
      line(
        true,
        () => markup`<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>`,
      ),
    ),
  };
}

/**
 * @param {{ meta: PageMeta, assets: object, launched: boolean, lang?: string }} options
 */
export function renderHead({ meta, assets, launched, lang = 'en' }) {
  if (!['reading', 'display'].includes(meta.lcpFont)) {
    throw new Error(`blog: unknown lcpFont "${meta.lcpFont}"`);
  }
  const { blogName } = strings(lang);
  const image = meta.image ?? previewImage({}, '', '');
  const {
    robots,
    alternates,
    xDefault,
    feedLink,
    localeAlternates,
    articleTimes,
    styles,
    codeStyles,
    fontPreload,
  } = optionalLines({ meta, assets, launched, blogName, lang });

  return markup`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
${robots}<link rel="canonical" href="${meta.url}">
${alternates}${xDefault}${feedLink}<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#faf7f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1b18" media="(prefers-color-scheme: dark)">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="${meta.ogType}">
<meta property="og:site_name" content="${blogName} · Emre Dursun">
<meta property="og:title" content="${meta.heading}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${meta.url}">
<meta property="og:locale" content="${OG_LOCALES[lang]}">
${localeAlternates}<meta property="og:image" content="${image.url}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${image.width}">
<meta property="og:image:height" content="${image.height}">
<meta property="og:image:alt" content="${image.alt}">
${articleTimes}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${image.url}">
<meta name="twitter:image:alt" content="${image.alt}">
<script src="${assets.themeInit}"></script>
${styles}${codeStyles}${fontPreload}<script type="module" src="${assets.script}"></script>
<script type="application/ld+json">${raw(jsonForScript(meta.jsonLd))}</script>
</head>`;
}
