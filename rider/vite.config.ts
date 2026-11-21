import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const source = new URL('./src/', import.meta.url);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(source),
    },
  },
  // Exclude maplibre-gl from Vite's dependency pre-bundling so its
  // built-in WebWorker loads from the correct URL in both dev and build.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 5175,
    host: '0.0.0.0',
  },
  build: {
    // Optimize for mobile/PWA
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Manual chunks for better code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('maplibre-gl')) return 'vendor-maplibre';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            if (id.includes('lucide-react')) return 'vendor-icons';
          }
        },
      },
    },
  },
});

