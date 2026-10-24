#!/usr/bin/env node

/**
 * Write one HTML file per route, each with its own <head>.
 *
 * Runs after `vite build` (postbuild). Takes dist/index.html as the template
 * and, for every sitemap route in every language, swaps the block between the
 * route-meta markers for that page's title, description, canonical, hreflang,
 * Open Graph and Twitter tags plus its ProfilePage / WebPage JSON-LD (see
 * scripts/lib/route-meta.js). The body is untouched: the app boots exactly as
 * before, and SEO.tsx then keeps the same tags up to date while navigating.
 *
 * Output follows firebase.json's cleanUrls: /about -> about.html,
 * /nl/projects/aegisqa -> nl/projects/aegisqa.html, / -> index.html. Firebase
 * serves an exact static file before any rewrite, so each URL gets its own
 * file; unknown slugs still fall through to the rewrite (and the app's
 * noindex NotFound view).
 *
 * dist/404.html is copied from the untouched template earlier (vite.config.ts)
 * and keeps the generic head.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadConstants } from './lib/load-constants.js';
import { listRoutes, readState } from './generate-sitemap.js';
import {
    BLOCK_END,
    BLOCK_START,
    LANGUAGES,
    loadLocales,
    localizedPath,
    pageNode,
    renderHeadBlock,
    routeMeta,
} from './lib/route-meta.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

/** File that serves a route under cleanUrls: '' -> index.html, '/nl' -> nl.html. */
export function outputFileFor(lang, route) {
    const pathname = localizedPath(lang, route);
    return pathname === '/' ? 'index.html' : `${pathname.slice(1)}.html`;
}

/** Replace the route-meta block and the document language in the template. */
export function renderRoutePage(template, meta, node) {
    const start = template.indexOf(BLOCK_START);
    const end = template.indexOf(BLOCK_END);
    if (start === -1 || end === -1 || end < start) {
        throw new Error('index.html has no route-meta block to replace');
    }
    const html = template.slice(0, start) + renderHeadBlock(meta, node) + template.slice(end + BLOCK_END.length);
    return html.replace(/<html lang="[^"]*"/, `<html lang="${meta.lang}"`);
}

/**
 * @param {{ distDir?: string, constants?: object, locales?: object, state?: Record<string, { lastmod?: string }> }} [options]
 * @returns {Promise<string[]>} files written, relative to distDir
 */
export async function prerenderRoutes({ distDir = DIST, constants, locales, state } = {}) {
    const templatePath = path.join(distDir, 'index.html');
    if (!fs.existsSync(templatePath)) {
        throw new Error('dist/index.html is missing - run `vite build` first');
    }
    const template = fs.readFileSync(templatePath, 'utf8');
    const data = constants ?? (await loadConstants());
    const strings = locales ?? loadLocales(ROOT);
    const lastmods = state ?? readState();

    const written = [];
    for (const route of listRoutes(data)) {
        for (const lang of LANGUAGES) {
            const meta = routeMeta({ route, lang, constants: data, locales: strings });
            // The profile's dateModified moves only when its content does: the
            // sitemap's content-hash lastmod for that route.
            const node = pageNode(meta, { dateModified: lastmods[route]?.lastmod });
            const file = outputFileFor(lang, route);
            const target = path.join(distDir, file);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, renderRoutePage(template, meta, node), 'utf8');
            written.push(file);
        }
    }
    return written;
}

async function main() {
    try {
        const files = await prerenderRoutes();
        console.log(`🧭 Prerendered ${files.length} route heads into dist/`);
    } catch (error) {
        console.error('❌ Error prerendering routes:', error.message);
        process.exit(1);
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main();
}
