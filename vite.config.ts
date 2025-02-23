import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Enable long term caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
        // Add hash to chunk filenames for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    headers: {
      // Prevent caching during development
      'Cache-Control': 'no-store'
    }
  },
  preview: {
    headers: {
      // Configure caching for production preview
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
});
