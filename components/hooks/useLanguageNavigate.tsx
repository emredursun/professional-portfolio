import { useCallback } from 'react';
import { useLocation, useNavigate, NavigateOptions } from 'react-router-dom';

/** URL prefix of the current locale: '' for English, '/nl' or '/tr' otherwise. */
export function localePrefix(pathname: string): string {
  const match = pathname.match(/^\/(nl|tr)(?=\/|$)/);
  return match ? `/${match[1]}` : '';
}

/**
 * Custom hook that wraps React Router's useNavigate to automatically preserve
 * language context across all navigation actions.
 *
 * Supports three languages:
 * - EN (English): No prefix (default) - /about
 * - NL (Dutch): /nl prefix - /nl/about
 * - TR (Turkish): /tr prefix - /tr/about
 *
 * The locale is read from the current URL. It used to come from
 * useParams().lang, but the routes declare literal /nl and /tr prefixes rather
 * than a :lang parameter, so that was always undefined and every navigation
 * through this hook silently dropped Dutch and Turkish visitors back to English.
 *
 * @example
 * const navigate = useLanguageNavigate();
 * // On /nl/about:
 * navigate('/projects'); // -> /nl/projects
 */
export const useLanguageNavigate = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const prefix = localePrefix(pathname);

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      const normalizedPath = to.startsWith('/') ? to : `/${to}`;
      navigate(`${prefix}${normalizedPath}`, options);
    },
    [navigate, prefix],
  );
};
