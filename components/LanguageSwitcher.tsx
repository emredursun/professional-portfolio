import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LANGUAGES } from '../i18n.ts';

interface LanguageSwitcherProps {
  isMobileView?: boolean;
  theme?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isMobileView = false, theme = 'light' }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = i18n.language || 'en';

  const handleLanguageChange = (lang: string) => {
    // 1. Close dropdown immediately
    setIsOpen(false);

    // 2. Calculate new path with language prefix
    const { pathname } = location;
    
    // Remove current language prefix if exists
    let pathWithoutLang = pathname.replace(/^\/(nl|tr)/, '');
    
    // Add new language prefix (unless English)
    const newPath = lang === 'en' 
      ? pathWithoutLang || '/about'
      : `/${lang}${pathWithoutLang || '/about'}`;

    // 3. Change language in i18n
    i18n.changeLanguage(lang).catch(err => {
        console.error('Failed to load language:', err);
    });

    // 4. Navigate to new path with React Router
    navigate(newPath, { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Trigger Button - Matches ThemeSwitcher styling exactly */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg border transition-all duration-300
          ${theme === 'light' 
            ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' 
            : 'bg-[#1e1e1e] text-gray-300 border-gray-700 hover:bg-gray-800'}
          hover:scale-110 hover:rotate-12 hover:shadow-xl
        `}
        whileTap={{ scale: 0.95 }}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-xl">{LANGUAGES[currentLanguage as keyof typeof LANGUAGES]?.flag || '🌐'}</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 right-full mr-2 min-w-[180px] bg-white dark:bg-black border border-gray-200 dark:border-neon-border rounded-xl shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)] overflow-hidden backdrop-blur-xl"
          >
            {Object.entries(LANGUAGES).map(([lang, { nativeName, flag }]) => (
              <motion.button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                  currentLanguage === lang
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl">{flag}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{nativeName}</div>
                  <div className="text-xs opacity-70 uppercase">{lang}</div>
                </div>
                {currentLanguage === lang && (
                  <i className="fas fa-check text-sm"></i>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
