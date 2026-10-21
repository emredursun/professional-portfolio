#!/usr/bin/env node

/**
 * Sitemap Generator for Professional Portfolio
 *
 * This script automatically generates a sitemap.xml file with:
 * - Multi-language support (EN, TR, NL) with hreflang alternates
 * - Per-route lastmod driven by the content that route actually renders
 *
 * lastmod is deliberately NOT the current time. Each route is hashed over the
 * source files it renders from; the timestamp only moves when that hash moves,
 * and is otherwise carried over from sitemap-state.json. Two reasons:
 *
 *   1. Restamping every route on every build left public/sitemap.xml showing as
 *      modified after any `npm run build`, which is noise in every diff.
 *   2. A lastmod that always says "now" tells crawlers nothing. Google treats a
 *      sitemap whose dates never correspond to real edits as unreliable and
 *      falls back to ignoring the signal.
 *
 * Hashes are computed over line-ending-normalised content, so a Windows
 * checkout and a Linux CI runner agree.
 *
 * Run this script whenever you update your portfolio content.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *   or via npm: npm run generate:sitemap
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://emredursun.nl';
const OUTPUT_PATH = path.join(ROOT, 'public/sitemap.xml');
const STATE_PATH = path.join(__dirname, 'sitemap-state.json');

// Supported languages
const LANGUAGES = ['en', 'tr', 'nl'];

// Routes to publish, in sitemap order
const ROUTES = ['', '/about', '/resume', '/projects', '/contact'];

/**
 * Locale namespace each route renders from. Combined with the shared sources
 * below to decide whether that route's content has actually changed.
 */
const ROUTE_NAMESPACES = {
    '': 'about',
    '/about': 'about',
    '/resume': 'resume',
    '/projects': 'projects',
    '/contact': 'contact',
};

/** Files that affect every route: shared data and the labels in the chrome. */
const SHARED_SOURCES = [
    'constants.tsx',
    ...LANGUAGES.map(lang => `public/locales/${lang}/common.json`),
    ...LANGUAGES.map(lang => `public/locales/${lang}/sidebar.json`),
];

/**
 * Source files whose content determines a route's lastmod
 */
export function sourcesForRoute(route) {
    const namespace = ROUTE_NAMESPACES[route];
    const localeFiles = LANGUAGES.map(lang => `public/locales/${lang}/${namespace}.json`);
    return [...SHARED_SOURCES, ...localeFiles];
}

/**
 * Hash a route's sources. Line endings are normalised so the same content
 * hashes identically on Windows and on a Linux CI runner.
 */
export function hashRoute(route) {
    const hash = crypto.createHash('sha256');

    sourcesForRoute(route).sort().forEach(relativePath => {
        const absolute = path.join(ROOT, relativePath);
        if (!fs.existsSync(absolute)) {
            throw new Error(`Sitemap source is missing: ${relativePath}`);
        }
        const content = fs.readFileSync(absolute, 'utf8').replace(/\r\n/g, '\n');
        hash.update(`${relativePath}\0${content}\0`);
    });

    return hash.digest('hex');
}

/**
 * Read the previous run's hashes and timestamps
 */
