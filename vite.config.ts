import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // shadcn / 21st.dev components import from "@/…".
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      // Vendor code changes rarely; separate chunks stay cached across app updates.
      output: { manualChunks: { react: ['react', 'react-dom'], motion: ['motion'] } },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: false,
    proxy: {
      // The browser NEVER sees the Sarvam key. All calls go through the
      // local Express proxy in server/proxy.mjs which injects the header.
      '/sarvam': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
