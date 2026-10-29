/**
 * The link-preview card (1200 × 630) for a post or a language's blog pages,
 * as one HTML document. Only `npm run blog:og` renders it, in a local
 * browser, to a PNG that is committed; it is never served, so its inline
 * <style> is outside the site's CSP. Text still goes through `markup`.
 *
 * Changing this file marks every committed card stale (og.js hashes it), so
 * a design change cannot ship with old images.
 */

import { markup, raw } from '../html.js';
import { strings } from '../strings.js';
import { verificationMark } from './mark.js';
import { statusChip } from './status.js';

const STYLE = `
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px}
body{display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;
  background:#faf7f0;color:#1e3a2f;font-family:'Bricolage Grotesque Variable',sans-serif}
.top{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700}
.top .name{color:#4d5e55;font-weight:500}
.mark{color:#1e3a2f}.mark-ring{stroke:currentColor}.mark-head{fill:currentColor;stroke:currentColor}
.mark-check{stroke:#3f6b52}
.meta{display:flex;align-items:center;gap:18px;margin-bottom:24px;font-size:26px;color:#4d5e55;font-weight:600}
.status{display:inline-flex;align-items:center;gap:10px;padding:8px 20px;border-radius:999px;
  color:#1e3a2f;font-size:24px;font-weight:700}
.status-icon{width:26px;height:26px}
.status-verified{background:#9cc8a0}.status-testing{background:#f2cf63}
.status-hypothesis{background:#e7e0f0}.status-revised{background:#f6dfcd}
h1{font-size:68px;line-height:1.08;letter-spacing:-0.025em;font-weight:750;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.foot{display:flex;justify-content:space-between;font-size:26px;color:#4d5e55;
  border-top:2px solid rgba(30,58,47,.16);padding-top:24px}
`;

/**
 * @param {{ card: { kind: 'post' | 'site', lang: string, title: string, status?: string, topic?: string }, fontCss: string }} options
 *   `fontCss`: @font-face rules with the fonts embedded, from og.js.
 * @returns {string}
 */
export function renderOgCard({ card, fontCss }) {
  const s = strings(card.lang);
  const meta =
    card.kind === 'post'
      ? markup`<p class="meta">${statusChip(card.status, card.lang)}<span>${s.topicLabels[card.topic]}</span></p>`
      : markup`<p class="meta">${Object.values(s.topicLabels).join(' · ')}</p>`;
  const page = markup`<!doctype html>
<html lang="${card.lang}">
<head><meta charset="utf-8"><style>${raw(fontCss)}${raw(STYLE)}</style></head>
<body>
<div class="top">${verificationMark({ size: 52 })}<span>emre.</span><span class="name">${s.blogName}</span></div>
<div>
${meta}
<h1>${card.title}</h1>
</div>
<div class="foot"><span>Emre Dursun</span><span>emredursun.nl</span></div>
</body>
</html>
`;
  return String(page);
}
