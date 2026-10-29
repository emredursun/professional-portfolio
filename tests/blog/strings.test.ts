// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { BLOG_LANGUAGES, strings } from '../../scripts/blog/strings.js';

/** Every leaf of a strings object as [path, value], so nested groups are compared too. */
function leaves(value: unknown, prefix = ''): [string, unknown][] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      leaves(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [[prefix, value]];
}

const XML_INVALID = new RegExp(
  `[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f${String.fromCharCode(0xfffe, 0xffff)}]`,
);

describe('blog strings', () => {
  it('publishes English, Turkish and Dutch, English first', () => {
    expect(BLOG_LANGUAGES).toEqual(['en', 'tr', 'nl']);
  });

  it.each(['tr', 'nl'])('gives %s exactly the keys English has', (lang) => {
    const keys = (l: string) => leaves(strings(l)).map(([path]) => path);
    expect(keys(lang)).toEqual(keys('en'));
  });

  it.each(['en', 'tr', 'nl'])('has no empty, padded or XML-invalid text in %s', (lang) => {
    for (const [path, value] of leaves(strings(lang))) {
      expect(typeof value, path).toBe('string');
      const text = value as string;
      expect(text.trim(), path).toBe(text);
      expect(text.length, path).toBeGreaterThan(0);
      // isWellFormed (ES2024) is newer than the project's TypeScript lib.
      const wellFormed = (text as unknown as { isWellFormed(): boolean }).isWellFormed();
      expect(XML_INVALID.test(text) || !wellFormed, path).toBe(false);
    }
  });

  it('keeps one label per status and topic the schema allows', () => {
    const en = strings('en');
    expect(Object.keys(en.statusLabels)).toEqual(['hypothesis', 'testing', 'verified', 'revised']);
    expect(Object.keys(en.topicLabels)).toEqual(['testing', 'ai', 'life']);
  });

  it('is frozen, so a template cannot change another page’s text', () => {
    expect(Object.isFrozen(strings('tr'))).toBe(true);
    expect(Object.isFrozen(strings('tr').statusLabels)).toBe(true);
  });

  it('fails loudly for a language the blog does not publish', () => {
    expect(() => strings('de')).toThrow(/de/);
    expect(() => strings('toString')).toThrow(/toString/);
  });
});
