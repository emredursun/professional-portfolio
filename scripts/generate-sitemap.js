#!/usr/bin/env node

/**
 * Sitemap Generator for Professional Portfolio
 * 
 * This script automatically generates a sitemap.xml file with the current timestamp.
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

/**
 * Pages to include in the sitemap
 * Add more pages here as your portfolio grows
 */
const pages = [
    {
        loc: '/',
        changefreq: 'weekly',
        priority: '1.0'
    }
    // Example: Add more pages when you create them
    // {
    //     loc: '/blog',
    //     changefreq: 'daily',
    //     priority: '0.8'
    // }
];

/**
 * Generate sitemap XML content
 */
function generateSitemap() {
    const currentDate = new Date().toISOString();
    
    const urls = pages.map(page => {
        return `    <url>
        <loc>${SITE_URL}${page.loc}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
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
        console.log(`📅 Last Modified: ${new Date().toISOString()}`);
        console.log(`📄 Total URLs: ${pages.length}`);
        
    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
        process.exit(1);
    }
}

// Run the script
writeSitemap();
