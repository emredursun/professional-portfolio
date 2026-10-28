/**
 * Date and URL helpers shared by the blog templates. Dates are formatted by
 * hand rather than with Intl so the output never depends on the Node build's
 * ICU data or the machine's locale.
 */

import { SITE_URL } from '../../lib/route-meta.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @param {string} isoDate  YYYY-MM-DD */
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** @param {{ slug: string }} post */
function postPath(post) {
  return `/blog/${post.slug}`;
}

/** @param {{ slug: string }} post */
export function postUrl(post) {
  return `${SITE_URL}${postPath(post)}`;
}
