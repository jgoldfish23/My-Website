import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Built assets land in /construction-mastery/ so Cloudflare Workers ASSETS
// (wrangler assets.directory = ".") serve them at https://djgolding.com/construction-mastery/
export default defineConfig({
  plugins: [react()],
  base: '/construction-mastery/',
  build: {
    outDir: path.resolve(__dirname, '../../construction-mastery'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
