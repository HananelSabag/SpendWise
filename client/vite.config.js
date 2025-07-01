import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // ✅ FIX: Optimize React Fast Refresh to prevent DOM issues
        fastRefresh: true
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'SpendWise - Expense Tracker',
          short_name: 'SpendWise',
          description: 'Smart expense tracking with recurring transactions',
          theme_color: '#3B82F6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    
    // Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@config': path.resolve(__dirname, './src/config'),
        '@assets': path.resolve(__dirname, './src/assets')
      }
    },
    
    // ✅ OPTIMIZED: Mobile-friendly HMR with stability fixes
    server: {
      host: '0.0.0.0', // Allow network access
      port: 5173,
      strictPort: true,
      open: false, // Don't auto-open browser
      
      // ✅ FIXED: Stable HMR configuration
      hmr: {
        host: 'localhost',
        port: 5174,
        // ✅ FIX: Prevent HMR from interfering with React root
        overlay: true,
        clientPort: 5174
      },
      
      // ✅ OPTIMIZED: Watch settings for stability
      watch: {
        usePolling: false, // Disable polling for performance
        interval: 1000,
        ignored: ['**/node_modules/**', '**/dist/**'],
        // ✅ FIX: Prevent unnecessary reloads
        depth: 3
      },
      
      // ✅ ADD: CORS and middleware settings
      cors: true,
      middlewareMode: false
    },
    
    // ✅ Preview server for mobile
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true
    },
    
    // ✅ Build optimization for production + mobile
    build: {
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', '@radix-ui/react-tabs', 'lucide-react'],
            'data-vendor': ['@tanstack/react-query', 'axios', 'date-fns'],
            'chart-vendor': ['recharts']
          }
        }
      },
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      sourcemap: mode === 'production' ? 'hidden' : true
    },
    
    // ✅ Dependency optimization for stability
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'date-fns'
      ],
      // ✅ FIX: Exclude problematic dependencies from pre-bundling
      exclude: ['@vitejs/plugin-react'],
      // ✅ ADD: Force re-optimization on certain changes
      force: mode === 'development'
    },
    
    // ✅ ADD: Define globals to prevent runtime errors
    define: {
      global: 'globalThis',
      __DEV__: mode === 'development'
    },
    
    // ✅ ADD: Clear screen on reload for better debugging
    clearScreen: false
  };
});