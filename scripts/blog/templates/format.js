/**
 * Date and URL helpers shared by the blog templates and the feed. Dates are
 * formatted by hand rather than with Intl so the output never depends on the
 * Node build's ICU data or the machine's locale.
 *
 * English lives at /blog, the others under the portfolio's language prefix
 * (/tr/blog, /nl/blog), so a reader who switched language on the portfolio
 * stays in it.
 */

import { SITE_URL } from '../../lib/route-meta.js';
import { BLOG_LANGUAGES } from '../strings.js';

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  tr: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ],
  nl: [
    'januari',
    'februari',
    'maart',
    'april',
    'mei',
    'juni',
    'juli',
    'augustus',
    'september',
    'oktober',
    'november',
    'december',
  ],
};

function checkLanguage(lang) {
  if (!BLOG_LANGUAGES.includes(lang)) throw new Error(`blog: unknown language "${lang}"`);
  return lang;
}

/**
 * The folder a language's files are written to, relative to dist: '' or 'tr/'.
 * @param {string} lang
 */
export function outputDir(lang) {
  return checkLanguage(lang) === 'en' ? '' : `${lang}/`;
}

/** @param {string} lang */
export function blogPath(lang) {
  return `/${outputDir(lang)}blog`;
}

/** @param {string} lang */
export function blogUrl(lang) {
  return `${SITE_URL}${blogPath(lang)}`;
}

/**
 * A topic's page: /blog/topic/testing, /tr/blog/topic/ai.
 * @param {string} lang
 * @param {string} topic  One of the schema's topics.
 */
export function topicPath(lang, topic) {
  return `${blogPath(lang)}/topic/${topic}`;
}

/** @param {string} lang @param {string} topic */
export function topicUrl(lang, topic) {
  return `${SITE_URL}${topicPath(lang, topic)}`;
}

/** The "Now" page: /blog/now, /tr/blog/now. @param {string} lang */
export function nowPath(lang) {
  return `${blogPath(lang)}/now`;
}

/** @param {string} lang */
export function feedPath(lang) {
  return `${blogPath(lang)}/feed.xml`;
}

/**
 * A portfolio page in the reader's language: ('tr', '/contact') gives
 * /tr/contact, and ('en', '/') gives /.
 * @param {string} lang
 * @param {string} route  '/' or a path such as '/contact'.
 */
export function portfolioPath(lang, route) {
  const prefix = outputDir(lang) ? `/${lang}` : '';
  return route === '/' ? prefix || '/' : `${prefix}${route}`;
}

/**
 * @param {string} isoDate  YYYY-MM-DD
 * @param {string} [lang]
 */
export function formatDate(isoDate, lang = 'en') {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[checkLanguage(lang)][month - 1]} ${year}`;
}

/** @param {{ slug: string, lang?: string }} post */
export function postPath(post) {
  return `${blogPath(post.lang ?? 'en')}/${post.slug}`;
}

/** @param {{ slug: string, lang?: string }} post */
export function postUrl(post) {
  return `${SITE_URL}${postPath(post)}`;
}

/**
 * The date of a post's latest change: publication, update or correction,
 * whichever is latest. Corrections count: a reader following the feed should
 * hear about them, and so should search engines (dateModified).
 */
export function lastChange(post) {
  return [post.publishedAt, post.updatedAt, ...(post.corrections ?? []).map((c) => c.date)]
    .filter(Boolean)
    .sort()
    .at(-1);
}

/** Newest first; ties broken by slug so the order never depends on input order. */
export function byNewest(a, b) {
  if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}
