/**
 * Marks the table of contents entry for the section being read, with
 * aria-current="location". Without this script the list still works as plain
 * links; it only adds the highlight.
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

  let pending = false;
  const update = () => {
    pending = false;
    const id = currentSection(
      targets.map((target) => ({ id: target.id, top: target.getBoundingClientRect().top })),
    );
    for (const link of links) {
      if (decodeURIComponent(link.hash.slice(1)) === id) {
        link.setAttribute('aria-current', 'location');
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
