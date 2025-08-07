import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';
  const isProd = command === 'build' || mode === 'production';
  
  return {
    plugins: [
      react({
        fastRefresh: true,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'SpendWise - Financial Management Platform',
          short_name: 'SpendWise',
          description: 'Smart financial management with analytics and advanced features',
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
        }
      })
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@config': path.resolve(__dirname, './src/config'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@admin': path.resolve(__dirname, './src/components/admin'),
        '@analytics': path.resolve(__dirname, './src/components/analytics'),
        '@api': path.resolve(__dirname, './src/api'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@translations': path.resolve(__dirname, './src/translations'),
        '@auth': path.resolve(__dirname, './src/components/auth'),
        '@pages': path.resolve(__dirname, './src/pages')
      }
    },
    
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      open: false,
      
      hmr: {
        host: 'localhost',
        port: 5174,
        overlay: true,
        clientPort: 5174
      },
      
      cors: true
    },
    
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true
    },
    
    build: {
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          pure_funcs: isProd ? ['console.log', 'console.debug'] : []
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', '@radix-ui/react-tabs', 'lucide-react'],
            'data-vendor': ['@tanstack/react-query', 'axios', 'date-fns', 'zustand'],
            'chart-vendor': ['recharts', 'react-chartjs-2', 'chart.js'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'style-vendor': ['clsx', 'classnames', 'tailwind-merge']
          }
        }
      },
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      sourcemap: isProd ? 'hidden' : true
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'date-fns',
        'zustand',
        'framer-motion',
        'lucide-react',
        'recharts'
      ],
      exclude: ['@vitejs/plugin-react'],
      force: isDev
    },
    
    // ✅ Production-Ready Environment Configuration
    define: {
      global: 'globalThis',
      __DEV__: isDev,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
      // Environment variables for runtime access
      'import.meta.env.VITE_API_URL': JSON.stringify(
        process.env.VITE_API_URL || 'https://spendwise-dx8g.onrender.com/api/v1'
      ),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        process.env.VITE_GOOGLE_CLIENT_ID || '680960783178-vl2oi588lavo17vjd00p9kounnfam7kh.apps.googleusercontent.com'
      ),
      'import.meta.env.VITE_CLIENT_URL': JSON.stringify(
        process.env.VITE_CLIENT_URL || (isDev 
          ? 'http://localhost:5173' 
          : 'https://spend-wise-kappa.vercel.app')
      ),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(
        process.env.VITE_DEBUG_MODE || (isDev ? 'true' : 'false')
      ),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(
        process.env.VITE_ENVIRONMENT || (isDev ? 'development' : 'production')
      )
    },
    
    clearScreen: false,
    
    css: {
      devSourcemap: isDev
    }
  };
});