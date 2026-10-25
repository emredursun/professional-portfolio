import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Open traps, newest last. Only the newest handles Tab: with the command
// palette open over a project modal, both traps pulled focus to themselves
// on every Tab and it never moved on.
let openTraps: readonly HTMLElement[] = [];

/**
 * Whether `container` is the open overlay on top, the only one that should
 * act on its keyboard shortcuts. With the command palette over a project,
 * Escape closed both and the arrow keys in the search field paged the
 * project behind it.
 */
export function isTopmostTrap(container: HTMLElement | null): boolean {
  return container !== null && openTraps[openTraps.length - 1] === container;
}

/**
 * Keeps keyboard focus inside a modal while it is open (WCAG 2.4.3).
 *
 * On opening, focus moves into the container (unless something inside
 * already has it, such as the command palette's search field); Tab and
 * Shift+Tab then cycle through its focusable elements only. On closing,
 * focus returns to the element that had it before - usually the card or
 * button that opened the modal.
 *
 * It takes the element, not a ref, so it re-binds when React replaces it: an
 * open overlay moves between the content card and <body> when the window
 * crosses the desktop breakpoint, and a trap left on the old, detached
 * element blocked every Tab. When modals stack, the newest one owns Tab
 * until it closes.
 */
export function useFocusTrap(container: HTMLElement | null, active: boolean): void {
  useEffect(() => {
    if (!active || !container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );

    // Without scrolling: the container (a panel sliding in) would otherwise
    // be scrolled to wherever its first control happens to sit.
    if (!container.contains(document.activeElement)) {
      (focusables()[0] ?? container).focus({ preventScroll: true });
    }

    openTraps = [...openTraps, container];

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || openTraps[openTraps.length - 1] !== container) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const outside = !container.contains(current);
      if (e.shiftKey && (current === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openTraps = openTraps.filter((trap) => trap !== container);
      // Back to where the visitor was, if that element is still on the page.
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [container, active]);
}
