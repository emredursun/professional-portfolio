/**
 * Per-route <head> metadata, computed at build time.
 *
 * The site is a single-page app: every URL used to receive the same
 * index.html, and the right title, description and canonical only appeared
 * once React ran. Google renders JavaScript, but LinkedIn, WhatsApp, Slack and
 * X do not - every shared project or service link showed the generic card.
 * scripts/prerender-routes.js writes one HTML file per route with the head
 * from here.
 *
 * The rules mirror components/SEO.tsx and the pages that call it (About,
 * Resume, Projects, Contact) so the static head and the one React maintains
 * after load are identical; e2e/prerender.spec.ts compares the two.
 */

import fs from 'fs';
import path from 'path';

export const SITE_URL = 'https://emredursun.nl';
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
const PORTRAIT_ID = `${SITE_URL}/#portrait`;

export const LANGUAGES = ['en', 'nl', 'tr'];
const NAMESPACES = ['common', 'about', 'resume', 'projects', 'contact'];
export const OG_LOCALES = { en: 'en_US', nl: 'nl_NL', tr: 'tr_TR' };
// The short name shown above a search result; WebSite.name in index.html matches.
export const SITE_NAME = 'Emre Dursun';
export const SOCIAL_IMAGE = {
  url: `${SITE_URL}/images/social-share.png`,
  width: 1200,
  height: 630,
  alt: 'Emre Dursun, QA Consultant: Pega, Tricentis Tosca and Playwright',
};

export const BLOCK_START = '<!-- route-meta:start -->';
export const BLOCK_END = '<!-- route-meta:end -->';

/** Read every locale namespace the metadata draws on. */
export function loadLocales(root) {
  return Object.fromEntries(
    LANGUAGES.map((lang) => [
      lang,
      Object.fromEntries(
        NAMESPACES.map((ns) => [
          ns,
          JSON.parse(
            fs.readFileSync(path.join(root, 'public', 'locales', lang, `${ns}.json`), 'utf8'),
          ),
        ]),
      ),
    ]),
  );
}

/** i18next-style lookup with the same English fallback (fallbackLng: 'en'). */
function lookup(locales, lang, ns, keyPath) {
  const read = (source) =>
    keyPath.split('.').reduce((node, key) => (node == null ? undefined : node[key]), source);
  const value = read(locales[lang][ns]);
  return typeof value === 'string' && value !== '' ? value : read(locales.en[ns]);
}

/** Path of a route in a language: '/about' -> '/nl/about'; '' -> '/' or '/nl'. */
export function localizedPath(lang, route) {
  if (lang === 'en') return route || '/';
  return `/${lang}${route}`;
}

/** Absolute URL, with no trailing slash on the home page (as SEO.tsx emits). */
function urlFor(lang, route) {
  const pathname = localizedPath(lang, route);
  return pathname === '/' ? SITE_URL : `${SITE_URL}${pathname}`;
}

/**
 * The project a /projects/<slug> page is about, as a schema.org node: source
 * code when the repository is public, otherwise a creative work. One @id per
 * project, shared by its three language versions.
 */
function projectNode(project, { title, description }) {
  const live = project.url && project.url !== '#' ? project.url : null;
  return {
    '@type': project.github ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': `${SITE_URL}/projects/${project.slug}#project`,
    name: title.replace(/ \| Emre Dursun$/, ''),
    description,
    creator: { '@id': PERSON_ID },
    dateCreated: String(project.year),
    keywords: project.technologies.join(', '),
    ...(project.image?.startsWith('/') ? { image: `${SITE_URL}${project.image}` } : {}),
    ...(project.github ? { codeRepository: project.github } : {}),
    ...(live && live !== project.github ? { sameAs: live } : {}),
  };
}

function titleAndDescription({ route, lang, constants, locales }) {
  const [, section, slug] = route.split('/');
  const t = (ns, key) => lookup(locales, lang, ns, key);

  if (route === '' || (section === 'about' && !slug)) {
    // About is the landing page: full site title, no "| Emre Dursun" suffix.
    // "/" renders About once JavaScript runs and Google shows the rendered
    // description for the domain, so the static home head says the same.
    return { title: t('common', 'meta.title'), description: t('about', 'meta.description') };
  }
  if (section === 'about') {
    const key = constants.SERVICE_TRANSLATION_KEYS[slug];
    return {
      title: `${t('about', `services.${key}.title`)} | Emre Dursun`,
      description: t('about', `services.${key}.description`),
    };
  }
  if (section === 'quality') {
    // Its strings live in common.json, so the page costs no extra locale file.
    return {
      title: `${t('common', 'quality.title')} | Emre Dursun`,
      description: t('common', 'quality.meta.description'),
    };
  }
  if (section === 'projects' && slug) {
    const project = constants.PROJECTS.find((item) => item.slug === slug);
    const key = constants.PROJECT_TRANSLATION_KEYS[slug];
    const translated = (field) =>
      (key ? t('projects', `projects.${key}.${field}`) : undefined) || project[field];
    return {
      title: `${translated('title')} | Emre Dursun`,
      description: translated('description'),
    };
  }
  return {
    // meta.title, not the heading: headings are split in two for styling
    // ("Bana" + "Ulaşın"), and half of one made a poor title link.
    title: `${t(section, 'meta.title')} | Emre Dursun`,
    description: t(section, 'meta.description'),
  };
}

