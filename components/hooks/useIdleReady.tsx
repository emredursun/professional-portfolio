import { useEffect, useState } from 'react';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/**
 * Becomes true once the browser has an idle moment after first render.
 *
 * Used to hold back purely decorative layers (WebGL particles, floating
 * shapes, custom cursor) so their parse and setup cost - three.js alone is
 * ~490 KB - does not compete with the content the visitor came for. Falls back
 * to a timer where requestIdleCallback is unavailable (Safari).
 */
export function useIdleReady(timeoutMs = 2000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as IdleWindow;

    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: timeoutMs });
      return () => w.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(() => setReady(true), Math.min(timeoutMs, 1200));
    return () => window.clearTimeout(id);
  }, [timeoutMs]);

  return ready;
}
