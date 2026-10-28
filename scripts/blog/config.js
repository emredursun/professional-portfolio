/**
 * Blog-wide settings shared by the Markdown renderer and the page templates.
 */

export const BLOG_NAME = 'Field Notes';

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
