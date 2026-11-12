/**
 * Marks the table of contents entry for the section being read, with
 * aria-current="location", and folds the list into a closed disclosure on
 * narrow screens. Without this script the list is open and still works as
 * plain links; it only adds the highlight and the folding.
 */

/** How far below the top of the window a heading counts as reached. */
const REACHED_PX = 120;

/**
 * The id of the last heading that has scrolled past the line, or the first
 * heading's id when none has yet.
 */
export function currentSection(
  headings: readonly { id: string; top: number }[],
  line: number = REACHED_PX,
): string | undefined {
  const reached = headings.filter((heading) => heading.top <= line);
  return (reached.at(-1) ?? headings[0])?.id;
}

export function bindTableOfContents(doc: Document, win: Window): void {
  const links = [...doc.querySelectorAll<HTMLAnchorElement>('.toc a[href^="#"]')];
  const targets = links
    .map((link) => doc.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter((target): target is HTMLElement => target !== null);
  if (targets.length === 0) return;
  // Shown beside the folded title on narrow screens (article.css).
  const label = doc.querySelector('.toc-current');

  let pending = false;
  const update = () => {
    pending = false;
    const id = currentSection(
      targets.map((target) => ({ id: target.id, top: target.getBoundingClientRect().top })),
    );
    for (const link of links) {
      if (decodeURIComponent(link.hash.slice(1)) === id) {
        link.setAttribute('aria-current', 'location');
        if (label && label.textContent !== link.textContent) label.textContent = link.textContent;
      } else {
        link.removeAttribute('aria-current');
      }
    }
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    win.requestAnimationFrame(update);
  };

  win.addEventListener('scroll', schedule, { passive: true });
  win.addEventListener('resize', schedule, { passive: true });
  update();
}

/** The part of MediaQueryList the disclosure needs, so tests can pass a stand-in. */
export interface WideQuery {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: (event: { matches: boolean }) => void): void;
}

/**
 * Keeps the table of contents open beside the text on wide screens (`wide`
 * is matchMedia('(min-width: 1180px)'), the breakpoint in article.css) and
 * folded in a bar that sticks to the top on narrow ones, where it folds
 * again once a section is chosen so the reader lands on the text, not the list.
 */
export function bindTocDisclosure(doc: Document, wide: WideQuery): void {
  const details = doc.querySelector<HTMLDetailsElement>('.toc-disclosure');
  if (!details) return;

  const fit = (isWide: boolean) => {
    if (details.open !== isWide) details.open = isWide;
  };
  wide.addEventListener('change', (event) => fit(event.matches));
  // The summary is a plain label on wide screens: undo a keyboard toggle.
  details.addEventListener('toggle', () => {
    if (wide.matches && !details.open) details.open = true;
  });
  // Fold again once a section is chosen; the browser still makes the jump.
  details.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest('a[href^="#"]');
    if (link && !wide.matches) details.open = false;
  });
  // The open list covers the text on narrow screens: a tap outside it or
  // Escape puts it away, as with any menu.
  doc.addEventListener('click', (event) => {
    if (!wide.matches && details.open && !details.contains(event.target as Node)) {
      details.open = false;
    }
  });
  details.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || wide.matches || !details.open) return;
    details.open = false;
    details.querySelector('summary')?.focus();
  });
  // Lets article.css drop the list down over the text instead of pushing it.
  details.setAttribute('data-folding', '');
  fit(wide.matches);
}
