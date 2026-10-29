/**
 * What stops the blog from launching, and what it only warns about.
 *
 * Blocking, on every launched build (the blog build, the sitemap and
 * llms.txt all call assertLaunchable):
 * - content marked `placeholder: true` (the samples, an unwritten draft, a
 *   placeholder Now entry), so a sample can never ship;
 * - a language with no published post: the portfolio's navigation links to
 *   /tr/blog and /nl/blog, which the build writes only for languages that
 *   have posts (ADR: the blog launches in all three languages).
 *
 * Warning only: a translation the English version has outgrown. Its page
 * already tells readers "the English version has changed"; failing the
 * build instead would block every deploy, portfolio fixes included, after
 * any English correction until both translations catch up.
 */

import { BLOG_LANGUAGES } from './strings.js';

/**
 * @param {{ posts: object[], now: Record<string, readonly { placeholder?: true }[]> }} content
 * @returns {string[]} One readable line per problem; empty when ready.
 */
export function launchProblems({ posts, now }) {
  const withPosts = new Set(posts.map((post) => post.lang));
  return [
    ...posts.filter((post) => post.placeholder).map((post) => `${post.file} is a placeholder`),
    ...BLOG_LANGUAGES.filter((lang) => !withPosts.has(lang)).map(
      (lang) =>
        `no published ${lang} post: the blog launches in every language (/${lang}/blog must exist)`,
    ),
    ...Object.entries(now)
      .filter(([, entries]) => entries.some((entry) => entry.placeholder))
      .map(([lang]) => `blog/now/${lang}.md has a placeholder entry`),
  ];
}

/**
 * Worth fixing, not worth failing a deploy for: translations the English
 * version has outgrown (their pages say so to readers).
 * @param {{ posts: object[] }} content
 * @returns {string[]}
 */
export function launchWarnings({ posts }) {
  return posts
    .filter((post) => post.englishIsNewer)
    .map(
      (post) => `${post.file} follows an older English version (update it and translation.from)`,
    );
}

/**
 * Throws, listing every problem, unless the content can launch. Every
 * reader of launched content calls it: the blog build, and the sitemap and
 * llms.txt, which run before the build and would otherwise list samples.
 * @param {Parameters<typeof launchProblems>[0]} content
 */
export function assertLaunchable(content) {
  const problems = launchProblems(content);
  if (problems.length > 0) {
    throw new Error(`blog: not ready to launch:\n- ${problems.join('\n- ')}`);
  }
}
