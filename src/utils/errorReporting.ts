/**
 * Client-side error reporting through Plausible custom events.
 *
 * Plausible is already loaded and is cookieless, so this adds error visibility
 * without a new vendor, account or consent requirement. Each report becomes a
 * "JS Error" event whose `message` and `source` props can be broken down in
 * the Plausible dashboard (Goals -> Custom events -> "JS Error").
 *
 * Messages are truncated and stripped of URLs' query strings before sending,
 * so a stack or error message can never carry form input or tokens out.
 */

type ErrorSource = 'render' | 'window' | 'promise';

const EVENT_NAME = 'JS Error';
const MAX_MESSAGE_LENGTH = 120;
const MAX_REPORTS_PER_PAGE = 5;

let reportsSent = 0;
const seen = new Set<string>();

/** Normalise anything thrown into a short, query-string-free message. */
export function describeError(error: unknown): string {
  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : 'Non-Error value thrown';

  return raw
    .replace(/(https?:\/\/[^\s?#]+)[?#]\S*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Send one error to Plausible. Duplicate messages and anything past the
 * per-page cap are dropped, so a render loop cannot flood the analytics.
 */
export function reportError(error: unknown, source: ErrorSource): void {
  const message = describeError(error);
  const key = `${source}:${message}`;

  if (seen.has(key) || reportsSent >= MAX_REPORTS_PER_PAGE) return;
  seen.add(key);
  reportsSent += 1;

  if (import.meta.env.DEV) {
    console.error(`[${source}]`, error);
  }

  window.plausible?.(EVENT_NAME, { props: { message, source } });
}

/**
 * Observe uncaught errors and unhandled rejections without taking over the
 * page. These usually come from third-party scripts or background requests;
 * replacing the whole site with an error screen for them (the previous
 * behaviour) turned a harmless analytics hiccup into an outage.
 */
export function installGlobalErrorReporting(): () => void {
  const onError = (event: ErrorEvent) => {
    // Cross-origin script errors arrive as an opaque "Script error." with no
    // detail - nothing actionable to report.
    if (!event.error && event.message === 'Script error.') return;
    reportError(event.error ?? event.message, 'window');
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    reportError(event.reason, 'promise');
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}

/** Test seam: reset the de-duplication state between test cases. */
export function resetErrorReportingForTests(): void {
  reportsSent = 0;
  seen.clear();
}
