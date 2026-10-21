// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  computeLastMod,
  generateSitemap,
  hashRoute,
  sourcesForRoute,
  writeIfChanged,
} from '../scripts/generate-sitemap.js';

const NOW = '2026-10-21T12:00:00.000Z';
const OLD = '2026-01-01T00:00:00.000Z';

describe('computeLastMod', () => {
  it('keeps the stored timestamp when a route hash is unchanged', () => {
    const { lastMod, changed } = computeLastMod({ '/about': { hash: 'a', lastmod: OLD } }, { '/about': 'a' }, NOW);
    expect(lastMod['/about']).toBe(OLD);
    expect(changed).toEqual([]);
  });

  it('restamps only the routes whose content changed', () => {
    const previous = {
      '/about': { hash: 'a', lastmod: OLD },
      '/projects': { hash: 'p', lastmod: OLD },
    };
    const { lastMod, changed } = computeLastMod(previous, { '/about': 'a', '/projects': 'p2' }, NOW);
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
