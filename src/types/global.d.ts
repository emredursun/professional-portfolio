/** Plausible's global, including the pre-load queue stub from bootstrap.ts. */
type PlausibleFn = ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
  q?: unknown[];
};

interface Window {
  plausible?: PlausibleFn;
}
