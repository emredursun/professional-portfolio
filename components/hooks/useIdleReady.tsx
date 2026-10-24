import { startTransition, useEffect, useState } from 'react';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Becomes true once the browser has an idle moment after first render.
 *
 * Used to hold back the print layout and purely decorative layers (particle
 * field, floating shapes, custom cursor) so their parse and setup cost does
 * not compete with the content the visitor came for. Falls back
 * to a timer where requestIdleCallback is unavailable (Safari).
 */
export function useIdleReady(timeoutMs = 2000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as IdleWindow;
    // What this releases (print layout, WebGL, decorations) mounts in one go.
    // A plain update would render it as a single blocking task; a transition
    // lets React yield to input between components.
    const markReady = () => startTransition(() => setReady(true));

    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(markReady, { timeout: timeoutMs });
      return () => w.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(markReady, Math.min(timeoutMs, 1200));
    return () => window.clearTimeout(id);
  }, [timeoutMs]);

  return ready;
}
