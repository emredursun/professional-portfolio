/**
 * Side effects that must run before the React tree mounts.
 *
 * Everything here used to be inline <script>/<link> tags in index.html.
 * Moving it into the bundle means:
 *   - no third-party font/icon origins on the critical path (they were
 *     render-blocking: ~1.3s for Font Awesome, ~0.8s for Google Fonts)
 *   - no inline scripts, so the Content-Security-Policy can use
 *     script-src 'self' without 'unsafe-inline' or per-script hashes
 */

// Self-hosted fonts. The @font-face rules use unicode-range, so browsers only
// download the subsets a page actually needs (latin-ext is required for
// Turkish and Dutch diacritics). Plus Jakarta Sans is the variable font: one
// 27 KB file covers weights 200-800, where the six static weights were
// 12 KB each and a page needed four or five of them.
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';

// Font Awesome Free 6.x, cut down to the icons the site uses (about 11 KB of
// CSS and 16 KB of fonts instead of 74 KB and 300 KB): see
// scripts/subset-icons.js. Every `fas` / `far` / `fab` class keeps working.
// Loaded as a dynamic import so Vite emits it as its own stylesheet, injected
// after start-up instead of blocking first paint. Icon fonts use
// font-display: block, so icons were never visible before their font arrived
// anyway - nothing is lost by not waiting for this file.
void import('./styles/icons/icons.css');

import { MotionGlobalConfig } from 'framer-motion';

/**
 * Register the service worker in production builds only. In development it
 * would cache Vite's unhashed module URLs and serve stale code across edits.
 */
function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('[SW] Registration failed:', error);
    });
  });
}

/**
 * Each deploy replaces the hashed /assets/* chunks. A tab left open across a
 * release then fails to lazy-load the next page (Resume, NotFound, the command
 * palette) and lands on the error boundary. Vite reports that as
 * vite:preloadError; reload once to pick up the new build. The session flag
 * stops a reload loop if the chunk is genuinely broken.
 */
export function handleStaleChunk(
  event: Event,
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  reload: () => void,
): void {
  const KEY = 'stale-chunk-reload';
  try {
    if (storage.getItem(KEY)) return;
    storage.setItem(KEY, '1');
  } catch {
    return; // Storage blocked: let the error boundary handle it rather than risk a loop.
  }
  event.preventDefault();
  reload();
}

function recoverFromStaleChunks(): void {
  window.addEventListener('vite:preloadError', (event) =>
    handleStaleChunk(event, sessionStorage, () => window.location.reload()),
  );
}

/**
 * With "reduce motion" on, framer-motion skips animations entirely (the
 * site's own tweens in src/utils/tween.ts check the setting themselves).
 */
function respectReducedMotion(): void {
  const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!query) return;
  const apply = () => {
    // MotionConfig reducedMotion="user" (App.tsx) only drops transform and
    // layout animations; opacity fades still play. Skip them all.
    MotionGlobalConfig.skipAnimations = query.matches;
  };
  apply();
  query.addEventListener?.('change', apply);
}

respectReducedMotion();
recoverFromStaleChunks();
registerServiceWorker();
