// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  computeLastMod,
  generateSitemap,
  hashRoute,
  listRoutes,
  readState,
  STATIC_ROUTES,
  sourcesForRoute,
  writeIfChanged,
  writeSitemap,
} from '../scripts/generate-sitemap.js';

const NOW = '2026-10-21T12:00:00.000Z';
const OLD = '2026-01-01T00:00:00.000Z';

describe('computeLastMod', () => {
  it('keeps the stored timestamp when a route hash is unchanged', () => {
    const { lastMod, changed } = computeLastMod(
      { '/about': { hash: 'a', lastmod: OLD } },
      { '/about': 'a' },
      NOW,
    );
    expect(lastMod['/about']).toBe(OLD);
    expect(changed).toEqual([]);
  });

  it('restamps only the routes whose content changed', () => {
    const previous = {
      '/about': { hash: 'a', lastmod: OLD },
      '/projects': { hash: 'p', lastmod: OLD },
    };
    const { lastMod, changed } = computeLastMod(
      previous,
      { '/about': 'a', '/projects': 'p2' },
      NOW,
    );
    expect(lastMod).toEqual({ '/about': OLD, '/projects': NOW });
    expect(changed).toEqual(['/projects']);
  });

  it('stamps routes it has never seen and reports the root as "/"', () => {
    const { lastMod, changed, nextState } = computeLastMod({}, { '': 'h' }, NOW);
    expect(lastMod['']).toBe(NOW);
    expect(changed).toEqual(['/']);
    expect(nextState['']).toEqual({ hash: 'h', lastmod: NOW });
  });

  it('restamps a stored entry that has no timestamp', () => {
    const { lastMod } = computeLastMod({ '/about': { hash: 'a' } }, { '/about': 'a' }, NOW);
    expect(lastMod['/about']).toBe(NOW);
  });
});

describe('sourcesForRoute', () => {
  it('combines shared sources with the route namespace in every language', () => {
    const sources = sourcesForRoute('/resume');
    expect(sources).toContain('constants.tsx');
    for (const lang of ['en', 'tr', 'nl']) {
      expect(sources).toContain(`public/locales/${lang}/common.json`);
      expect(sources).toContain(`public/locales/${lang}/resume.json`);
    }
    expect(sources.some((s: string) => s.endsWith('projects.json'))).toBe(false);
  });

  it('maps the home page to the about namespace', () => {
    expect(sourcesForRoute('')).toContain('public/locales/en/about.json');
  });

  it('gives detail pages the namespace of their section', () => {
    expect(sourcesForRoute('/projects/aegisqa')).toContain('public/locales/nl/projects.json');
    expect(sourcesForRoute('/about/pega-platform-architecture')).toContain(
      'public/locales/tr/about.json',
    );
  });

  it('rejects a route outside the known sections', () => {
    expect(() => sourcesForRoute('/blog/post')).toThrow(/No locale namespace/);
  });
});

describe('listRoutes', () => {
  it('appends a detail route per service and project after the static pages', () => {
    const routes = listRoutes({
      SERVICES: [{ slug: 'svc' }],
      PROJECTS: [{ slug: 'one' }, { slug: 'two' }],
    });
    expect(routes).toEqual([...STATIC_ROUTES, '/about/svc', '/projects/one', '/projects/two']);
  });

  it('covers every slug in the real constants.tsx without duplicates', async () => {
    const { loadConstants } = await import('../scripts/lib/load-constants.js');
    const constants = await loadConstants();
    const routes = listRoutes(constants);
    expect(routes).toHaveLength(
      STATIC_ROUTES.length + constants.SERVICES.length + constants.PROJECTS.length,
    );
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toContain('/projects/devran-ai-kit');
  });
});

describe('hashRoute', () => {
  it('is deterministic and distinguishes routes with different content', () => {
    expect(hashRoute('/resume')).toBe(hashRoute('/resume'));
    expect(hashRoute('/resume')).not.toBe(hashRoute('/projects'));
    expect(hashRoute('')).toBe(hashRoute('/about'));
  });
});

