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
