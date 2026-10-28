/**
 * Markdown to HTML for blog posts.
 *
 * Posts are written by the site owner, but the renderer still treats them as
 * untrusted: raw HTML is printed as text, every link and image URL goes
 * through an allowlist, and anything outside it fails the build instead of
 * being silently dropped (a quietly missing link is a bug nobody notices).
 *
 * Headings get stable ids and feed the table of contents. The page title is
 * the only h1, so the body starts at h2 and may not skip a level.
 */

import MarkdownIt from 'markdown-it';
import { escapeHtml } from './html.js';

const SITE_HOST = 'emredursun.nl';
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

/** @param {string} url */
function decode(url) {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

/**
 * Why a URL is not allowed, or null when it is.
 * @param {string} url  As markdown-it hands it over: entities decoded, percent-encoded.
 */
function rejectReason(url) {
  // Browsers ignore tabs, newlines and other control characters inside a
  // scheme and read a backslash as a slash, so "java\tscript:" and "/\host"
  // are as dangerous as their clean forms.
  const cleaned = decode(url)
    // eslint-disable-next-line no-control-regex -- matching control characters is the point
    .replace(/[\x00-\x20\x7f]/g, '')
    .replace(/\\/g, '/')
    .toLowerCase();
  if (cleaned.startsWith('//')) return 'protocol-relative links are not allowed';
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(cleaned)?.[1];
  if (scheme && !SCHEMES.has(scheme)) return `the ${scheme}: scheme is not allowed`;
  return null;
}

/** @param {string} url */
function isExternal(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  return new URL(url).hostname.toLowerCase() !== SITE_HOST;
}

/** @param {string} text */
function slugify(text) {
  return text
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
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
 */
function createRenderer(file, highlight) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

  md.validateLink = (url) => {
    const reason = rejectReason(url);
    if (reason) throw new Error(`${file}: link "${url}": ${reason}`);
    return true;
  };

  const renderToken = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options);

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    if (isExternal(tokens[idx].attrGet('href') ?? '')) {
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return renderToken(tokens, idx, options, env, self);
  };

  const renderImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet('src') ?? '';
    if (/^https?:\/\//i.test(src)) {
      throw new Error(`${file}: image "${src}": images must be served from this site`);
    }
    if (inlineText(token).trim() === '') {
      throw new Error(`${file}: image "${src}" needs alt text`);
    }
    return renderImage(tokens, idx, options, env, self);
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

  return md;
}

/**
 * Walks the headings once: validates levels, assigns ids, collects the TOC.
 * @returns {Array<{ level: number, id: string, text: string }>}
 */
function outline(tokens, file) {
  const seen = new Map();
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
    const base = slugify(text) || 'section';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    token.attrSet('id', id);
    return level <= 3 ? [{ level, id, text }] : [];
  });
}

/**
 * @param {string} source
 * @param {{ file: string, highlight?: (code: string, lang: string) => string }} options
 * @returns {{ html: string, toc: Array<{ level: number, id: string, text: string }>, hasCode: boolean }}
 */
export function renderMarkdown(source, { file, highlight }) {
  const md = createRenderer(file, highlight);
  const tokens = md.parse(source, {});
  const toc = outline(tokens, file);
  const hasCode = tokens.some((token) => token.type === 'fence' || token.type === 'code_block');
  return { html: md.renderer.render(tokens, md.options, {}), toc, hasCode };
}
