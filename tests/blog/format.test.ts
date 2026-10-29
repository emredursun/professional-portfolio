// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  blogPath,
  blogUrl,
  feedPath,
  formatDate,
  outputDir,
  portfolioPath,
  postPath,
  postUrl,
} from '../../scripts/blog/templates/format.js';

describe('formatDate', () => {
  it.each([
    ['en', '12 Oct 2026'],
    ['tr', '12 Ekim 2026'],
    ['nl', '12 oktober 2026'],
  ])('writes dates the way %s readers expect', (lang, expected) => {
    expect(formatDate('2026-10-12', lang)).toBe(expected);
  });

  it('defaults to English and drops leading zeros', () => {
    expect(formatDate('2026-03-01')).toBe('1 Mar 2026');
  });

  it('spells every Turkish and Dutch month', () => {
    const months = (lang: string) =>
      Array.from(
        { length: 12 },
        (_, i) => formatDate(`2026-${String(i + 1).padStart(2, '0')}-01`, lang).split(' ')[1],
      );
    expect(months('tr')).toEqual([
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ]);
    expect(months('nl')).toEqual([
      'januari',
      'februari',
      'maart',
      'april',
      'mei',
      'juni',
      'juli',
      'augustus',
      'september',
      'oktober',
      'november',
      'december',
    ]);
  });

  it('fails for a language the blog does not publish', () => {
    expect(() => formatDate('2026-10-12', 'de')).toThrow(/de/);
  });
});

describe('paths', () => {
  it('keeps English at /blog and prefixes the others, like the portfolio', () => {
    expect([blogPath('en'), blogPath('tr'), blogPath('nl')]).toEqual([
      '/blog',
      '/tr/blog',
      '/nl/blog',
    ]);
    expect(feedPath('nl')).toBe('/nl/blog/feed.xml');
    expect(blogUrl('tr')).toBe('https://emredursun.nl/tr/blog');
  });

  it('puts a post under its own language', () => {
    expect(postPath({ slug: 'a-note', lang: 'tr' })).toBe('/tr/blog/a-note');
    expect(postUrl({ slug: 'a-note', lang: 'en' })).toBe('https://emredursun.nl/blog/a-note');
  });

  it('writes files to the folder that serves the path', () => {
    expect([outputDir('en'), outputDir('tr')]).toEqual(['', 'tr/']);
  });

  it('links back to the portfolio in the same language', () => {
    expect(portfolioPath('en', '/')).toBe('/');
    expect(portfolioPath('tr', '/')).toBe('/tr');
    expect(portfolioPath('nl', '/contact')).toBe('/nl/contact');
    expect(portfolioPath('en', '/about')).toBe('/about');
  });

  it('refuses an unknown language rather than inventing a path', () => {
    expect(() => blogPath('de')).toThrow(/de/);
  });
});
