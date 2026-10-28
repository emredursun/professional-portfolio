/**
 * Client entry for blog article pages (second input in vite.config.ts).
 *
 * It brings the fonts and styles through Vite, so they get hashed file names
 * and immutable caching, and wires up the theme toggle. Everything else on the
 * page works without it. It must not import anything the portfolio app uses:
 * scripts/blog/manifest.js fails the build if this entry shares a chunk.
 */

import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/article.css';
import './styles/code.css';
import './styles/extras.css';
import { bindThemeToggle } from './theme-toggle';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
bindThemeToggle(document, () => darkQuery.matches);
