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
});

