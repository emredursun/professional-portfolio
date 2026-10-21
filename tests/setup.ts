import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only cleans up automatically when the test runner exposes
// global afterEach; with Vitest globals off, rendered trees would otherwise
// leak from one test into the next.
afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia, and GSAP's ScrollTrigger calls it while the module
// registers itself - before any test can install a mock. Provide a neutral
// default; individual tests still override it where the answer matters.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
