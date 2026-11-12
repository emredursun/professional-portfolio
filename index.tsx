import './src/bootstrap.ts'; // Fonts, icons, analytics queue, service worker
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import './index.css';
import { i18nReady } from './i18n.ts'; // Initialize i18n before rendering
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

/** How long a prerendered page waits for its translations before React takes over anyway. */
const TRANSLATIONS_TIMEOUT_MS = 4000;

const render = () => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

/**
 * Resolves after the browser has painted the page as it is now. A background
 * tab paints nothing and runs no animation frames, so there it resolves on a
 * timer: React must not wait for the tab to be shown.
 */
const afterPaint = () =>
  new Promise<void>((resolve) => {
    if (document.visibilityState === 'hidden') setTimeout(resolve, 0);
    else requestAnimationFrame(() => setTimeout(resolve, 0));
  });

/**
 * React's first render of a prerendered page shows what is already on screen,
 * so its entrances would only make visible content fade out and in again.
 * framer-motion skips them for that render; afterwards the visitor's own
 * reduced-motion setting applies again (src/bootstrap.ts).
 */
const renderWithoutEntrances = async () => {
  const skipping = MotionGlobalConfig.skipAnimations;
  MotionGlobalConfig.skipAnimations = true;
  render();
  await afterPaint();
  await afterPaint();
  MotionGlobalConfig.skipAnimations = skipping;
};

// A route page carries its own content (scripts/prerender-content.js). React
// replaces it on its first render, so wait for the translations first: the
// page is swapped for the same page, not for one full of i18n keys. Wait for a
// paint too: the static page is the visitor's first view and so the page's
// largest contentful paint. Removing it invalidates that LCP in the browser's
// trace, and React's own content then has to paint at full opacity to count,
// which is why it renders without its fade-in entrances. The flag tells the
// Preloader not to cover content that is already there.
//
// Most pages snapshot only the desktop layout; on a phone they still show the
// curtain (scripts/prerender-content.js, MOBILE_ROUTES) and boot as before.
const shownLayout = rootElement.querySelector(
  window.matchMedia('(min-width: 1024px)').matches ? '.prerender-desktop' : '.prerender-mobile',
);
if (shownLayout && !shownLayout.querySelector('[data-testid="preloader"]')) {
  document.documentElement.setAttribute('data-prerendered', '');
  const timeout = new Promise((resolve) => setTimeout(resolve, TRANSLATIONS_TIMEOUT_MS));
  Promise.all([Promise.race([i18nReady, timeout]).catch(() => undefined), afterPaint()]).then(
    renderWithoutEntrances,
  );
} else {
  render();
}
