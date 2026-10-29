/**
 * The blog's entries for public/sitemap.xml.
 *
 * generate-sitemap.js runs in prebuild, before the blog is built, so this
 * reads the content itself (posts and Now logs need no dist). It lists the
 * same pages build-blog.js writes: each language's index, its posts, its
 * topic pages and its Now page. Nothing is listed until the blog launches,
 * so the committed sitemap stays unchanged before then.
 *
 * Dates come from the content (a post's last change, an index's newest
 * post), never the clock, and alternates name only the versions that exist,
 * with x-default on English, as each page's own hreflang links do.
 */

import { BLOG_LAUNCHED } from './config.js';
import { loadPosts } from './content.js';
import { loadNow } from './now.js';
import { TOPICS } from './schema.js';
import { BLOG_LANGUAGES } from './strings.js';
import { SITE_URL } from '../lib/route-meta.js';
import { blogUrl, lastChange, nowPath, postUrl, topicUrl } from './templates/format.js';

const newest = (dates) => [...dates].sort().at(-1);
const bySlug = (a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);

/** One entry; `urlFor(lang)` gives the page in each language it exists in. */
function entry(lang, lastmod, languages, urlFor) {
  return {
    loc: urlFor(lang),
    lastmod,
    alternates: [
      ...languages.map((other) => ({ lang: other, href: urlFor(other) })),
      { lang: 'x-default', href: urlFor('en') },
    ],
  };
}

function languageEntries(lang, { posts, languages, now }) {
  const own = posts.filter((post) => post.lang === lang).sort(bySlug);
  const withTopic = (language, topic) =>
    posts.some((post) => post.lang === language && post.topic === topic);
  const topics = TOPICS.filter((topic) => withTopic(lang, topic));
  const nowLanguages = languages.filter((language) => now[language]);
  return [
    entry(lang, newest(own.map(lastChange)), languages, blogUrl),
    ...own.map((post) =>
      entry(lang, lastChange(post), post.translations, (language) =>
        postUrl({ ...post, lang: language }),
      ),
    ),
    ...topics.map((topic) =>
      entry(
        lang,
        newest(own.filter((post) => post.topic === topic).map(lastChange)),
        languages.filter((language) => withTopic(language, topic)),
        (language) => topicUrl(language, topic),
      ),
    ),
    ...(now[lang]
      ? [
          entry(
            lang,
            now[lang][0].date,
            nowLanguages,
            (language) => `${SITE_URL}${nowPath(language)}`,
          ),
        ]
      : []),
  ];
}

/**
 * @param {{ contentDir: string, nowDir?: string, launched?: boolean }} options
 * @returns {{ loc: string, lastmod: string, alternates: { lang: string, href: string }[] }[]}
 */
export function blogSitemapEntries({ contentDir, nowDir, launched = BLOG_LAUNCHED }) {
  if (!launched) return [];
  const posts = loadPosts(contentDir);
  const languages = BLOG_LANGUAGES.filter((lang) => posts.some((post) => post.lang === lang));
  const now = loadNow(nowDir);
  return languages.flatMap((lang) => languageEntries(lang, { posts, languages, now }));
}
