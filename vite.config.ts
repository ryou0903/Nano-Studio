import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pagesのリポジトリ名に合わせてベースパスを固定します。
  // これにより、assetsファイルへのパス切れ（404）や白い画面の問題を防ぎます。
  base: '/Nano-Studio/', 
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
});