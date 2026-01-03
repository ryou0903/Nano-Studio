import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Use relative base path to ensure the app works in any subdirectory (GitHub Pages)
  // or at the root (Preview/Dev environments), preventing 404s and redirect issues.
  base: './', 
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
});