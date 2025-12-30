import { useNavigate, useParams, NavigateOptions } from 'react-router-dom';

/**
 * Custom hook that wraps React Router's useNavigate to automatically preserve
 * language context across all navigation actions.
 * 
 * Supports three languages:
 * - EN (English): No prefix (default) - /about
 * - NL (Dutch): /nl prefix - /nl/about
 * - TR (Turkish): /tr prefix - /tr/about
 * 
 * @returns A navigate function that automatically adds language prefix
 * 
 * @example
 * const navigate = useLanguageNavigate();
 * 
 * // If current language is Dutch (URL: /nl/about)
 * navigate('/projects'); // Navigates to /nl/projects
 * 
 * // If current language is English (URL: /about)
 * navigate('/projects'); // Navigates to /projects
 */
export const useLanguageNavigate = () => {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang?: string }>();
  
  // Default to English if no language parameter
  const currentLang = lang || 'en';
  
  return (to: string, options?: NavigateOptions) => {
    // Don't add prefix for English (default language)
    const prefix = currentLang === 'en' ? '' : `/${currentLang}`;
    
    // Ensure the path starts with '/'
    const normalizedPath = to.startsWith('/') ? to : `/${to}`;
    
    // Combine prefix with target path
    const fullPath = `${prefix}${normalizedPath}`;
    
    navigate(fullPath, options);
  };
};
