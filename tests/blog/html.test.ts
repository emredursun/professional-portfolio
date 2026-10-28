// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { escapeHtml, isSafeHtml, markup, raw } from '../../scripts/blog/html.js';

describe('escapeHtml', () => {
  it('escapes the five characters that matter in text and attributes', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('leaves ordinary text and Turkish characters alone', () => {
    expect(escapeHtml('Çalışma notları — ğüşİ')).toBe('Çalışma notları — ğüşİ');
  });

  it('turns numbers into text', () => {
    expect(escapeHtml(7)).toBe('7');
  });
});

describe('markup', () => {
  it('escapes every interpolated value by default', () => {
    const title = '<script>alert(1)</script>';
    expect(String(markup`<h1>${title}</h1>`)).toBe(
      '<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>',
    );
  });

  it('escapes values placed inside attributes', () => {
    const value = '" onmouseover="alert(1)';
    expect(String(markup`<a title="${value}">x</a>`)).toBe(
      '<a title="&quot; onmouseover=&quot;alert(1)">x</a>',
    );
  });

  it('nests html results without escaping them twice', () => {
    const inner = markup`<em>${'a & b'}</em>`;
    expect(String(markup`<p>${inner}</p>`)).toBe('<p><em>a &amp; b</em></p>');
  });

  it('passes raw() through untouched', () => {
    expect(String(markup`<div>${raw('<b>trusted</b>')}</div>`)).toBe('<div><b>trusted</b></div>');
  });

  it('joins arrays, escaping each item', () => {
    const items = ['<1>', markup`<li>2</li>`];
    expect(String(markup`<ul>${items}</ul>`)).toBe('<ul>&lt;1&gt;<li>2</li></ul>');
  });

  it('renders an empty string for an empty array or empty string', () => {
    expect(String(markup`<ul>${[]}${''}</ul>`)).toBe('<ul></ul>');
  });

  it('throws on undefined, null and booleans, which are almost always template mistakes', () => {
    expect(() => markup`${undefined}`).toThrow(TypeError);
    expect(() => markup`${null}`).toThrow(TypeError);
    expect(() => markup`${false}`).toThrow(TypeError);
  });

  it('marks its results as safe, and plain strings as not', () => {
    expect(isSafeHtml(markup`x`)).toBe(true);
    expect(isSafeHtml(raw('x'))).toBe(true);
    expect(isSafeHtml('x')).toBe(false);
  });

  it('returns immutable results', () => {
    const result = markup`x`;
    expect(Object.isFrozen(result)).toBe(true);
  });
});

describe('review findings', () => {
  it('refuses to mark anything but a string as raw', () => {
    // @ts-expect-error -- checks the runtime guard
    expect(() => raw(undefined)).toThrow(TypeError);
  });

  it('refuses NaN and Infinity', () => {
    expect(() => markup`${NaN}`).toThrow(/NaN/);
    expect(() => markup`${Infinity}`).toThrow(/Infinity/);
  });
});
