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

  it('is nothing while the reader is still above the first heading', () => {
    expect(currentSection(headings.map((h) => ({ ...h, top: h.top + 1000 })))).toBeUndefined();
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

  it('marks the nav, so only a page with this script gets the sticky bar', () => {
    document.body.innerHTML = TOC_HTML;
    expect(document.querySelector('.toc')!.hasAttribute('data-folding')).toBe(false);
    bindTocDisclosure(document, fakeQuery(false));
    expect(document.querySelector('.toc')!.hasAttribute('data-folding')).toBe(true);
  });

  it('takes the summary out of the tab order on wide screens, where it does nothing', () => {
    document.body.innerHTML = TOC_HTML;
    const wide = fakeQuery(true);
    bindTocDisclosure(document, wide);
    const summary = document.querySelector<HTMLElement>('summary')!;
    expect(summary.tabIndex).toBe(-1);
    wide.flip(false);
    expect(summary.tabIndex).toBe(0);
    wide.flip(true);
    expect(summary.tabIndex).toBe(-1);
  });

  it('folds on a tap outside the list, but not on one inside it, on narrow screens only', () => {
    document.body.innerHTML = TOC_HTML;
    const wide = fakeQuery(false);
    bindTocDisclosure(document, wide);

    details().open = true;
    document.querySelector<HTMLElement>('ol')!.click();
    expect(details().open).toBe(true);
    document.querySelector<HTMLElement>('h2')!.click();
    expect(details().open).toBe(false);

    wide.flip(true);
    document.querySelector<HTMLElement>('h2')!.click();
    expect(details().open).toBe(true);
  });

  const escape = (target: EventTarget) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  it('folds on Escape and gives focus back to the summary when it was in the list', () => {
    document.body.innerHTML = TOC_HTML;
    bindTocDisclosure(document, fakeQuery(false));
    details().open = true;
    const link = document.querySelector<HTMLElement>('a[href="#one"]')!;
    link.focus();
    escape(link);
    expect(details().open).toBe(false);
    expect(document.activeElement?.tagName).toBe('SUMMARY');
  });

  it('folds on Escape when focus is elsewhere, as after a tap in Safari, and leaves focus', () => {
    document.body.innerHTML = TOC_HTML;
    bindTocDisclosure(document, fakeQuery(false));
    details().open = true;
    escape(document.body);
    expect(details().open).toBe(false);
    expect(document.activeElement).toBe(document.body);
  });

  it('ignores Escape on wide screens and other keys', () => {
    document.body.innerHTML = TOC_HTML;
    const wide = fakeQuery(false);
    bindTocDisclosure(document, wide);
    details().open = true;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(details().open).toBe(true);
    wide.flip(true);
    escape(document.body);
    expect(details().open).toBe(true);
  });

  it('moves focus to the chosen section on a narrow screen, without scrolling itself', () => {
    document.body.innerHTML = TOC_HTML;
    bindTocDisclosure(document, fakeQuery(false));
    details().open = true;
    const heading = document.getElementById('two')!;
    let options: FocusOptions | undefined;
    const focus = heading.focus.bind(heading);
    heading.focus = (opts?: FocusOptions) => {
      options = opts;
      focus(opts);
    };
    document.querySelector<HTMLAnchorElement>('a[href="#two"]')!.click();
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(options).toEqual({ preventScroll: true });
  });

  it('lets the chevron turn only after the reader first taps, not on the fold at load', () => {
    document.body.innerHTML = TOC_HTML;
    bindTocDisclosure(document, fakeQuery(false));
    expect(details().hasAttribute('data-animate')).toBe(false);
    document.querySelector<HTMLElement>('summary')!.click();
    expect(details().hasAttribute('data-animate')).toBe(true);
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

  it('names no section and marks no link above the first heading', () => {
    document.body.innerHTML = TOC_HTML;
    for (const heading of document.querySelectorAll('h2')) {
      heading.getBoundingClientRect = () => ({ top: 900 }) as DOMRect;
    }
    bindTableOfContents(document, window);
    expect(document.querySelector('.toc-current')?.textContent).toBe('');
    expect(document.querySelector('.toc a[aria-current]')).toBeNull();
  });
});
