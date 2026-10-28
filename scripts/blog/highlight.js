/**
 * Build-time code highlighting with Shiki.
 *
 * Shiki colours tokens with inline style attributes, which the site's CSP
 * (style-src 'self') would block. With defaultColor: false each token gets a
 * --shiki-dark variable instead, and transformerStyleToClass moves that into
 * a class; the build writes the rules to a hashed CSS file, and the blog's
 * stylesheet applies them (color: var(--shiki-dark)). The <pre> background
 * also comes from the blog's stylesheet, so the theme's background is dropped.
 * (With a single `theme`, Shiki 4 colours tokens after the transformers run,
 * so the inline colours would survive.)
 *
 * Code blocks are dark in both site themes, so one dark theme is enough. The
 * high-contrast variant keeps comments readable (WCAG AA) on the blog's
 * dark-green code background.
 */

import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { transformerStyleToClass } from '@shikijs/transformers';

const THEME = 'github-dark-high-contrast';
const ALIASES = { typescript: 'ts', javascript: 'js', sh: 'bash', yml: 'yaml' };

/** Removes the theme's inline background and keeps the block keyboard-scrollable. */
const plainPre = {
  name: 'blog:plain-pre',
  pre(node) {
    delete node.properties.style;
    node.properties.tabindex = '0';
  },
};

export async function createHighlight() {
  const highlighter = await createHighlighterCore({
    themes: [import('shiki/themes/github-dark-high-contrast.mjs')],
    langs: [
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/shellscript.mjs'),
      import('shiki/langs/yaml.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  const styleToClass = transformerStyleToClass({ classPrefix: 'sk-' });

  return {
    /**
     * @param {string} code
     * @param {string} lang  One of the languages the Markdown renderer accepts.
     */
    highlight(code, lang) {
      // Fenced code always ends in a newline; without trimming it Shiki adds an empty last line.
      return highlighter.codeToHtml(code.endsWith('\n') ? code.slice(0, -1) : code, {
        lang: ALIASES[lang] ?? lang,
        themes: { dark: THEME },
        defaultColor: false,
        transformers: [plainPre, styleToClass],
      });
    },

    /** The colour rules used so far, one per line, sorted for a stable file. */
    css() {
      const rules = styleToClass.getCSS().match(/\.[^{}]+\{[^{}]*\}/g) ?? [];
      return rules.length === 0 ? '' : `${[...rules].sort().join('\n')}\n`;
    },
  };
}
