/// <reference types="vitest/config" />
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Security headers declared once in firebase.json (production) and replayed by
 * `vite preview`, so CSP violations show up locally before they ship.
 */
function productionSecurityHeaders(): Record<string, string> {
  const firebase = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'firebase.json'), 'utf8'));
  const rule = firebase.hosting.headers.find((r: { source: string }) => r.source === '/**');
  return Object.fromEntries(
    rule.headers.map((h: { key: string; value: string }) => [h.key, h.value]),
  );
}

/**
 * Emit dist/404.html, a copy of the app shell. firebase.json rewrites only
 * the app's real routes to index.html; Firebase answers every other path with
 * 404.html and a genuine 404 status, and the app then renders its NotFound
 * view there. Without it, unknown URLs and missing files returned the SPA
 * with a 200 - soft 404s.
 */
function notFoundPage(): Plugin {
  let outDir = 'dist';
  return {
    name: 'not-found-page',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      // Also called when the build failed; don't mask that error with ENOENT.
      const shell = path.join(outDir, 'index.html');
      if (fs.existsSync(shell)) fs.copyFileSync(shell, path.join(outDir, '404.html'));
    },
  };
}

export default defineConfig(() => {
  return {
    preview: {
      headers: productionSecurityHeaders(),
    },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.{ts,tsx}'],
      setupFiles: ['tests/setup.ts'],
      restoreMocks: true,
      // The JSON report feeds dist/quality.json (scripts/write-quality.js).
      reporters: ['default', 'json'],
      outputFile: { json: 'reports/vitest.json' },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        // Unit coverage is measured on logic modules. Page components are
        // exercised end to end by the Playwright suite in e2e/, and
        // faviconController draws to <canvas>, which jsdom cannot render.
        include: [
          'scripts/generate-sitemap.js',
          'scripts/generate-profile-readme.js',
          'scripts/write-version.js',
          'scripts/write-quality.js',
          'scripts/generate-agent-profile.js',
          'src/utils/decor.ts',
          'src/bootstrap.ts',
          'components/ErrorBoundary.tsx',
          'components/Preloader.tsx',
          'components/hooks/useIdleReady.tsx',
        ],
        thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), notFoundPage()],
    publicDir: 'public',
    build: {
      copyPublicDir: true,
      // Never inline fonts as data: URIs. Small @fontsource subsets fell under
      // the 4 KB default and were embedded in CSS, which the CSP's
      // font-src 'self' rightly refuses. Other small assets keep the default.
      assetsInlineLimit: (file: string) =>
        /\.(woff2?|ttf|otf|eot)$/i.test(file) ? false : undefined,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Matched on the resolved path, not the package entry: the object
          // form only caught bare `react-dom` / `gsap`, so `react-dom/client`
          // (most of React) and `gsap/ScrollTrigger` landed in the app chunk
          // and were re-downloaded on every deploy.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (
              /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|i18next|react-i18next|i18next-[^\\/]+)[\\/]/.test(
                id,
              )
            )
              return 'vendor-react';
            if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils|lenis)[\\/]/.test(id))
              return 'vendor-ui';
            if (/[\\/]node_modules[\\/]gsap[\\/]/.test(id)) return 'vendor-anim';
            return undefined;
          },
        },
      },
    },
    // No `define` block on purpose. The AI Studio template used to inline
    // GEMINI_API_KEY into the client bundle via process.env; nothing reads it,
    // and anything placed there ships to every visitor. Client-visible config
    // belongs in VITE_-prefixed env vars, which Vite exposes explicitly.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
