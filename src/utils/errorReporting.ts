/**
 * Client-side error reporting through Plausible custom events.
 *
 * Plausible is already loaded and is cookieless, so this adds error visibility
 * without a new vendor, account or consent requirement. Each report becomes a
 * "JS Error" event whose `message` and `source` props can be broken down in
 * the Plausible dashboard (Goals -> Custom events -> "JS Error").
 *
 * Messages are scrubbed before sending: URL query strings, email addresses,
 * key=value credentials, long opaque ids and long digit runs are removed, and
 * the rest is truncated. That is a safety net, not a licence: callers that
 * handle user or provider data (the contact form) report a fixed code instead
 * of a message that could contain it.
 */

type ErrorSource = 'render' | 'window' | 'promise';

const EVENT_NAME = 'JS Error';
const MAX_MESSAGE_LENGTH = 120;
const MAX_REPORTS_PER_PAGE = 5;

let reportsSent = 0;
const seen = new Set<string>();

const URL_QUERY = /(https?:\/\/[^\s?#]+)[?#]\S*/g;
const CREDENTIAL =
  /\b([\w-]*(?:token|key|secret|password|passwd|auth|session|cookie)[\w-]*)\s*[=:]\s*[^\s,;&]+/gi;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const OPAQUE_ID = /\b(?=[A-Za-z0-9_]*\d)[A-Za-z0-9_]{24,}\b/g;
const DIGIT_RUN = /\d{6,}/g;

/** Normalise anything thrown into a short message without personal data or secrets. */
export function describeError(error: unknown): string {
  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
        ? error
        : 'Non-Error value thrown';

  return raw
    .replace(URL_QUERY, '$1')
    .replace(CREDENTIAL, '$1=[redacted]')
    .replace(EMAIL, '[email]')
    .replace(OPAQUE_ID, '[id]')
    .replace(DIGIT_RUN, '[number]')
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
