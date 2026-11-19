/**
 * The "Now" log: what Emre is working on, as short dated entries, one file
 * per language at blog/now/<lang>.md (frontmatter only). English is required,
 * like every post. Entries are written newest first. The newest date is the
 * page's "last updated" date: entries that share it are the current focus,
 * and older entries, if kept, show their own date. An entry may link one
 * phrase of its text (`link: { text, href }`) to another site.
 */

import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { parseFrontmatter } from './frontmatter.js';
import { isoDate, text } from './schema.js';
import { BLOG_LANGUAGES } from './strings.js';

const httpsLink = z
  .string()
  .regex(/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i, 'must be an https:// link');

const nowSchema = z
  .object({
    entries: z
      .array(
        z
          .object({
            date: isoDate,
            text: text.max(280),
            link: z.object({ text, href: httpsLink }).strict().optional(),
            placeholder: z.literal(true).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

function readNow(dir, name) {
  const file = `blog/now/${name}`;
  const lang = name.slice(0, -'.md'.length);
  if (!name.endsWith('.md') || !BLOG_LANGUAGES.includes(lang)) {
    throw new Error(`${file}: not a Now file (use ${BLOG_LANGUAGES.join('.md, ')}.md)`);
  }
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'), file);
  if (body.trim())
    throw new Error(`${file}: write entries in the frontmatter; the body must be empty`);
  const result = nowSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  const { entries } = result.data;
  entries.forEach((entry, index) => {
    if (index > 0 && entry.date > entries[index - 1].date) {
      throw new Error(`${file}: entries must be newest first (${entry.date})`);
    }
    if (entry.link && !entry.text.includes(entry.link.text)) {
      throw new Error(`${file}: link text "${entry.link.text}" is not in its entry's text`);
    }
  });
  return [lang, Object.freeze(entries.map((entry) => Object.freeze(entry)))];
}

/**
 * Each language's entries, newest first; {} when there is no log.
 * @param {string} nowDir
 * @returns {Record<string, readonly { date: string, text: string, link?: { text: string, href: string }, placeholder?: true }[]>}
 */
export function loadNow(nowDir) {
  if (!nowDir || !fs.existsSync(nowDir)) return {};
  const now = Object.fromEntries(
    fs
      .readdirSync(nowDir)
      .filter((name) => !name.startsWith('.'))
      .sort()
      .map((name) => readNow(nowDir, name)),
  );
  if (Object.keys(now).length > 0 && !now.en) {
    throw new Error('blog/now/en.md: missing; the Now log needs its English version');
  }
  return Object.freeze(
    Object.fromEntries(BLOG_LANGUAGES.filter((lang) => now[lang]).map((lang) => [lang, now[lang]])),
  );
}
