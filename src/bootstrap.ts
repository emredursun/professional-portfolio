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

// Self-hosted fonts. Each weight ships one CSS file whose @font-face rules use
// unicode-range, so browsers only download the subsets a page actually needs
// (latin-ext is required for Turkish and Dutch diacritics).
import '@fontsource/plus-jakarta-sans/300.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';

// Font Awesome Free 6.x - same major as the previous CDN copy (6.5.1), so
// every `fas` / `far` / `fab` class name in the codebase keeps resolving.
// Loaded as a dynamic import so Vite emits it as its own stylesheet, injected
// after start-up instead of blocking first paint (~100 KB of CSS). Icon fonts
// use font-display: block, so icons were never visible before their font
// arrived anyway - nothing is lost by not waiting for this file.
void import('@fortawesome/fontawesome-free/css/all.min.css');

import gsap from 'gsap';
import { MotionGlobalConfig } from 'framer-motion';
import { installGlobalErrorReporting } from './utils/errorReporting.ts';

/**
 * Queue stub for Plausible: calls made before the deferred script loads are
 * buffered on `plausible.q` and replayed by the real script once it arrives.
 */
function installPlausibleQueue(): void {
  if (window.plausible) return;

  const queue: unknown[] = [];
  const stub: PlausibleFn = (...args) => {
    queue.push(args);
  };
  stub.q = queue;
  window.plausible = stub;
}

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
export function handleStaleChunk(event: Event, storage: Pick<Storage, 'getItem' | 'setItem'>, reload: () => void): void {
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
 * With "reduce motion" on, every animation lands on its end state at once:
 * GSAP timelines run 1000x faster (so onComplete callbacks such as the
 * preloader's still fire) and framer-motion skips animations entirely.
 */
function respectReducedMotion(): void {
  const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!query) return;
  const apply = () => {
    gsap.globalTimeline.timeScale(query.matches ? 1000 : 1);
    // MotionConfig reducedMotion="user" (App.tsx) only drops transform and
    // layout animations; opacity fades still play. Skip them all.
    MotionGlobalConfig.skipAnimations = query.matches;
  };
  apply();
  query.addEventListener?.('change', apply);
}

installPlausibleQueue();
respectReducedMotion();
installGlobalErrorReporting();
recoverFromStaleChunks();
registerServiceWorker();
