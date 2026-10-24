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

const DEFAULT_LANGUAGE = 'en';

/**
 * The URL decides the language (/nl, /tr, otherwise English), so initialise
 * with it. Left to the detector, i18next started from localStorage or the
 * browser language, fetched that locale plus the English fallback, and then
 * App switched to the URL's language and fetched a third: up to 18 locale
 * files and an extra language change on every first load instead of 6.
 */
const initialLanguage = window.location.pathname.match(/^\/(nl|tr)(?=\/|$)/)?.[1] ?? DEFAULT_LANGUAGE;

i18n
  // Load translations using http backend
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    lng: initialLanguage,
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
