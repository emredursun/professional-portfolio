/**
 * Marks the table of contents entry for the section being read, with
 * aria-current="location", and folds the list into a closed disclosure on
 * narrow screens. Without this script the list is open and still works as
 * plain links; it only adds the highlight and the folding.
 */

/** How far below the top of the window a heading counts as reached. */
const REACHED_PX = 120;

/**
 * The id of the last heading that has scrolled past the line, or nothing while
 * the reader is still above the first one (the title and introduction).
 */
export function currentSection(
  headings: readonly { id: string; top: number }[],
  line: number = REACHED_PX,
): string | undefined {
  return headings.filter((heading) => heading.top <= line).at(-1)?.id;
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
    let current = '';
    for (const link of links) {
      if (decodeURIComponent(link.hash.slice(1)) === id) {
        link.setAttribute('aria-current', 'location');
        current = link.textContent ?? '';
      } else {
        link.removeAttribute('aria-current');
      }
    }
    // Empty above the first heading, so the bar shows only its title and count.
    if (label && label.textContent !== current) label.textContent = current;
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
  const summary = details?.querySelector('summary');
  if (!details || !summary) return;

  const fit = (isWide: boolean) => {
    if (details.open !== isWide) details.open = isWide;
    // On wide screens the summary is only the list's title, not a control.
    summary.tabIndex = isWide ? -1 : 0;
  };
  wide.addEventListener('change', (event) => fit(event.matches));
  // Undo a toggle on wide screens, where the list is always open.
  details.addEventListener('toggle', () => {
    if (wide.matches && !details.open) details.open = true;
  });
  details.addEventListener('click', (event) => {
    // The chevron turns only for the reader, not for the fold on load.
    details.setAttribute('data-animate', '');
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || wide.matches) return;
    // Fold again once a section is chosen, and move focus to it, since the
    // link is about to be hidden. The browser still makes the jump.
    details.open = false;
    const target = doc.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
  // The open list covers the text on narrow screens: a tap outside it or
  // Escape puts it away, as with any menu. Escape is heard on the whole page,
  // since Safari does not focus a tapped summary.
  doc.addEventListener('click', (event) => {
    if (!wide.matches && details.open && !details.contains(event.target as Node)) {
      details.open = false;
    }
  });
  doc.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || wide.matches || !details.open) return;
    const hadFocus = details.contains(doc.activeElement);
    details.open = false;
    if (hadFocus) summary.focus();
  });
  // Lets article.css stick the bar to the top and drop the list down over the
  // text; without this script the list stays open and in the flow.
  details.closest('.toc')?.setAttribute('data-folding', '');
  fit(wide.matches);
}
