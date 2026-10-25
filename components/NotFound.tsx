import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from './SEO.tsx';
import { localePrefix } from './hooks/useLanguageNavigate.tsx';

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

  return (
    <section className="flex flex-col items-center justify-center text-center min-h-[60vh] px-6 animate-page-enter">
      <SEO title={t('notFound.title')} noindex />
      <p className="font-mono text-sm text-gray-600 dark:text-gray-400 mb-4" aria-hidden="true">
        404 · {pathname}
      </p>
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
        {t('notFound.title')}
      </h2>
      <p className="text-gray-700 dark:text-gray-300 max-w-md mb-8">{t('notFound.description')}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to={`${prefix}/about`}
          className="bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl hover:bg-yellow-500 transition-colors"
        >
          {t('notFound.home')}
        </Link>
        <Link
          to={`${prefix}/projects`}
          className="border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-xl hover:border-yellow-400 dark:hover:border-neon-cyan transition-colors"
        >
          {t('notFound.projects')}
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
