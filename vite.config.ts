import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Vite 构建配置
 * - base 使用 './'，保证通过 file:// 直接打开时相对路径正确
 * - viteSingleFile 将 JS/CSS 全部内联进 dist/index.html
 * - 大型图片/音频放在 public/assets，构建时原样复制到 dist/assets
 */
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    reportCompressedSize: false,
    // 小资源全部内联；public 目录的大文件不受此影响
    assetsInlineLimit: 100_000_000,
  },
  server: {
    port: 5173,
    open: false,
  },
});
