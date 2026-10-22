/**
 * Whether this device should render the decorative layers: the three.js
 * particle field, floating shapes and the custom cursor.
 *
 * They are pointer-driven, desktop-scale effects. Measured on a throttled
 * mobile profile they were the entire total-blocking-time cost - Lighthouse
 * mobile 58 with them, 85 without - while adding nothing on a touch screen,
 * where there is no cursor to follow.
 */
export function shouldRenderDecor(env: {
  matchMedia?: (query: string) => { matches: boolean };
  innerWidth: number;
  saveData?: boolean;
} = {
  matchMedia: window.matchMedia?.bind(window),
  innerWidth: window.innerWidth,
  saveData: (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
}): boolean {
  const query = (q: string) => env.matchMedia?.(q).matches ?? false;

  if (query('(prefers-reduced-motion: reduce)')) return false;
  if (query('(pointer: coarse)')) return false; // touch-first device
  if (env.innerWidth < 1024) return false; // the app's mobile layout breakpoint
  if (env.saveData) return false; // the visitor asked to save data
  return true;
}
