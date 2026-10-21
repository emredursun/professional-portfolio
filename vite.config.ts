import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      publicDir: 'public',
      build: {
        copyPublicDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          },
          output: {
            // Matched on the resolved path, not the package entry: the object
            // form only caught bare `react-dom` / `gsap`, so `react-dom/client`
            // (most of React) and `gsap/ScrollTrigger` landed in the app chunk
            // and were re-downloaded on every deploy.
            manualChunks(id: string) {
              if (!id.includes('node_modules')) return undefined;
              if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|i18next|react-i18next|i18next-[^\\/]+)[\\/]/.test(id)) return 'vendor-react';
              if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils|lenis)[\\/]/.test(id)) return 'vendor-ui';
              if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) return 'vendor-3d';
              if (/[\\/]node_modules[\\/]gsap[\\/]/.test(id)) return 'vendor-anim';
              return undefined;
            }
          }
        }
      },
      // No `define` block on purpose. The AI Studio template used to inline
      // GEMINI_API_KEY into the client bundle via process.env; nothing reads it,
      // and anything placed there ships to every visitor. Client-visible config
      // belongs in VITE_-prefixed env vars, which Vite exposes explicitly.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
