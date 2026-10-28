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

/**
 * Marks trusted markup (already-rendered Markdown, inline SVG) as safe.
 * @param {string} value
 */
export function raw(value) {
  if (typeof value !== 'string') throw new TypeError(`raw: expected a string, got ${typeof value}`);
  return new SafeHtml(value);
}

/** @param {unknown} value */
export function isSafeHtml(value) {
  return value instanceof SafeHtml;
}

/** @param {unknown} value @returns {string} */
function render(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  if (typeof value === 'string') return escapeHtml(value);
  if (typeof value === 'number' && Number.isFinite(value)) return escapeHtml(value);
  const kind = value === null ? 'null' : typeof value === 'number' ? String(value) : typeof value;
  throw new TypeError(`markup: cannot interpolate ${kind}`);
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
