/**
 * Markdown to HTML for blog posts.
 *
 * Posts are written by the site owner, but the renderer still treats them as
 * untrusted: raw HTML is printed as text, every link and image URL goes
 * through an allowlist, and anything outside it fails the build instead of
 * being silently dropped (a quietly missing link is a bug nobody notices).
 * Whether a URL is external is decided the way a browser decides it, by
 * resolving it against the site, so "http:cdn.example/x.png" counts as
 * external even without the two slashes.
 *
 * Headings get unique ids that cannot clash with the ids the page template
 * uses, and feed the table of contents. The page title is the only h1, so the
 * body starts at h2 and may not skip a level. Setting the ids mutates
 * markdown-it's tokens; that is the library's intended API, and the tokens
 * never leave renderMarkdown.
 */

import MarkdownIt from 'markdown-it';
import { escapeHtml } from './html.js';
import { RESERVED_IDS } from './config.js';
import { POST_IMAGE } from './images.js';
import { strings } from './strings.js';

const SITE_HOST = 'emredursun.nl';
const SITE = new URL(`https://${SITE_HOST}/`);
const SCHEMES = new Set(['http', 'https', 'mailto']);
const LANGUAGES = new Set([
  'ts',
  'typescript',
  'js',
  'javascript',
  'json',
  'bash',
  'sh',
  'yaml',
  'yml',
  'text',
]);
// Letters NFKD does not decompose into a base letter plus a mark.
const FOLD = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', đ: 'd', ł: 'l', ı: 'i' };

/**
 * Why a URL is not allowed, or null when it is.
 * @param {string} url  As markdown-it hands it over: entities decoded, percent-encoded.
 */
function rejectReason(url) {
  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return 'malformed percent-encoding';
  }
  // Browsers ignore tabs, newlines and other control characters inside a
  // scheme and read a backslash as a slash, so "java\tscript:" and "/\host"
  // are as dangerous as their clean forms.
  const cleaned = decoded
    // eslint-disable-next-line no-control-regex -- matching control characters is the point
    .replace(/[\x00-\x20\x7f]/g, '')
    .replace(/\\/g, '/')
    .toLowerCase();
  if (cleaned.startsWith('//')) return 'protocol-relative links are not allowed';
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(cleaned)?.[1];
  if (scheme && !SCHEMES.has(scheme)) return `the ${scheme}: scheme is not allowed`;
  return null;
}

/**
 * @param {string} url
 * @param {string} file
 */
function isExternal(url, file) {
  let resolved;
  try {
    resolved = new URL(url, SITE);
  } catch {
    throw new Error(`${file}: "${url}" is not a valid URL`);
  }
  return /^https?:$/.test(resolved.protocol) && resolved.hostname !== SITE_HOST;
}

/** @param {string} text */
function slugify(text) {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[ßæœøđłı]/g, (char) => FOLD[char])
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Plain text of an inline token, for ids and the table of contents. */
function inlineText(token) {
  return (token.children ?? []).map((child) => child.content).join('');
}

/**
 * @param {string} file
 * @param {(code: string, lang: string) => string} [highlight]
 * @param {(name: string) => { src: string, width: number, height: number } | undefined} [image]
 */
function createRenderer(file, highlight, image) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

  md.validateLink = (url) => {
    const reason = rejectReason(url);
    if (reason) throw new Error(`${file}: link "${url}": ${reason}`);
    return true;
  };

  const renderToken = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options);

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    if (isExternal(tokens[idx].attrGet('href') ?? '', file)) {
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return renderToken(tokens, idx, options, env, self);
  };

  // A post that opens with an image shows it above the fold: it is the page's
  // largest paint, so it loads at once instead of lazily.
  md.core.ruler.push('lead_image', (state) => {
    const [first, inline] = state.tokens;
    const image = inline?.children?.[0];
    if (first?.type === 'paragraph_open' && image?.type === 'image') {
      image.meta = { ...image.meta, lead: true };
    }
  });

  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx];
    const src = token.attrGet('src') ?? '';
    if (isExternal(src, file)) {
      throw new Error(`${file}: image "${src}": images must be served from this site`);
    }
    if (!POST_IMAGE.test(src)) {
      throw new Error(`${file}: image "${src}": put it next to the post and use its bare name`);
    }
    const alt = inlineText(token).trim();
    if (alt === '') throw new Error(`${file}: image "${src}" needs alt text`);
    const found = image?.(src);
    if (!found) throw new Error(`${file}: image "${src}" not found next to the post`);
    // Width and height reserve the space, so the text does not jump as it loads.
    return (
      `<img src="${escapeHtml(found.src)}" alt="${escapeHtml(alt)}" ` +
      `width="${found.width}" height="${found.height}" ` +
      (token.meta?.lead
        ? 'fetchpriority="high" decoding="async">'
        : 'loading="lazy" decoding="async">')
    );
  };

  // A table scrolls inside its own region, so a wide one never widens the page.
  // The region is named (with a number, so two on one page stay distinct
  // landmarks); blog/client/tables.ts makes it focusable while it scrolls.
  // Columns of figures get a class the stylesheet right-aligns, columns of
  // long text one that gives them a readable minimum width.
  md.core.ruler.push('table_columns', markNumericColumns);
  md.renderer.rules.table_open = (tokens, idx, options, _env, self) =>
    `<div class="table-wrap" role="region" aria-label="${escapeHtml(tokens[idx].meta.label)}">` +
    self.renderToken(tokens, idx, options);
  md.renderer.rules.table_close = (tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options) + '</div>\n';

  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    const lang = token.info.trim().split(/\s+/)[0] || 'text';
    if (!LANGUAGES.has(lang)) {
      throw new Error(`${file}: code language "${lang}" is not supported`);
    }
    return highlight
      ? highlight(token.content, lang)
      : `<pre><code>${escapeHtml(token.content)}</code></pre>\n`;
  };

  md.renderer.rules.code_block = () => {
    throw new Error(`${file}: indented code blocks are not supported; use a fenced block`);
  };

  return md;
}

