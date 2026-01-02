import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

//Supported languages
export const LANGUAGES = {
  en: { nativeName: 'English', flag: '🇺🇸' },
  nl: { nativeName: 'Nederlands', flag: '🇳🇱' },
  tr: { nativeName: 'Türkçe', flag: '🇹🇷' }
};

export const DEFAULT_LANGUAGE = 'en';

i18n
  // Load translations using http backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(LANGUAGES),
    
    // Namespaces for better organization
    ns: ['common', 'sidebar', 'about', 'resume', 'projects', 'contact'],
    defaultNS: 'common',

    // Language detection order
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React i18next options
    react: {
      useSuspense: false, // Disable suspense to avoid issues during SSR/initial load
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Show missing keys in development
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      // Only log in development (check for localhost or development mode)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn(`Missing translation: [${lng}][${ns}] ${key}`);
      }
    },
  });

// Helper function to get current language from URL
export const getLanguageFromUrl = (): string => {
  const path = window.location.pathname;
  const match = path.match(/^\/(nl|tr)/);
  return match ? match[1] : DEFAULT_LANGUAGE;
};

// Helper function to update URL when language changes
export const updateLanguageUrl = (language: string) => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;
  
  // Remove any existing language prefix
  let newPath = currentPath.replace(/^\/(nl|tr)/, '');
  
  // Add new language prefix if not English
  if (language !== DEFAULT_LANGUAGE) {
    newPath = `/${language}${newPath || ''}`;
  }
  
  // Ensure path starts with /
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  
  // Update URL without reloading
  const newUrl = `${newPath}${currentSearch}${currentHash}`;
  window.history.pushState({}, '', newUrl);
};

export default i18n;
