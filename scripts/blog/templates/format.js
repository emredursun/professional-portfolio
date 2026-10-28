/**
 * Date and URL helpers shared by the blog templates and the feed. Dates are
 * formatted by hand rather than with Intl so the output never depends on the
 * Node build's ICU data or the machine's locale.
 */

import { SITE_URL } from '../../lib/route-meta.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BLOG_PATH = '/blog';
export const FEED_PATH = '/blog/feed.xml';
export const BLOG_URL = `${SITE_URL}${BLOG_PATH}`;

/** @param {string} isoDate  YYYY-MM-DD */
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** @param {{ slug: string }} post */
export function postPath(post) {
  return `${BLOG_PATH}/${post.slug}`;
}

/** @param {{ slug: string }} post */
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