// A number or amount: optional sign and currency, grouped digits, optional
// percent or multiplication sign. "€99 a month" is prose, so it is not.
const NUMERIC = /^[+\-−~≈]?\s?[€$£]?\s?[+\-−]?%?\d[\d.,\s]*\s?[%×x€$£]?$/u;
// A column whose cells average more than this many characters is prose, and
// gets a readable minimum width so the table scrolls instead of growing tall.
const LONG_TEXT = 40;
const NO_VALUE = /^(?:[-–—]|n\/a)?$/i;

/** Text of a table cell's inline token. */
const cellText = (inline) =>
  (inline?.children ?? [])
    .map((child) => child.content)
    .join('')
    .trim();

/**
 * Names each table and marks right-aligned columns: those a markdown author
 * aligned with ---:, and those where most filled body cells are figures
 * (1,209  €1.663,20  1.663,20 €  25%  %25). Columns of long text get "txt".
 * markdown-it's own inline text-align style would break the site's CSP, so it
 * is dropped in favour of the class.
 */
function markNumericColumns(state) {
  const { tokens } = state;
  const name = strings(state.env?.lang ?? 'en').tableLabel;
  let count = 0;
  tokens.forEach((table, start) => {
    if (table.type !== 'table_open') return;
    count += 1;
    const end = tokens.findIndex((token, i) => i > start && token.type === 'table_close');
    const cells = [];
    let col = 0;
    let inHead = false;
    for (let i = start; i < end; i += 1) {
      const token = tokens[i];
      if (token.type === 'thead_open') inHead = true;
      if (token.type === 'thead_close') inHead = false;
      if (token.type === 'tr_open') col = 0;
      if (token.type === 'th_open' || token.type === 'td_open') {
        cells.push({ open: token, col, head: inHead, text: cellText(tokens[i + 1]) });
        col += 1;
      }
    }
    const columns = new Map();
    for (const cell of cells) {
      const entry = columns.get(cell.col) ?? { numeric: 0, other: 0, right: false, chars: 0 };
      if (!cell.head && !NO_VALUE.test(cell.text)) {
        if (NUMERIC.test(cell.text)) entry.numeric += 1;
        else entry.other += 1;
        entry.chars += cell.text.length;
      }
      if (/text-align:\s*right/.test(cell.open.attrGet('style') ?? '')) entry.right = true;
      columns.set(cell.col, entry);
    }
    for (const cell of cells) {
      cell.open.attrs = (cell.open.attrs ?? []).filter(([attr]) => attr !== 'style');
      const entry = columns.get(cell.col);
      // Mostly figures: right-aligned. A stray word (a "-", "Set by Tesla")
      // does not veto it, and wraps normally.
      if (entry.right || (entry.numeric >= 2 && entry.numeric > entry.other)) {
        cell.open.attrJoin('class', 'num');
      } else if (entry.chars / Math.max(entry.numeric + entry.other, 1) > LONG_TEXT) {
        cell.open.attrJoin('class', 'txt');
      }
      // A figure never breaks across lines, even in a column that mixes in words.
      if (!cell.head && NUMERIC.test(cell.text)) cell.open.attrJoin('class', 'fig');
    }
    const heads = cells.filter((cell) => cell.head && cell.text).map((cell) => cell.text);
    table.meta = { label: `${name} ${count}${heads.length ? `: ${heads.join(', ')}` : ''}` };
  });
}

/** The first of base, base-2, base-3, ... that is not taken yet. */
function uniqueId(base, used) {
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

/**
 * Walks the headings once: validates levels, assigns ids, collects the TOC.
 * @returns {Array<{ level: number, id: string, text: string }>}
 */
function outline(tokens, file) {
  const used = new Set(RESERVED_IDS);
  let previous = 1;
  return tokens.flatMap((token, idx) => {
    if (token.type !== 'heading_open') return [];
    const level = Number(token.tag.slice(1));
    if (level === 1) throw new Error(`${file}: use ## for sections; the post title is the only h1`);
    if (level > previous + 1) {
      throw new Error(
        `${file}: h${level} follows h${previous}; heading levels must not be skipped`,
      );
    }
    previous = level;

    const text = inlineText(tokens[idx + 1]);
    const id = uniqueId(slugify(text) || 'section', used);
    used.add(id);
    token.attrSet('id', id);
    return level <= 3 ? [{ level, id, text }] : [];
  });
}

/**
 * @param {string} source
 * @param {{ file: string, highlight?: (code: string, lang: string) => string, image?: (name: string) => { src: string, width: number, height: number } | undefined, lang?: string }} options
 *   `lang`: the post's language, for the words the renderer adds (table labels).
 *   `image`: the post's own images by bare name (images.js), as served.
 * @returns {{ html: string, toc: Array<{ level: number, id: string, text: string }>, hasCode: boolean }}
 */
export function renderMarkdown(source, { file, highlight, image, lang }) {
  const md = createRenderer(file, highlight, image);
  const tokens = md.parse(source, { lang });
  const toc = outline(tokens, file);
  const hasCode = tokens.some((token) => token.type === 'fence');
  return { html: md.renderer.render(tokens, md.options, { lang }), toc, hasCode };
}
