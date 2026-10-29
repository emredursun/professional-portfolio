/**
 * What stops the blog from launching: content marked `placeholder: true`
 * (the samples, a placeholder Now entry) and translations the English version
 * has outgrown. build-blog.js refuses a launched build while any remain, so
 * launch day cannot ship a sample or a stale translation by accident.
 */

/**
 * @param {{ posts: object[], now: Record<string, readonly { placeholder?: true }[]> }} content
 * @returns {string[]} One readable line per problem; empty when ready.
 */
export function launchProblems({ posts, now }) {
  return [
    ...posts.filter((post) => post.placeholder).map((post) => `${post.file} is a placeholder`),
    ...posts
      .filter((post) => post.englishIsNewer)
      .map(
        (post) => `${post.file} follows an older English version (update it and translation.from)`,
      ),
    ...Object.entries(now)
      .filter(([, entries]) => entries.some((entry) => entry.placeholder))
      .map(([lang]) => `blog/now/${lang}.md has a placeholder entry`),
  ];
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
