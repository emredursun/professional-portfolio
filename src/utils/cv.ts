/**
 * The PDF CV for a page language, as written by scripts/generate-cv.js.
 * Shared by the sidebar button and the command palette.
 */
export function cvFileName(language: string): string {
  const lang = ['nl', 'tr'].includes(language) ? language : 'en';
  return `Emre-Dursun-CV-${lang}.pdf`;
}
