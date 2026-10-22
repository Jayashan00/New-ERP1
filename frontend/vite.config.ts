import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@shared': path.resolve(__dirname, '../shared'), '@': path.resolve(__dirname, 'src') } },
  server: { port: 5173, fs: { allow: ['..'] } },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], charts: ['recharts'] } } },
  },
});
