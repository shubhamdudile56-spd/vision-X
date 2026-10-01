import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_TARGET = env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // Proxying keeps the browser on a single origin in dev, so the httpOnly
        // session cookie is sent without any cross-site cookie relaxation.
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': { target: API_TARGET, changeOrigin: true, secure: false }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 900
    }
  };
});