/**
 * Everything the head needs for one route in one language.
 *
 * @param {{ route: string, lang: string, constants: object, locales: object }} input
 */
export function routeMeta({ route, lang, constants, locales }) {
  const { title, description } = titleAndDescription({ route, lang, constants, locales });
  if (!title || !description || /undefined/.test(title)) {
    throw new Error(`No title/description for ${localizedPath(lang, route)}`);
  }

  const isProfile = route === '' || route === '/about';
  const [, section, slug] = route.split('/');
  const project =
    section === 'projects' && slug ? constants.PROJECTS.find((item) => item.slug === slug) : null;
  return {
    route,
    lang,
    title,
    description,
    url: urlFor(lang, route),
    // The home page (/, /nl, /tr) redirects to About in the app and has no
    // canonical today; keep it that way rather than change what ranks.
    canonical: route === '' ? null : urlFor(lang, route),
    alternates: [
      ...LANGUAGES.map((hreflang) => ({ hreflang, href: urlFor(hreflang, route) })),
      { hreflang: 'x-default', href: urlFor('en', route) },
    ],
    ogLocale: OG_LOCALES[lang],
    ogLocaleAlternates: LANGUAGES.filter((other) => other !== lang).map(
      (other) => OG_LOCALES[other],
    ),
    pageType: isProfile ? 'ProfilePage' : 'WebPage',
    ...(project ? { mainEntity: projectNode(project, { title, description }) } : {}),
  };
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * The page's own schema.org node, linked into the site-wide graph in
 * index.html by @id. ProfilePage is Google's type for an "About me" page
 * whose main entity is one person; other pages are WebPages about that
 * person.
 */
export function pageNode(meta, { dateModified } = {}) {
  const node = {
    '@context': 'https://schema.org',
    '@type': meta.pageType,
    // "https://emredursun.nl/#webpage" on the home page, like the other site ids.
    '@id': meta.url === SITE_URL ? `${SITE_URL}/#webpage` : `${meta.url}#webpage`,
    url: meta.url,
    name: meta.title,
    description: meta.description,
    inLanguage: meta.lang,
    isPartOf: { '@id': WEBSITE_ID },
  };
  if (meta.pageType === 'ProfilePage') {
    node.mainEntity = { '@id': PERSON_ID };
    node.primaryImageOfPage = { '@id': PORTRAIT_ID };
    if (dateModified) node.dateModified = dateModified;
  } else {
    node.about = { '@id': PERSON_ID };
    if (meta.mainEntity) node.mainEntity = meta.mainEntity;
  }
  return node;
}

/**
 * The tags between the route-meta markers. With `node` it also embeds the
 * page's JSON-LD; index.html's checked-in default block is rendered without
 * one (see tests/route-meta.test.ts).
 */
export function renderHeadBlock(meta, node) {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    ...(meta.canonical ? [`<link rel="canonical" href="${meta.canonical}" />`] : []),
    ...meta.alternates.map(
      ({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${href}" />`,
    ),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="${meta.ogLocale}" />`,
    ...meta.ogLocaleAlternates.map(
      (locale) => `<meta property="og:locale:alternate" content="${locale}" />`,
    ),
    `<meta property="og:url" content="${meta.url}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${SOCIAL_IMAGE.url}" />`,
    `<meta property="og:image:width" content="${SOCIAL_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${SOCIAL_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(SOCIAL_IMAGE.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${SOCIAL_IMAGE.url}" />`,
  ];
  if (node) {
    // "<" escaped so no string in the data can close the script element.
    const json = JSON.stringify(node).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json">${json}</script>`);
  }
  return [BLOCK_START, ...tags, BLOCK_END]
    .map((line) => `    ${line}`)
    .join('\n')
    .trimStart();
}
