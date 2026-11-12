import { describe, expect, it } from 'vitest';
import { bindTableOfContents, bindTocDisclosure, currentSection } from '../../blog/client/toc';

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

/** A stand-in for matchMedia('(min-width: 1180px)') whose answer a test can flip. */
function fakeQuery(matches: boolean) {
  const listeners: ((event: { matches: boolean }) => void)[] = [];
  return {
    matches,
    addEventListener: (_type: 'change', listener: (event: { matches: boolean }) => void) => {
      listeners.push(listener);
    },
    flip(next: boolean) {
      this.matches = next;
      listeners.forEach((listener) => listener({ matches: next }));
    },
  };
}

const TOC_HTML = `<nav class="toc"><details class="toc-disclosure" open>
<summary><span class="toc-title">On this page</span><span class="toc-current"></span></summary>
<ol><li><a href="#one">One</a></li><li><a href="#two">Second part</a></li></ol></details></nav>
<h2 id="one">One</h2><h2 id="two">Second part</h2>`;

describe('bindTocDisclosure', () => {
  const details = () => document.querySelector<HTMLDetailsElement>('.toc-disclosure')!;

  it('folds the list on narrow screens and keeps it open on wide ones', () => {
    document.body.innerHTML = TOC_HTML;
    const wide = fakeQuery(false);
    bindTocDisclosure(document, wide);
    expect(details().open).toBe(false);

    wide.flip(true);
    expect(details().open).toBe(true);
    wide.flip(false);
    expect(details().open).toBe(false);
  });

  it('stays open on wide screens even when the summary is toggled', () => {
    document.body.innerHTML = TOC_HTML;
    bindTocDisclosure(document, fakeQuery(true));
    expect(details().open).toBe(true);
    details().open = false;
    details().dispatchEvent(new Event('toggle'));
    expect(details().open).toBe(true);
  });

  it('folds again after a link is chosen on a narrow screen, but not on a wide one', () => {
    document.body.innerHTML = TOC_HTML;
    const wide = fakeQuery(false);
    bindTocDisclosure(document, wide);
    details().open = true;
    document.querySelector<HTMLAnchorElement>('a[href="#two"]')!.click();
    expect(details().open).toBe(false);

    wide.flip(true);
    document.querySelector<HTMLAnchorElement>('a[href="#one"]')!.click();
    expect(details().open).toBe(true);
  });

  it('leaves a page without a disclosure alone', () => {
    document.body.innerHTML = '<p>No list</p>';
    expect(() => bindTocDisclosure(document, fakeQuery(false))).not.toThrow();
  });
});

describe('bindTableOfContents: current section in the summary', () => {
  it('names the section being read next to the folded title', () => {
    document.body.innerHTML = TOC_HTML;
    bindTableOfContents(document, window);
    expect(document.querySelector('.toc-current')?.textContent).toBe('Second part');
  });
});
