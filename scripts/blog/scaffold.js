/**
 * Starts a new post: `npm run blog:new <slug> [--kind note] [--topic ai]`
 * writes blog/content/<slug>/{en,tr,nl}.md as drafts whose frontmatter the
 * build already accepts, so writing starts from a valid file instead of a
 * copied sample. They stay out of the build until `draft: true` goes.
 */

import fs from 'fs';
import path from 'path';
import { RESERVED_SLUGS, SLUG } from './content.js';
import { KINDS, TOPICS } from './schema.js';
import { BLOG_LANGUAGES } from './strings.js';

/** Frontmatter for one language; English is the original, the others its translations. */
function frontmatter({ lang, kind, topic, today }) {
  const translation =
    lang === 'en' ? '' : `translation:\n  from: ${today}\n  assistedByAi: false\n`;
  return `---
title: 'Working title (${lang})'
description: 'One or two sentences for the index, search results and link previews.'
publishedAt: ${today}
topic: ${topic}
kind: ${kind}
status: hypothesis
evidence:
  confidence: 'How sure you are, and about what'
  basedOn:
    - 'What this rests on: work, sources, experiments'
  recheckedAt: ${today}
aiAssistance:
  mine:
    - 'What is yours'
  assisted: []
${translation}draft: true
---

Write here.
`;
}

/**
 * @param {{ contentDir: string, slug: string, kind?: string, topic?: string, today: string }} options
 *   `today`: YYYY-MM-DD, the date the post and its evidence start from.
 * @returns {string[]} The files written, as repository paths.
 */
export function scaffoldPost({ contentDir, slug, kind = 'essay', topic = 'testing', today }) {
  if (!SLUG.test(slug)) throw new Error(`blog:new: "${slug}" must be lowercase-with-dashes`);
  if (RESERVED_SLUGS.has(slug)) throw new Error(`blog:new: "${slug}" is reserved`);
  if (!KINDS.includes(kind)) throw new Error(`blog:new: kind must be ${KINDS.join(' or ')}`);
  if (!TOPICS.includes(topic)) throw new Error(`blog:new: topic must be ${TOPICS.join(', ')}`);
  const dir = path.join(contentDir, slug);
  if (fs.existsSync(dir)) throw new Error(`blog:new: blog/content/${slug} already exists`);
  fs.mkdirSync(dir, { recursive: true });
  return BLOG_LANGUAGES.map((lang) => {
    fs.writeFileSync(path.join(dir, `${lang}.md`), frontmatter({ lang, kind, topic, today }));
    return `blog/content/${slug}/${lang}.md`;
  });
}
