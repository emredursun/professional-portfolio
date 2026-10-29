import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO.tsx';
import { localePrefix } from './hooks/useLanguageNavigate.tsx';

const BLOG_PATH = /^(\/(?:tr|nl))?\/blog(?:\/|$)/;

/**
 * The blog index to offer when a missing page sits under /blog, /tr/blog or
 * /nl/blog, or null for any other path. Firebase serves this app's 404 page
 * for unknown blog paths too, since the blog has no 404 page of its own.
 */
export function blogIndexFor(pathname: string): string | null {
  const match = BLOG_PATH.exec(pathname);
  return match ? `${match[1] ?? ''}/blog` : null;
}

const PRIMARY =
  'bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl hover:bg-yellow-500 transition-colors';
const SECONDARY =
  'border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-xl hover:border-yellow-400 dark:hover:border-neon-cyan transition-colors';

/**
 * Shown for any URL the router does not know. It used to redirect silently to
 * /about, which served the About page under arbitrary URLs with a 200 - a
 * soft 404 that search engines treat as duplicate content, and a dead end for
 * a visitor with a mistyped link who never learns the link was wrong.
 */
const NotFound: React.FC = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const prefix = localePrefix(pathname);
  const blogIndex = blogIndexFor(pathname);

  return (
    <section className="flex flex-col items-center justify-center text-center min-h-[60vh] px-6 animate-page-enter">
      <SEO title={t(blogIndex ? 'notFound.blogTitle' : 'notFound.title')} noindex />
      <p className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-4" aria-hidden="true">
        404 · {pathname}
      </p>
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
        {t(blogIndex ? 'notFound.blogTitle' : 'notFound.title')}
      </h2>
      <p className="text-gray-700 dark:text-gray-300 max-w-md mb-8">
        {t(blogIndex ? 'notFound.blogDescription' : 'notFound.description')}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {blogIndex ? (
          // A plain link: the blog is static pages outside this app's router.
          <a href={blogIndex} className={PRIMARY}>
            {t('notFound.blogIndex')}
          </a>
        ) : (
          <Link to={`${prefix}/about`} className={PRIMARY}>
            {t('notFound.home')}
          </Link>
        )}
        <Link to={`${prefix}/projects`} className={SECONDARY}>
          {t('notFound.projects')}
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
