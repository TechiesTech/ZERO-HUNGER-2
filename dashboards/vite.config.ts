import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const source = new URL('./src/', import.meta.url);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('core/', source)),
      '@features': fileURLToPath(new URL('features/', source)),
      '@modules': fileURLToPath(new URL('modules/', source)),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
});
