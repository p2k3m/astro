import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      'swisseph-v2': path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        './swisseph/index.js'
      ),
    },
  },
  define: {
    __dirname: JSON.stringify(new URL('.', import.meta.url).pathname),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
