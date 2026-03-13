import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build optimizations
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Target modern browsers for smaller bundle
    target: 'es2020',

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-router': ['react-router-dom'],
          'vendor-state': ['zustand'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging
    sourcemap: false,
  },

  // Development server optimizations
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use

    // Enable CORS
    cors: true,

    // Enhanced HMR configuration for Wails
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },

    // File watching configuration
    watch: {
      usePolling: false, // Set to true if HMR not working on Windows
      interval: 100,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },

    // Pre-transform frequently accessed files
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/features/**/*.jsx',
        './src/components/**/*.jsx',
        './src/stores/**/*.js',
      ],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'zustand',
      'recharts',
      'react-router-dom',
    ],
  },

  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})
