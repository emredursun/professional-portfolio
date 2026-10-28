/**
 * Blog-wide settings shared by the Markdown renderer and the page templates.
 */

export const BLOG_NAME = 'Field Notes';

export const BLOG_TAGLINE = 'Notes on quality, and the rest of life.';

/**
 * Element ids the page template uses. Heading ids never take these, so a
 * section called "Main" cannot hijack the skip link or a panel's label.
 * tests/blog/article-template.test.ts checks the list against the template.
 */
export const RESERVED_IDS = Object.freeze([
  'main',
  'evidence-title',
  'ai-title',
  'ai-mine',
  'ai-assisted',
  'corrections-title',
  'more-title',
  'essays-title',
  'notes-title',
  'closing-title',
]);

export const STATUS_LABELS = Object.freeze({
  hypothesis: 'Hypothesis',
  testing: 'Testing',
  verified: 'Verified',
  revised: 'Revised',
});

export const TOPIC_LABELS = Object.freeze({
  testing: 'Testing',
  ai: 'Working with AI',
  life: 'Life',
});

/**
 * Stays false until the launch PR. While false, every blog page is marked
 * noindex, nofollow: pull requests labelled "preview" deploy to a public
 * Firebase channel, and a placeholder post must never be indexed. Flipping
 * it is on the launch checklist in docs/adr/0001-static-blog-build.md.
 */
export const BLOG_LAUNCHED = false;
