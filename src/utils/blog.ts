import { BLOG_LAUNCHED } from '../../scripts/blog/config.js';

/**
 * Whether the portfolio links to the Field Notes blog: only once it has
 * launched, from the same flag the blog build reads, so the navigation can
 * never point visitors at unlaunched (noindex, sample) pages.
 */
export const BLOG_IN_NAV: boolean = BLOG_LAUNCHED;

/**
 * The Field Notes blog for a page language. The blog is static pages outside
 * this app's router (scripts/build-blog.js), so links to it are plain
 * full-page links, never router navigation. Shared by the navbar, the sidebar
 * and the command palette.
 */
export function blogPathFor(language: string): string {
  return ['nl', 'tr'].includes(language) ? `/${language}/blog` : '/blog';
}

/**
 * The nav order with the blog in it: after the content pages and before
 * Contact, which stays last as the step a visitor ends on. 'blog' marks
 * where the blog link goes; without `showBlog` the pages come back as they are.
 */
export function withBlogBeforeContact<T extends { path: string }>(
  pages: readonly T[],
  showBlog: boolean,
): Array<T | 'blog'> {
  if (!showBlog) return [...pages];
  const contact = pages.findIndex((page) => page.path.endsWith('/contact'));
  const at = contact === -1 ? pages.length : contact;
  return [...pages.slice(0, at), 'blog', ...pages.slice(at)];
}
