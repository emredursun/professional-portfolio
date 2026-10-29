/**
 * The blog's posts for llms.txt (scripts/generate-agent-profile.js), so an
 * AI assistant answering questions about the site can find what Emre has
 * written. English only, like the rest of llms.txt; nothing before launch.
 */

import { BLOG_LAUNCHED } from './config.js';
import { loadPosts } from './content.js';
import { assertLaunchable } from './launch-gate.js';
import { byNewest, postUrl } from './templates/format.js';

/**
 * @param {{ contentDir: string, launched?: boolean }} options
 * @returns {{ title: string, url: string, description: string }[]}
 */
export function blogForAgents({ contentDir, launched = BLOG_LAUNCHED }) {
  if (!launched) return [];
  const posts = loadPosts(contentDir);
  // llms.txt lists posts only, so the Now log does not concern it here.
  assertLaunchable({ posts, now: {} });
  return posts
    .filter((post) => post.lang === 'en')
    .sort(byNewest)
    .map((post) => ({ title: post.title, url: postUrl(post), description: post.description }));
}
