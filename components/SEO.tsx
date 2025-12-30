import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  overrideTitle?: boolean; // If true, don't append site name
}

const SEO: React.FC<SEOProps> = ({ title, description, overrideTitle = false }) => {
  const { lang } = useParams<{ lang?: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Default to English if no language parameter
  const currentLang = lang || 'en';
  
  // Base URL
  const baseUrl = 'https://emredursun.nl';
  
  // Clean path without language prefix
  // e.g. /nl/about -> /about
  // e.g. /about -> /about
  const pathWithoutLang = location.pathname.replace(/^\/(nl|tr)/, '') || '/';
  
  // Construct Canonical URL (Self-referencing)
  // Logic: 
  // - If EN (default): https://emredursun.nl + path
  // - If Other: https://emredursun.nl + /lang + path
  const canonicalPath = currentLang === 'en' 
    ? pathWithoutLang 
    : `/${currentLang}${pathWithoutLang}`;
    
  const canonicalUrl = `${baseUrl}${canonicalPath === '//' ? '/' : canonicalPath}`.replace(/\/$/, ''); // Remove trailing slash unless root

  // Dynamic Metadata defaults
  const siteTitle = "Emre Dursun — ISTQB® Certified Full-Stack Automation Engineer";
  const metaTitle = title 
    ? (overrideTitle ? title : `${title} | Emre Dursun`) 
    : siteTitle;
    
  const metaDescription = description || t('meta.description', "ISTQB® Certified Full-Stack Automation Engineer specializing in automation frameworks, CI/CD, API, UI & DB testing.");

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="title" content={metaTitle} />
      <meta name="description" content={metaDescription} />
      <html lang={currentLang} />

      {/* Canonical URL - Vital for SEO to avoid duplicate content penalty */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Hreflang Tags - Tell Google about language variations of THIS specific page */}
      <link 
        rel="alternate" 
        hrefLang="en" 
        href={`${baseUrl}${pathWithoutLang}`.replace(/\/$/, '')} 
      />
      <link 
        rel="alternate" 
        hrefLang="nl" 
        href={`${baseUrl}/nl${pathWithoutLang}`.replace(/\/$/, '')} 
      />
      <link 
        rel="alternate" 
        hrefLang="tr" 
        href={`${baseUrl}/tr${pathWithoutLang}`.replace(/\/$/, '')} 
      />
      
      {/* x-default: fallback for unmatched languages (points to EN) */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${baseUrl}${pathWithoutLang}`.replace(/\/$/, '')} 
      />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content="https://emredursun.nl/images/social-share.png" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={metaTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content="https://emredursun.nl/images/social-share.png" />
    </Helmet>
  );
};

export default SEO;
