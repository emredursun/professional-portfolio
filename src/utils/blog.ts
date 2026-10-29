/**
 * The Field Notes blog for a page language. The blog is static pages outside
 * this app's router (scripts/build-blog.js), so links to it are plain
 * full-page links, never router navigation. Shared by the navbar, the sidebar
 * and the command palette.
 */
export function blogPathFor(language: string): string {
  return ['nl', 'tr'].includes(language) ? `/${language}/blog` : '/blog';
}
