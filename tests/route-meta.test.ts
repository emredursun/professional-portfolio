// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadConstants } from '../scripts/lib/load-constants.js';
import { listRoutes, routeImages, generateSitemap } from '../scripts/generate-sitemap.js';
import {
  BLOCK_END,
  BLOCK_START,
  LANGUAGES,
  PERSON_ID,
  loadLocales,
  pageNode,
  renderHeadBlock,
  routeMeta,
} from '../scripts/lib/route-meta.js';
import { outputFileFor, prerenderRoutes, renderRoutePage } from '../scripts/prerender-routes.js';

const ROOT = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let constants: Awaited<ReturnType<typeof loadConstants>>;
let locales: ReturnType<typeof loadLocales>;
beforeAll(async () => {
  constants = await loadConstants();
  locales = loadLocales(ROOT);
});

const meta = (route: string, lang = 'en') => routeMeta({ route, lang, constants, locales });

describe('routeMeta', () => {
  it('gives every sitemap route a real title and description in every language', () => {
    for (const route of listRoutes(constants)) {
      for (const lang of LANGUAGES) {
        const { title, description } = meta(route, lang);
        expect(title, `${lang} ${route}`).toMatch(/Emre Dursun/);
        expect(description.length, `${lang} ${route}`).toBeGreaterThan(40);
        // An i18n key leaking through would look like "services.cicd.title".
        expect(`${title} ${description}`).not.toMatch(/\b(services|projects|meta)\.[a-zA-Z-]+\./);
      }
    }
  });

  it('mirrors the titles the pages set', () => {
    expect(meta('/about').title).toBe('Emre Dursun — QA Consultant, Pega & Tricentis Tosca');
    expect(meta('/resume').title).toBe('Resume | Emre Dursun');
    expect(meta('/about/pega-platform-architecture').title).toBe(
      'Pega Platform Architecture | Emre Dursun',
    );
    expect(meta('/projects/aegisqa').title).toMatch(/^AegisQA.* \| Emre Dursun$/);
    expect(meta('/about/pega-platform-architecture', 'nl').title).toBe(
      `${locales.nl.about.services.pegaPlatform.title} | Emre Dursun`,
    );
  });

  it('builds self-canonicals and hreflang alternates, but no canonical on the home page', () => {
    const nl = meta('/projects/aegisqa', 'nl');
    expect(nl.canonical).toBe('https://emredursun.nl/nl/projects/aegisqa');
    expect(nl.alternates).toContainEqual({
      hreflang: 'x-default',
      href: 'https://emredursun.nl/projects/aegisqa',
    });
    expect(meta('').canonical).toBeNull();
    expect(meta('', 'tr').url).toBe('https://emredursun.nl/tr');
  });

  it('marks the profile routes as ProfilePage and links every page to the Person', () => {
    expect(pageNode(meta('/about'), { dateModified: '2026-10-24T00:00:00.000Z' })).toMatchObject({
      '@type': 'ProfilePage',
      mainEntity: { '@id': PERSON_ID },
      dateModified: '2026-10-24T00:00:00.000Z',
    });
    expect(pageNode(meta('/contact'))).toMatchObject({
      '@type': 'WebPage',
      about: { '@id': PERSON_ID },
    });
  });
});

describe('index.html', () => {
  it('carries exactly the generated home-page block, so the two cannot drift', () => {
    const start = indexHtml.indexOf(BLOCK_START);
    const end = indexHtml.indexOf(BLOCK_END) + BLOCK_END.length;
    expect(indexHtml.slice(start, end)).toBe(renderHeadBlock(meta('')));
  });

  it('has a single head block and no stray copies of the tags it owns', () => {
    const head = indexHtml.slice(0, indexHtml.indexOf('</head>'));
    expect(head.match(/<title>/g)).toHaveLength(1);
    expect(head.match(/property="og:title"/g)).toHaveLength(1);
    expect(head.match(/name="description"/g)).toHaveLength(1);
  });
});

describe('prerenderRoutes', () => {
  it('maps routes to the files cleanUrls serves', () => {
    expect(outputFileFor('en', '')).toBe('index.html');
    expect(outputFileFor('nl', '')).toBe('nl.html');
    expect(outputFileFor('en', '/about')).toBe('about.html');
    expect(outputFileFor('tr', '/projects/aegisqa')).toBe('tr/projects/aegisqa.html');
  });

  it('escapes the head values and sets the document language', () => {
    const html = renderRoutePage(indexHtml, meta('/about', 'nl'), null);
    expect(html).toMatch(/^<!DOCTYPE html>\s*<html lang="nl"/);
    expect(html).toContain('Pega &amp; Tricentis Tosca');
    expect(html).toContain('<link rel="canonical" href="https://emredursun.nl/nl/about" />');
  });

  it('writes one page per route and language into a build directory', async () => {
    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'prerender-'));
    try {
      fs.writeFileSync(path.join(dist, 'index.html'), indexHtml);
      const files = await prerenderRoutes({ distDir: dist, constants, locales, state: {} });
      expect(files).toHaveLength(listRoutes(constants).length * LANGUAGES.length);

      const page = fs.readFileSync(path.join(dist, 'projects', 'aegisqa.html'), 'utf8');
      expect(page).toMatch(/<title>AegisQA[^<]*\| Emre Dursun<\/title>/);
      expect(page).toContain(
        '<meta property="og:url" content="https://emredursun.nl/projects/aegisqa" />',
      );
      expect(page.match(/route-meta:start/g)).toHaveLength(1);
    } finally {
      fs.rmSync(dist, { recursive: true, force: true });
    }
  });

  it('refuses a template without the route-meta block', () => {
    expect(() =>
      renderRoutePage('<html lang="en"><head></head></html>', meta('/about'), null),
    ).toThrow(/route-meta/);
  });
});

describe('image sitemap', () => {
  it('lists the portrait on the profile pages only', () => {
    const images = routeImages(constants);
    const xml = generateSitemap({ '': 'x', '/about': 'x', '/resume': 'x' }, images);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml.match(/<image:loc>/g)).toHaveLength(6);
    expect(xml).toContain(
      '<image:loc>https://emredursun.nl/images/emre-dursun-qa-consultant.jpg</image:loc>',
    );
  });
});
