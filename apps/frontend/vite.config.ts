import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const isDev = mode === 'development';
  const apiTarget = env.VITE_API_BASE || 'http://localhost:8787';

  return {
    plugins: [react()],
    
    define: {
      __DEV__: isDev,
      __PROD__: !isDev,
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    
    server: {
      port: 5173,
      host: true,
      proxy: isDev ? {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      } : undefined,
    },
    
    build: {
      outDir: 'dist',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'motion': ['framer-motion'],
            'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          },
        },
      },
    },
    
    preview: {
      port: 7171,
      host: true,
    },
  };
});
