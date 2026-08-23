import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  overrideTitle?: boolean; // If true, don't append site name
}

/**
 * Upsert a <meta> tag: update the existing one if present, otherwise create it.
 *
 * We deliberately mutate the tags that already exist in index.html rather than
 * rendering new ones. index.html ships a static title/description/og set so that
 * scrapers which never execute JavaScript (LinkedIn, WhatsApp, Slack) still see
 * something; rendering a second copy from React would leave two of each tag in
 * the document and make the canonical answer ambiguous for crawlers.
 */
const upsertMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/** Upsert a <link> tag, keyed by rel (+ hreflang when present). */
const upsertLink = (rel: string, href: string, hreflang?: string) => {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const SEO: React.FC<SEOProps> = ({ title, description, overrideTitle = false }) => {
  const location = useLocation();
  const { t } = useTranslation();

  // Derive the language from the path rather than useParams(). useParams() only
  // resolves for components rendered inside a matched <Route>, so any SEO usage
  // outside the router's route tree would silently fall back to "en" and emit a
  // canonical pointing at the English URL — which would tell Google the NL/TR
  // pages are duplicates of the English one.
  const langMatch = location.pathname.match(/^\/(nl|tr)(?:\/|$)/);
  const currentLang = langMatch ? langMatch[1] : 'en';

  // Base URL
  const baseUrl = 'https://emredursun.nl';

  // Clean path without language prefix
  // e.g. /nl/about -> /about
  // e.g. /about -> /about
  const pathWithoutLang = location.pathname.replace(/^\/(nl|tr)/, '') || '/';

  // Construct Canonical URL (Self-referencing)
  // - If EN (default): https://emredursun.nl + path
  // - If Other: https://emredursun.nl + /lang + path
  const canonicalPath = currentLang === 'en'
    ? pathWithoutLang
    : `/${currentLang}${pathWithoutLang}`;

  const canonicalUrl = `${baseUrl}${canonicalPath === '//' ? '/' : canonicalPath}`.replace(/\/$/, '');

  // Dynamic Metadata defaults
  const siteTitle = "Emre Dursun — QA Consultant, Pega & Tricentis Tosca";
  const metaTitle = title
    ? (overrideTitle ? title : `${title} | Emre Dursun`)
    : siteTitle;

  const metaDescription = description || t('meta.description', "QA Consultant specializing in Pega & Tricentis Tosca test automation, ISTQB® Certified.");

  const enHref = `${baseUrl}${pathWithoutLang}`.replace(/\/$/, '') || baseUrl;
  const nlHref = `${baseUrl}/nl${pathWithoutLang}`.replace(/\/$/, '');
  const trHref = `${baseUrl}/tr${pathWithoutLang}`.replace(/\/$/, '');

  useEffect(() => {
    document.title = metaTitle;

    upsertMeta('meta[name="title"]', 'name', 'title', metaTitle);
    upsertMeta('meta[name="description"]', 'name', 'description', metaDescription);

    // Canonical + hreflang: the pair that tells Google these three URLs are the
    // same page in different languages rather than duplicate content.
    upsertLink('canonical', canonicalUrl);
    upsertLink('alternate', enHref, 'en');
    upsertLink('alternate', nlHref, 'nl');
    upsertLink('alternate', trHref, 'tr');
    upsertLink('alternate', enHref, 'x-default');

    // Open Graph / Twitter: keep the per-page values in sync with the static
    // fallbacks already present in index.html.
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', metaTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', metaDescription);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metaTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metaDescription);
  }, [metaTitle, metaDescription, canonicalUrl, enHref, nlHref, trHref]);

  return null;
};

export default SEO;
