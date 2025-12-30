import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useLocation } from 'react-router-dom';

/**
 * LanguageMeta Component
 * 
 * Manages SEO meta tags for multi-language support:
 * - Adds hreflang tags for each language version
 * - Sets html lang attribute based on current language
 * - Provides x-default tag for international users
 * 
 * @example
 * Current URL: /nl/about/test-automation
 * 
 * Generates:
 * <link rel="alternate" hreflang="en" href="https://emredursun.nl/about/test-automation" />
 * <link rel="alternate" hreflang="nl" href="https://emredursun.nl/nl/about/test-automation" />
 * <link rel="alternate" hreflang="tr" href="https://emredursun.nl/tr/about/test-automation" />
 * <link rel="alternate" hreflang="x-default" href="https://emredursun.nl/about/test-automation" />
 * <html lang="nl" />
 */
const LanguageMeta: React.FC = () => {
  const { lang } = useParams<{ lang?: string }>();
  const location = useLocation();
  
  // Default to English if no language parameter
  const currentLang = lang || 'en';
  
  // Base URL for your portfolio (update this to your actual domain)
  const baseUrl = 'https://emredursun.nl';
  
  // Remove language prefix from path to get base path
  const pathWithoutLang = location.pathname.replace(/^\/(nl|tr)/, '');
  
  return (
    <Helmet>
      {/* hreflang tags for each language version */}
      <link 
        rel="alternate" 
        hrefLang="en" 
        href={`${baseUrl}${pathWithoutLang}`} 
      />
      <link 
        rel="alternate" 
        hrefLang="nl" 
        href={`${baseUrl}/nl${pathWithoutLang}`} 
      />
      <link 
        rel="alternate" 
        hrefLang="tr" 
        href={`${baseUrl}/tr${pathWithoutLang}`} 
      />
      
      {/* x-default points to English version for international users */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${baseUrl}${pathWithoutLang}`} 
      />
      
      {/* Set HTML lang attribute */}
      <html lang={currentLang} />
    </Helmet>
  );
};

export default LanguageMeta;
