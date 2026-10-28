/**
 * The shape of a blog post's frontmatter.
 *
 * Strict on purpose: an unknown key is almost always a typo that would
 * otherwise vanish silently. Slug and language are not in the frontmatter;
 * they come from the file's path (blog/content/<slug>/<lang>.md), so the two
 * can never disagree.
 */

import { z } from 'zod';

const text = z.string().trim().min(1);

/** Calendar date as YYYY-MM-DD that actually exists (no 2026-02-30). */
const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}, 'must be a real date written as YYYY-MM-DD');

const correction = z.object({ date: isoDate, text }).strict();

/**
 * An absolute https link to another site, returned in normalised form. zod's
 * own url() also accepts "https:host" (a relative path in a browser),
 * credentials and localhost.
 */
const httpsUrl = z
  .string()
  .refine((value) => {
    if (!/^https:\/\//.test(value)) return false;
    try {
      const url = new URL(value);
      return !url.username && !url.password && url.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'must be an absolute https:// link to a public host, without credentials')
  .transform((value) => new URL(value).href);

const postSchema = z
  .object({
    title: text.max(110),
    description: text.max(160),
    publishedAt: isoDate,
    updatedAt: isoDate.optional(),
    topic: z.enum(['testing', 'ai', 'life']),
    kind: z.enum(['essay', 'note']),
    status: z.enum(['hypothesis', 'testing', 'verified', 'revised']),
    evidence: z
      .object({
        confidence: text,
        basedOn: z.array(text).min(1),
        recheckedAt: isoDate,
      })
      .strict(),
    aiAssistance: z
      .object({
        mine: z.array(text).min(1),
        assisted: z.array(text),
        promptsUrl: httpsUrl.optional(),
      })
      .strict(),
    corrections: z.array(correction).default([]),
    draft: z.boolean().default(false),
  })
  .strict()
  .superRefine((post, ctx) => {
    if (post.updatedAt && post.updatedAt < post.publishedAt) {
      ctx.addIssue({ code: 'custom', path: ['updatedAt'], message: 'is before publishedAt' });
    }
    post.corrections.forEach((entry, index) => {
      const previous = index === 0 ? post.publishedAt : post.corrections[index - 1].date;
      if (entry.date < previous) {
        ctx.addIssue({
          code: 'custom',
          path: ['corrections', index, 'date'],
          message: 'corrections must be in date order, on or after publishedAt',
        });
      }
    });
  });

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/**
 * @param {unknown} data  Parsed frontmatter.
 * @param {string} file   Path used in error messages.
 */
export function validatePost(data, file) {
  const result = postSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  return deepFreeze(result.data);
}
