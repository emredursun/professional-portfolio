// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createHighlight } from '../../scripts/blog/highlight.js';

type Highlight = Awaited<ReturnType<typeof createHighlight>>;
let hl: Highlight;

beforeAll(async () => {
  hl = await createHighlight();
});

describe('createHighlight', () => {
  it('colours code with classes, never inline styles, so the CSP holds', () => {
    const out = hl.highlight("const a: string = 'x';\n", 'ts');
    expect(out).toContain('<pre');
    expect(out).toMatch(/class="sk-[a-z0-9]+"/);
    expect(out).not.toContain('style=');
  });

  it('keeps the code block focusable so keyboard users can scroll it', () => {
    expect(hl.highlight('a\n', 'text')).toContain('tabindex="0"');
  });

  it('escapes markup inside code', () => {
    const out = hl.highlight('<script>alert(1)</script>\n', 'text');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&#x3C;script>');
  });

  it.each([
    ['typescript', 'ts'],
    ['javascript', 'js'],
    ['sh', 'bash'],
    ['yml', 'yaml'],
  ])('treats %s like %s', (alias, name) => {
    const code = 'x: 1\n';
    expect(hl.highlight(code, alias)).toBe(hl.highlight(code, name));
  });

  it('highlights every language the Markdown renderer accepts', () => {
    for (const lang of ['ts', 'js', 'json', 'bash', 'yaml', 'text']) {
      expect(() => hl.highlight('x\n', lang)).not.toThrow();
    }
  });

  it('produces the same output for the same input', () => {
    const code = 'await expect(page).toHaveURL(/done/);\n';
    expect(hl.highlight(code, 'ts')).toBe(hl.highlight(code, 'ts'));
  });

  it('returns the colour rules sorted, one per class, with no background', async () => {
    const fresh = await createHighlight();
    fresh.highlight("const a = 'x';\n", 'ts');
    const rules = fresh.css().trim().split('\n');
    expect(rules.length).toBeGreaterThan(1);
    expect([...rules].sort()).toEqual(rules);
    const colourRule = /^\.sk-[a-z0-9]+\{--shiki-dark:#[0-9a-fA-F]{6}\}$/;
    expect(rules.filter((rule) => !colourRule.test(rule))).toEqual([]);
  });

  it('returns no rules before anything is highlighted', async () => {
    const fresh = await createHighlight();
    expect(fresh.css()).toBe('');
  });
});

describe('createHighlight: review findings', () => {
  it('does not add an empty last line for the newline every fence ends with', () => {
    const lines = hl.highlight('a\nb\n', 'text').match(/class="line"/g) ?? [];
    expect(lines).toHaveLength(2);
  });
});
