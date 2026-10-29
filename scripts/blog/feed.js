/**
 * The blog's Atom feeds (RFC 4287), one per language at /blog/feed.xml,
 * /tr/blog/feed.xml and /nl/blog/feed.xml, newest first.
 *
 * Built with the same escape-by-default templates as the pages: the five
 * characters they escape are exactly the ones XML needs. Timestamps come from
 * the posts' dates, never the clock, so the feed is as deterministic as the
 * pages and only changes when a post does.
 */

import { markup } from './html.js';
import { SITE_URL } from '../lib/route-meta.js';
import { strings } from './strings.js';
import { blogUrl, byNewest, feedPath, lastChange, postUrl } from './templates/format.js';

/** Atom wants full timestamps; posts have dates, so midnight UTC. */
const timestamp = (isoDate) => `${isoDate}T00:00:00Z`;

function entry(post) {
  const url = postUrl(post);
  return markup`<entry>
<title>${post.title}</title>
<link rel="alternate" type="text/html" href="${url}"/>
<id>${url}</id>
<published>${timestamp(post.publishedAt)}</published>
<updated>${timestamp(lastChange(post))}</updated>
<summary>${post.description}</summary>
<category term="${post.topic}" label="${strings(post.lang).topicLabels[post.topic]}"/>
</entry>
`;
}

/**
 * @param {object[]} posts  Published posts in `lang`; at least one.
 * @param {string} [lang]
 * @returns {string}
 */
export function renderFeed(posts, lang = 'en') {
  const sorted = [...posts].sort(byNewest);
  const updated = sorted.map(lastChange).sort().at(-1);
  const s = strings(lang);
  const feed = markup`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${lang}">
<title>${s.blogName}</title>
<subtitle>${s.tagline}</subtitle>
<id>${blogUrl(lang)}</id>
<link rel="alternate" type="text/html" href="${blogUrl(lang)}"/>
<link rel="self" type="application/atom+xml" href="${SITE_URL}${feedPath(lang)}"/>
<updated>${timestamp(updated)}</updated>
<author><name>Emre Dursun</name><uri>${SITE_URL}/</uri></author>
${sorted.map(entry)}</feed>
`;
  return String(feed);
}
