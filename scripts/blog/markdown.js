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
 * @param {{ file: string, highlight?: (code: string, lang: string) => string, image?: (name: string) => { src: string, width: number, height: number } | undefined }} options
 *   `image`: the post's own images by bare name (images.js), as served.
 * @returns {{ html: string, toc: Array<{ level: number, id: string, text: string }>, hasCode: boolean }}
 */
export function renderMarkdown(source, { file, highlight, image }) {
  const md = createRenderer(file, highlight, image);
  const tokens = md.parse(source, {});
  const toc = outline(tokens, file);
  const hasCode = tokens.some((token) => token.type === 'fence');
  return { html: md.renderer.render(tokens, md.options, {}), toc, hasCode };
}
