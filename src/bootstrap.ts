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
import '@fortawesome/fontawesome-free/css/all.min.css';

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

installPlausibleQueue();
installGlobalErrorReporting();
registerServiceWorker();
