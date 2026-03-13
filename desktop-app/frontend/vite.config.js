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

    // Minification (esbuild default in Vite 8)
    minify: 'esbuild',

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react'
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query'
          if (id.includes('node_modules/recharts')) return 'vendor-charts'
          if (id.includes('node_modules/react-router-dom')) return 'vendor-router'
          if (id.includes('node_modules/zustand')) return 'vendor-state'
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

})
