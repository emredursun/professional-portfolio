/** Plausible's global, including the pre-load queue stub from bootstrap.ts. */
type PlausibleFn = ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
  q?: unknown[];
};

interface Window {
  plausible?: PlausibleFn;
  /** Exposed for debugging in the browser console (src/utils/faviconController.ts). */
  faviconController?: typeof import('../utils/faviconController').faviconController;
}
