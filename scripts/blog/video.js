/**
 * Click-to-load video embeds in posts, written as a fenced block:
 *
 *   ```vimeo
 *   id: 1248246223
 *   title: The Collective 2026: where human and tech come together
 *   titleLang: en
 *   credit: Sopra Steria Benelux
 *   ```
 *
 * The page renders only its own placeholder: a title, a play button and a
 * plain "Watch on Vimeo" link. Nothing is requested from Vimeo until the
 * visitor presses play (blog/client/video.ts swaps in the player, with
 * dnt=1), so a visit sets no third-party cookies and the CSP needs
 * player.vimeo.com in frame-src only. Without JavaScript the play button
 * stays hidden and the link still works.
 */

import { markup } from './html.js';
import { strings } from './strings.js';

const KEYS = new Set(['id', 'title', 'titleLang', 'credit']);
const REQUIRED = ['id', 'title', 'credit'];

/**
 * @param {string} body  The fence's content.
 * @param {string} file
 * @returns {Record<string, string>}
 */
function parseFields(body, file) {
  const entries = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^([A-Za-z]+):\s*(.+)$/.exec(line);
      if (!match || !KEYS.has(match[1])) {
        throw new Error(`${file}: vimeo block: "${line}" is not one of ${[...KEYS].join(', ')}`);
      }
      return [match[1], match[2]];
    });
  const fields = Object.fromEntries(entries);
  const missing = REQUIRED.filter((key) => !fields[key]);
  if (missing.length) throw new Error(`${file}: vimeo block needs ${missing.join(', ')}`);
  if (!/^\d{1,12}$/.test(fields.id)) {
    throw new Error(`${file}: vimeo block: id "${fields.id}" must be the video's number`);
  }
  if (fields.titleLang && !/^[a-z]{2}$/.test(fields.titleLang)) {
    throw new Error(`${file}: vimeo block: titleLang "${fields.titleLang}" is not a language code`);
  }
  return fields;
}

const PLAY_ICON = markup`<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z"/></svg>`;

/**
 * @param {string} body
 * @param {{ file: string, lang: string }} options
 * @returns {string}
 */
export function renderVideo(body, { file, lang }) {
  const { id, title, titleLang, credit } = parseFields(body, file);
  const s = strings(lang);
  const noteId = `video-note-${id}`;
  const titleAttr = titleLang && titleLang !== lang ? markup` lang="${titleLang}"` : '';
  return String(markup`<figure class="video-embed" data-video-id="${id}" data-video-title="${title}">
<div class="video-frame">
<p class="video-title"${titleAttr}>${title}</p>
<button type="button" class="video-play" data-video-play aria-describedby="${noteId}">${PLAY_ICON}<span>${s.videoPlay}</span><span class="visually-hidden"${titleAttr}>: ${title}</span></button>
</div>
<figcaption><span id="${noteId}">${s.videoNote}</span> ${s.videoCredit} ${credit}. <a href="https://vimeo.com/${id}" rel="noopener noreferrer">${s.videoWatch}</a></figcaption>
</figure>
`);
}