export function readState(statePath = STATE_PATH) {
    try {
        return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch {
        return {};
    }
}

/**
 * @typedef {{ hash: string, lastmod?: string }} RouteState
 */

/**
 * Pure core of the lastmod decision: given the previous state, the current
 * per-route hashes and "now", reuse a stored timestamp whenever that route's
 * hash is unchanged.
 *
 * @param {Record<string, RouteState>} previous
 * @param {Record<string, string>} hashes
 * @param {string} now
 * @returns {{ lastMod: Record<string, string>, nextState: Record<string, RouteState>, changed: string[] }}
 */
export function computeLastMod(previous, hashes, now) {
    /** @type {Record<string, string>} */
    const lastMod = {};
    /** @type {Record<string, RouteState>} */
    const nextState = {};
    /** @type {string[]} */
    const changed = [];

    Object.entries(hashes).forEach(([route, hash]) => {
        const stored = previous[route];

        if (stored && stored.hash === hash && stored.lastmod) {
            lastMod[route] = stored.lastmod;
        } else {
            lastMod[route] = now;
            changed.push(route || '/');
        }

        nextState[route] = { hash, lastmod: lastMod[route] };
    });

    return { lastMod, nextState, changed };
}

/**
 * Resolve each route's lastmod against the files on disk and the saved state.
 */
function resolveLastMod(statePath, now) {
    const hashes = Object.fromEntries(ROUTES.map(route => [route, hashRoute(route)]));
    return computeLastMod(readState(statePath), hashes, now);
}

/**
 * Generate hreflang links for a given path
 */
function generateHreflangLinks(basePath = '') {
    const links = LANGUAGES.map(lang => {
        const href = lang === 'en' ? `${SITE_URL}${basePath || '/'}` : `${SITE_URL}/${lang}${basePath}`;
        return `        <xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />`;
    });
    // Add x-default pointing to English
    links.push(`        <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${basePath || '/'}" />`);
    return links.join('\n');
}

/**
 * Generate URL entry with hreflang links
 */
function generateUrlEntry(url, priority, changefreq, lastmod, basePath = '') {
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${generateHreflangLinks(basePath)}
  </url>`;
}

/**
 * Generate sitemap XML content
 */
export function generateSitemap(lastMod) {
    const urls = [];

    // Generate URLs for each language and route
    ROUTES.forEach(route => {
        const lastModified = lastMod[route];
        // Home carries the highest weight; content pages sit just below it.
        const priority = route === '' ? '1.0' : '0.8';
        const changefreq = route === '' ? 'weekly' : 'monthly';

        // English (Default)
        urls.push(generateUrlEntry(`${SITE_URL}${route || '/'}`, priority, changefreq, lastModified, route));

        // Other languages
        ['tr', 'nl'].forEach(lang => {
            // Avoid double slash for root path if route is empty
            const langPath = route ? `/${lang}${route}` : `/${lang}`;
            urls.push(generateUrlEntry(`${SITE_URL}${langPath}`, priority, changefreq, lastModified, route));
        });
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

/**
 * Write a file only when its content would actually change, so an unchanged
 * build leaves both the file and its mtime alone.
 */
export function writeIfChanged(filePath, content) {
    const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
    if (existing !== null && existing.replace(/\r\n/g, '\n') === content.replace(/\r\n/g, '\n')) {
        return false;
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

/**
 * Regenerate the sitemap and its state file. Paths and clock are injectable,
 * so the whole flow can run against a temporary directory in tests.
 *
 * @param {{ outputPath?: string, statePath?: string, now?: string }} [options]
 * @returns {{ sitemapWritten: boolean, changed: string[], urls: number, alternates: number }}
 */
export function writeSitemap({ outputPath = OUTPUT_PATH, statePath = STATE_PATH, now = new Date().toISOString() } = {}) {
    const { lastMod, nextState, changed } = resolveLastMod(statePath, now);
    const sitemapContent = generateSitemap(lastMod);

    const sitemapWritten = writeIfChanged(outputPath, sitemapContent);
    writeIfChanged(statePath, `${JSON.stringify(nextState, null, 2)}\n`);

    return {
        sitemapWritten,
        changed,
        urls: (sitemapContent.match(/<loc>/g) || []).length,
        alternates: (sitemapContent.match(/xhtml:link/g) || []).length,
    };
}

function main() {
    try {
        const { sitemapWritten, changed, urls, alternates } = writeSitemap();

        console.log('✅ Sitemap generated successfully!');
        console.log(`📍 Location: ${OUTPUT_PATH}`);
        console.log(`🔗 URL: ${SITE_URL}/sitemap.xml`);
        console.log(`📄 Total URLs: ${urls}`);
        console.log(`🔀 hreflang alternates: ${alternates}`);
        console.log(`🌍 Languages: English (default), Turkish, Dutch`);

        if (changed.length) {
            console.log(`📅 Restamped ${changed.length} route(s) with changed content: ${changed.join(', ')}`);
        } else {
            console.log('📅 No content changed - existing lastmod timestamps kept');
        }
        console.log(sitemapWritten ? '✍️  sitemap.xml updated' : '💤 sitemap.xml already current - not rewritten');

    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
        process.exit(1);
    }
}

// Run only when executed directly, so tests can import the functions above.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
