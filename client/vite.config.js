import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // In npm workspaces, packages are hoisted to the root node_modules.
    // preserveSymlinks lets Vite follow workspace symlinks correctly.
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    fs: {
      // Allow Vite's dev server to serve files from the workspace root
      // so it can reach root-level node_modules (hoisted by npm workspaces).
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/axios') || id.includes('socket.io-client') || id.includes('lucide-react')) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
});