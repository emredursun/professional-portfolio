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
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-i18next', 'i18next'],
              'vendor-ui': ['framer-motion', 'lenis'],
              'vendor-3d': ['three'],
              'vendor-anim': ['gsap'],
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
