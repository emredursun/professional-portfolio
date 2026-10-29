import fs from 'fs';
import path from 'path';
import { loadPosts } from '../scripts/blog/content.js';
import { loadNow } from '../scripts/blog/now.js';

/**
 * What the blog's source content holds (the samples today, real posts at
 * launch), so the e2e specs test whatever content there is and skip a case,
 * with its reason, only when the content has none. Expectations come from
 * the source, never from dist: a rendering bug that drops something must
 * fail a test, not skip it. The rules behind each case are covered with
 * fixtures in the unit tests (tests/blog).
 */
const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const LANGUAGES = ['en', 'tr', 'nl'] as const;
type Lang = (typeof LANGUAGES)[number];

const posts = loadPosts(path.join(ROOT, 'blog', 'content'));
const now = loadNow(path.join(ROOT, 'blog', 'now'));
const prefix = (lang: Lang) => (lang === 'en' ? '' : `${lang}/`);
export const blogPath = (lang: Lang) => `/${prefix(lang)}blog`;
/** The portfolio's About page in `lang`, where the nav links the blog. */
export const aboutPath = (lang: Lang) => `/${prefix(lang)}about`;
const postsIn = (lang: Lang) =>
  posts.filter((post) => post.lang === lang).sort((a, b) => (a.slug < b.slug ? -1 : 1));

/** Languages that have published posts, so a blog. */
export const languages = LANGUAGES.filter((lang) => postsIn(lang).length > 0);

/** Post slugs per language. */
export const slugs = (lang: Lang): string[] => postsIn(lang).map((post) => post.slug);

/** A post's path in a language, or undefined when it has none. */
export const postPath = (lang: Lang, slug = slugs(lang)[0]) =>
  slug ? `${blogPath(lang)}/${slug}` : undefined;

/** Topics with a page in a language: those its posts are on. */
export const topics = (lang: Lang) => [...new Set(postsIn(lang).map((post) => post.topic))].sort();

export const hasNow = (lang: Lang) => Boolean(now[lang]) && languages.includes(lang);

/** English posts with no version in `lang`: the index lists them as English. */
export const untranslated = (lang: Lang) =>
  slugs('en').filter((slug) => !slugs(lang).includes(slug));

/** Whether the English blog has short notes. */
export const hasNotes = postsIn('en').some((post) => post.kind === 'note');

/** The first English post with a section heading, which gets a table of contents. */
export const postWithToc = () => postsIn('en').find((post) => /^##\s/m.test(post.body))?.slug;

/** The earliest and latest re-check dates (YYYY-MM-DD) of the English posts. */
export function recheckRange(): { first: string; last: string } {
  const dates = postsIn('en')
    .map((post) => post.evidence.recheckedAt)
    .sort();
  if (dates.length === 0) throw new Error('e2e: no English post with evidence');
  return { first: dates[0], last: dates.at(-1)! };
}

// The build must have written every language the content has; a missing one
// is a failure here, never a silently skipped block of tests.
for (const lang of languages) {
  if (!fs.existsSync(path.join(DIST, `${prefix(lang)}blog.html`))) {
    throw new Error(
      `e2e: dist has no ${blogPath(lang)} although the content has ${lang} posts; run \`npm run build\``,
    );
  }
}
if (!languages.includes('en')) throw new Error('e2e: the content has no English post');
