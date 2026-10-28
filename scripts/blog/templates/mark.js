/**
 * The verification-loop mark: a ring, a solid arrowhead and a check, drawn on
 * a 48-unit grid (see the identity board). Colours come from CSS classes so
 * the mark follows the theme without inline styles.
 */

import { markup } from '../html.js';

/** @param {{ size: number }} options */
export function verificationMark({ size }) {
  return markup`<svg class="mark" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false"><path class="mark-ring" d="M39 24a15 15 0 1 1-4.4-10.6" stroke-width="4" stroke-linecap="round"/><path class="mark-head" d="M38.1 16.9L36.7 9.1L30.3 15.5Z" stroke-width="1.4" stroke-linejoin="round"/><path class="mark-check" d="M17 24.5l4.5 4.5 9-9.5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
