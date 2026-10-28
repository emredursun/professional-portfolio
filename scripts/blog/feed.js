/**
 * The blog's Atom feed (RFC 4287) at /blog/feed.xml, newest first.
 *
 * Built with the same escape-by-default templates as the pages: the five
 * characters they escape are exactly the ones XML needs. Timestamps come from
 * the posts' dates, never the clock, so the feed is as deterministic as the
 * pages and only changes when a post does.
 */

import { markup } from './html.js';
import { SITE_URL } from '../lib/route-meta.js';
import { BLOG_NAME, TOPIC_LABELS } from './config.js';
import { BLOG_URL, FEED_PATH, byNewest, postUrl } from './templates/format.js';

const SUBTITLE = 'Notes on quality, and the rest of life.';

/** Atom wants full timestamps; posts have dates, so midnight UTC. */
const timestamp = (isoDate) => `${isoDate}T00:00:00Z`;
const lastChange = (post) => post.updatedAt ?? post.publishedAt;

function entry(post) {
  const url = postUrl(post);
  return markup`<entry>
<title>${post.title}</title>
<link rel="alternate" type="text/html" href="${url}"/>
<id>${url}</id>
<published>${timestamp(post.publishedAt)}</published>
<updated>${timestamp(lastChange(post))}</updated>
<summary>${post.description}</summary>
<category term="${post.topic}" label="${TOPIC_LABELS[post.topic]}"/>
</entry>
`;
}

/**
 * @param {object[]} posts  Published posts; at least one.
 * @returns {string}
 */
export function renderFeed(posts) {
  const sorted = [...posts].sort(byNewest);
  const updated = sorted.map(lastChange).sort().at(-1);
  const feed = markup`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
<title>${BLOG_NAME}</title>
<subtitle>${SUBTITLE}</subtitle>
<id>${BLOG_URL}</id>
<link rel="alternate" type="text/html" href="${BLOG_URL}"/>
<link rel="self" type="application/atom+xml" href="${SITE_URL}${FEED_PATH}"/>
<updated>${timestamp(updated)}</updated>
<author><name>Emre Dursun</name><uri>${SITE_URL}/</uri></author>
${sorted.map(entry)}</feed>
`;
  return String(feed);
}
