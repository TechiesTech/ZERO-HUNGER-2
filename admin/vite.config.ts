import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // @/ maps to admin/src/
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
});
