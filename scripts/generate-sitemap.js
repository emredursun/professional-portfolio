#!/usr/bin/env node

/**
 * Sitemap Generator for Professional Portfolio
 * 
 * This script automatically generates a sitemap.xml file with:
 * - Multi-language support (EN, TR, NL) with hreflang alternates
 * - Current timestamp for lastmod
 * 
 * Run this script whenever you update your portfolio content.
 * 
 * Usage:
 *   node scripts/generate-sitemap.js
 *   or via npm: npm run generate:sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = 'https://emredursun.nl';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Supported languages
const LANGUAGES = ['en', 'tr', 'nl'];

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
function generateUrlEntry(url, priority, changefreq, lastmod) {
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    </url>`;
}

/**
 * Generate sitemap XML content
 */
function generateSitemap() {
    const urls = [];

    // Main page (English - default)
    // Define all routes
    const routes = ['', '/about', '/resume', '/projects', '/contact'];

    // Generate URLs for each language and route
    routes.forEach(route => {
        const lastMod = new Date().toISOString();

        // English (Default)
        urls.push(generateUrlEntry(`${SITE_URL}${route}`, '0.9', 'weekly', lastMod));
        
        // Other languages
        ['tr', 'nl'].forEach(lang => {
             // Avoid double slash for root path if route is empty
            const langPath = route ? `/${lang}${route}` : `/${lang}`;
            urls.push(generateUrlEntry(`${SITE_URL}${langPath}`, '0.9', 'weekly', lastMod));
        });
    });

    return `<?xml="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

/**
 * Write sitemap to file
 */
function writeSitemap() {
    try {
        const sitemapContent = generateSitemap();

        // Ensure the public directory exists
        const publicDir = path.dirname(OUTPUT_PATH);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // Write the sitemap file
        fs.writeFileSync(OUTPUT_PATH, sitemapContent, 'utf8');

        console.log('✅ Sitemap generated successfully!');
        console.log(`📍 Location: ${OUTPUT_PATH}`);
        console.log(`🔗 URL: ${SITE_URL}/sitemap.xml`);
        console.log(`📅 Last Modified: ${new Date().toISOString().split('T')[0]}`);
        console.log(`📄 Total URLs: 3 (EN, TR, NL)`);
        console.log(`🌍 Languages: English (default), Turkish, Dutch`);

    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
        process.exit(1);
    }
}

// Run the script
writeSitemap();