describe('generateSitemap', () => {
  const lastMod = { '': OLD, '/about': OLD, '/resume': NOW, '/projects': OLD, '/contact': OLD };
  const xml = generateSitemap(lastMod);

  it('lists every route in every language', () => {
    expect(xml.match(/<loc>/g)).toHaveLength(15);
    expect(xml).toContain('<loc>https://emredursun.nl/</loc>');
    expect(xml).toContain('<loc>https://emredursun.nl/tr/resume</loc>');
    expect(xml).toContain('<loc>https://emredursun.nl/nl</loc>');
  });

  it('carries hreflang alternates including x-default', () => {
    expect(xml.match(/xhtml:link/g)).toHaveLength(60);
    expect(xml).toContain('hreflang="x-default" href="https://emredursun.nl/resume"');
  });

  it('uses the per-route lastmod for all language variants', () => {
    expect(xml.match(new RegExp(`<lastmod>${NOW}</lastmod>`, 'g'))).toHaveLength(3);
  });

  it('weights the home page above content pages', () => {
    expect(xml).toMatch(/<loc>https:\/\/emredursun\.nl\/<\/loc>[\s\S]*?<priority>1\.0<\/priority>/);
  });

  it('weights detail pages below sections, with per-language alternates', () => {
    const detail = generateSitemap({ '/projects/aegisqa': OLD });
    expect(detail).toContain('<priority>0.6</priority>');
    expect(detail).toContain('<loc>https://emredursun.nl/nl/projects/aegisqa</loc>');
    expect(detail).toContain('hreflang="tr" href="https://emredursun.nl/tr/projects/aegisqa"');
  });
});

describe('writeIfChanged', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-test-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes a missing file, including missing parent directories', () => {
    const file = path.join(dir, 'nested', 'out.xml');
    expect(writeIfChanged(file, 'a\n')).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe('a\n');
  });

  it('leaves an identical file untouched', () => {
    const file = path.join(dir, 'out.xml');
    fs.writeFileSync(file, 'a\nb\n');
    expect(writeIfChanged(file, 'a\nb\n')).toBe(false);
  });

  it('treats CRLF and LF versions of the same content as unchanged', () => {
    const file = path.join(dir, 'out.xml');
    fs.writeFileSync(file, 'a\r\nb\r\n');
    expect(writeIfChanged(file, 'a\nb\n')).toBe(false);
  });

  it('rewrites a file whose content differs', () => {
    const file = path.join(dir, 'out.xml');
    fs.writeFileSync(file, 'old');
    expect(writeIfChanged(file, 'new')).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe('new');
  });
});

describe('readState', () => {
  it('returns an empty state for a missing or corrupt file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-state-'));
    try {
      expect(readState(path.join(dir, 'missing.json'))).toEqual({});
      fs.writeFileSync(path.join(dir, 'bad.json'), '{ not json');
      expect(readState(path.join(dir, 'bad.json'))).toEqual({});
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('writeSitemap (end to end on a temp directory)', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-run-'));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('stamps every route on the first run, then is a no-op', () => {
    const outputPath = path.join(dir, 'sitemap.xml');
    const statePath = path.join(dir, 'state.json');

    const first = writeSitemap({ outputPath, statePath, now: OLD });
    expect(first).toMatchObject({ sitemapWritten: true, urls: 18, alternates: 72 });
    expect(first.changed).toEqual(['/', '/about', '/resume', '/projects', '/contact', '/quality']);

    const second = writeSitemap({ outputPath, statePath, now: NOW });
    expect(second.sitemapWritten).toBe(false);
    expect(second.changed).toEqual([]);
    // The second run must not have restamped anything.
    expect(fs.readFileSync(outputPath, 'utf8')).not.toContain(NOW);
  });

  it('restamps only the routes whose stored hash no longer matches', () => {
    const outputPath = path.join(dir, 'sitemap.xml');
    const statePath = path.join(dir, 'state.json');
    writeSitemap({ outputPath, statePath, now: OLD });

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state['/projects'].hash = 'stale';
    fs.writeFileSync(statePath, JSON.stringify(state));

    const run = writeSitemap({ outputPath, statePath, now: NOW });
    expect(run.changed).toEqual(['/projects']);
    expect(fs.readFileSync(outputPath, 'utf8').match(new RegExp(NOW, 'g'))).toHaveLength(3);
  });

  it('publishes the detail routes it is given', () => {
    const outputPath = path.join(dir, 'sitemap.xml');
    const statePath = path.join(dir, 'state.json');
    const routes = [...STATIC_ROUTES, '/projects/aegisqa'];

    const run = writeSitemap({ routes, outputPath, statePath, now: OLD });
    expect(run).toMatchObject({ urls: 21, alternates: 84 });
    expect(run.changed).toContain('/projects/aegisqa');
  });
});
