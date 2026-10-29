/**
 * Status chips with the icons from the identity board: a dashed circle with a
 * question mark (hypothesis), a half-filled circle (testing), a check
 * (verified) and a loop (revised). The label carries the meaning; the icon is
 * decoration (aria-hidden). Colours are SVG attributes, not inline styles, so
 * the CSP holds. Chips keep their light colours in both themes, so fixed
 * colours are right here.
 */

import { markup, raw } from '../html.js';
import { strings } from '../strings.js';

const INK = '#1e3a2f';

const ICONS = {
  hypothesis: `<circle cx="12" cy="12" r="8.5" fill="#e7e0f0" stroke="${INK}" stroke-width="1.6" stroke-dasharray="2.6 2"/><path d="M10 9.6a2.1 2.1 0 1 1 2.9 1.9c-.6.3-.9.7-.9 1.3v.4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="12" cy="15.8" r=".9" fill="${INK}"/>`,
  testing: `<circle cx="12" cy="12" r="8.5" fill="#faf7f0" stroke="${INK}" stroke-width="1.6"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="#f2cf63" stroke="${INK}" stroke-width="1.6"/>`,
  verified: `<circle cx="12" cy="12" r="8.5" fill="#9cc8a0" stroke="${INK}" stroke-width="1.6"/><path d="M8.4 12.2l2.5 2.5 4.7-5.1" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  revised: `<circle cx="12" cy="12" r="8.5" fill="#f6dfcd" stroke="${INK}" stroke-width="1.6"/><path d="M16 11.5a4 4 0 1 1-1.2-2.8" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M15.1 6.9v2.1H13" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
};

/**
 * @param {string} status  One of hypothesis, testing, verified, revised.
 * @param {string} [lang]
 */
export function statusChip(status, lang = 'en') {
  if (!Object.hasOwn(ICONS, status)) throw new Error(`blog: unknown status "${status}"`);
  return markup`<span class="status status-${status}"><svg class="status-icon status-icon-${status}" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${raw(ICONS[status])}</svg>${strings(lang).statusLabels[status]}</span>`;
}
