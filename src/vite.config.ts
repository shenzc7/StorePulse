import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9005',
        changeOrigin: true,
      },
    },
  },
  
  resolve: {
    
    alias: {
      
      '@': resolve(__dirname, '.'),
      
      '@/src': resolve(__dirname, 'src'),
      
      '@/lib': resolve(__dirname, 'src/lib'),
      
      '@/hooks': resolve(__dirname, 'src/hooks'),
      
      '@/stores': resolve(__dirname, 'src/stores'),
      
      '@/styles': resolve(__dirname, 'src/styles'),
      
      '@/types': resolve(__dirname, 'src/types'),
      
      '@/components': resolve(__dirname, 'components'),
      
      '@/pages': resolve(__dirname, 'pages'),
    },
  },
});
