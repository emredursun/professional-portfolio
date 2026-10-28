/**
 * Escape-by-default HTML templating for the blog build.
 *
 * Every value interpolated into markup`...` is escaped unless it is itself the
 * result of markup`` or raw(). That makes "forgot to escape" impossible by
 * default and "deliberately unescaped" visible in review. undefined, null and
 * booleans throw: in a template they are almost always a typo or a forgotten
 * ternary, and silently printing "undefined" into a published page is worse
 * than a failed build.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** @param {string | number} value */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

class SafeHtml {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }
}

/** Marks trusted markup (already-rendered Markdown, inline SVG) as safe. */
export function raw(value) {
  return new SafeHtml(String(value));
}

/** @param {unknown} value */
export function isSafeHtml(value) {
  return value instanceof SafeHtml;
}

/** @param {unknown} value @returns {string} */
function render(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (typeof value === 'string' || typeof value === 'number') return escapeHtml(value);
  throw new TypeError(`markup: cannot interpolate ${value === null ? 'null' : typeof value}`);
}

/**
 * @param {TemplateStringsArray} strings
 * @param {...unknown} values
 */
export function markup(strings, ...values) {
  const out = strings.reduce(
    (acc, part, index) => acc + part + (index < values.length ? render(values[index]) : ''),
    '',
  );
  return new SafeHtml(out);
}
