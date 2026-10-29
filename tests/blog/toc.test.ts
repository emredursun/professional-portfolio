import { describe, expect, it } from 'vitest';
import { bindTableOfContents, currentSection } from '../../blog/client/toc';

describe('currentSection', () => {
  const headings = [
    { id: 'one', top: -400 },
    { id: 'two', top: 80 },
    { id: 'three', top: 600 },
  ];

  it('is the last heading that has scrolled past the line', () => {
    expect(currentSection(headings)).toBe('two');
  });

  it('is the first heading before any has been reached', () => {
    expect(currentSection(headings.map((h) => ({ ...h, top: h.top + 1000 })))).toBe('one');
  });

  it('is nothing for a page without headings', () => {
    expect(currentSection([])).toBeUndefined();
  });
});

describe('bindTableOfContents', () => {
  it('marks only the current entry, and leaves a page without a list alone', () => {
    document.body.innerHTML = `<nav class="toc"><ol>
<li><a href="#one">One</a></li><li><a href="#two">Two</a></li></ol></nav>
<h2 id="one">One</h2><h2 id="two">Two</h2>`;
    bindTableOfContents(document, window);
    const current = [...document.querySelectorAll('.toc a[aria-current="location"]')];
    // jsdom lays nothing out: every heading is at 0, past the line.
    expect(current.map((a) => a.getAttribute('href'))).toEqual(['#two']);

    document.body.innerHTML = '<p>No list</p>';
    expect(() => bindTableOfContents(document, window)).not.toThrow();
  });
});
