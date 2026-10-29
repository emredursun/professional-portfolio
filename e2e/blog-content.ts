import fs from 'fs';
import path from 'path';

/**
 * What the built blog in dist/ actually contains, so the e2e specs test
 * whatever content is there (the samples today, real posts at launch) and
 * skip a case, with its reason, when the content has none. The rules behind
 * each case are covered with fixtures in the unit tests (tests/blog).
 */
const DIST = path.join(process.cwd(), 'dist');
const LANGUAGES = ['en', 'tr', 'nl'] as const;
export type Lang = (typeof LANGUAGES)[number];

const prefix = (lang: Lang) => (lang === 'en' ? '' : `${lang}/`);
export const blogPath = (lang: Lang) => `/${prefix(lang)}blog`;
const read = (file: string) => fs.readFileSync(path.join(DIST, file), 'utf8');
const exists = (file: string) => fs.existsSync(path.join(DIST, file));
const htmlIn = (dir: string) =>
  exists(dir)
    ? fs
        .readdirSync(path.join(DIST, dir))
        .filter((file) => file.endsWith('.html'))
        .map((file) => file.slice(0, -'.html'.length))
        .sort()
    : [];

/** Languages that have a blog. */
export const languages = LANGUAGES.filter((lang) => exists(`${prefix(lang)}blog.html`));

/** Post slugs per language (not the Now page). */
export function slugs(lang: Lang): string[] {
  return htmlIn(`${prefix(lang)}blog`).filter((slug) => slug !== 'now');
}

/** A post's path in a language, or undefined when it has none. */
export const postPath = (lang: Lang, slug = slugs(lang)[0]) =>
  slug ? `${blogPath(lang)}/${slug}` : undefined;

/** Topics with a page in a language. */
export const topics = (lang: Lang) => htmlIn(`${prefix(lang)}blog/topic`);

export const hasNow = (lang: Lang) => exists(`${prefix(lang)}blog/now.html`);

/** English posts with no version in `lang`: the index lists them as English. */
export const untranslated = (lang: Lang) =>
  slugs('en').filter((slug) => !slugs(lang).includes(slug));

/** The first English post whose article has a table of contents. */
export const postWithToc = () =>
  slugs('en').find((slug) => read(`blog/${slug}.html`).includes('class="toc"'));

/** The earliest and latest re-check dates (YYYY-MM-DD) on a page. */
export function recheckRange(urlPath: string): { first: string; last: string } {
  const dates = [...read(`${urlPath.slice(1)}.html`).matchAll(/data-recheck-by="([\d-]+)"/g)]
    .map((match) => match[1])
    .sort();
  return { first: dates[0], last: dates.at(-1)! };
}

/** Whether the English index lists a short note with this status. */
export const hasNoteWithStatus = (status: string) =>
  new RegExp(`class="note-item"[^]*?status-icon-${status}`).test(read('blog.html'));

if (!languages.includes('en') || slugs('en').length === 0) {
  throw new Error('e2e: no English blog in dist; run `npm run build` first');
}
