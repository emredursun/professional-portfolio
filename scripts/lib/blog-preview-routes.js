/**
 * Makes `vite preview` answer blog paths the way Firebase Hosting does.
 *
 * Vite's preview serves dist/x.html for /x (like Firebase cleanUrls), but for
 * any path without a file it falls back to the SPA shell with a 200. Firebase
 * has no rewrite for /blog, so an unknown blog path gets 404.html with a real
 * 404, and with trailingSlash: false a trailing slash is a 301. This plugin
 * reproduces both for blog paths only; the portfolio's routes are untouched.
 *
 * It answers before Vite's static server, which is where preview.headers are
 * applied, so it sets the production security headers itself: a 404 page
 * must be tested under the same CSP as everything else.
 */

import fs from 'fs';
import path from 'path';

const BLOG_PATH = /^\/(?:(?:tr|nl)\/)?blog(?:\/|$)/;

/**
 * @param {{ distDir: string, headers: Record<string, string> }} options
 */
export function createBlogRouteHandler({ distDir, headers }) {
  const root = path.resolve(distDir);
  return (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://preview.local');
    const { pathname } = url;
    if (!BLOG_PATH.test(pathname)) return next();

    const redirect = (location) => {
      res.statusCode = 301;
      res.setHeader('Location', `${location}${url.search}`);
      return res.end();
    };
    if (pathname.endsWith('/')) return redirect(pathname.replace(/\/+$/, ''));

    /** A file inside dist, or '' for anything that would leave it or does not decode. */
    const inDist = (relative) => {
      try {
        const file = path.resolve(root, `.${decodeURIComponent(relative)}`);
        return file.startsWith(root + path.sep) && fs.existsSync(file) ? file : '';
      } catch {
        return '';
      }
    };

    // Other files (the feed) are served as they are.
    const extension = path.posix.extname(pathname);
    if (extension && extension !== '.html') {
      if (inDist(pathname)) return next();
    } else {
      // cleanUrls: /blog/x.html for an existing page redirects to /blog/x.
      const clean = pathname.replace(/\.html$/, '');
      const exists = Boolean(inDist(`${clean}.html`));
      if (exists && clean !== pathname) return redirect(clean);
      if (exists) return next();
    }

    res.statusCode = 404;
    Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(fs.readFileSync(path.join(root, '404.html')));
  };
}

/**
 * @param {Record<string, string>} headers  The production headers (firebase.json "/**").
 * @returns {import('vite').Plugin}
 */
export function blogPreviewRoutes(headers) {
  return {
    name: 'blog-preview-routes',
    configurePreviewServer(server) {
      const distDir = path.resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use(createBlogRouteHandler({ distDir, headers }));
    },
  };
}
