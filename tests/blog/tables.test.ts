import { describe, expect, it } from 'vitest';
import { bindScrollableTables } from '../../blog/client/tables';

function region(scrollWidth: number, clientWidth: number) {
  const el = document.createElement('div');
  el.className = 'table-wrap';
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
  document.body.append(el);
  return el;
}

describe('bindScrollableTables', () => {
  it('gives a tab stop to a table that overflows, and not to one that fits', () => {
    document.body.innerHTML = '';
    const wide = region(600, 300);
    const narrow = region(300, 300);
    bindScrollableTables(document, window);
    expect(wide.getAttribute('tabindex')).toBe('0');
    expect(narrow.hasAttribute('tabindex')).toBe(false);
  });

  it('follows the width when the window is resized', () => {
    document.body.innerHTML = '';
    const el = region(600, 300);
    bindScrollableTables(document, window);
    Object.defineProperty(el, 'clientWidth', { value: 700, configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(el.hasAttribute('tabindex')).toBe(false);
  });

  it('leaves a page without tables alone', () => {
    document.body.innerHTML = '';
    expect(() => bindScrollableTables(document, window)).not.toThrow();
  });
});
