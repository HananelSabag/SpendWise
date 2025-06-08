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
      react(),
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
    
    // ✅ FINAL MOBILE SERVER - Production Ready
    server: {
      host: '0.0.0.0', // מאפשר גישה מהרשת
      port: 5173,
      strictPort: true,
      open: false, // לא לפתוח דפדפן אוטומטית
      
      // ✅ HMR למובייל
      hmr: {
        host: 'localhost',
        port: 5174
      },
      
      // ✅ Watch settings למובייל
      watch: {
        usePolling: true,
        interval: 1000
      }
    },
    
    // ✅ Preview server למובייל
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true
    },
    
    // ✅ Build אופטימלי לפרודקשן + מובייל
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
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      sourcemap: mode === 'production' ? 'hidden' : true
    },
    
    // ✅ Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'date-fns'
      ]
    }
  };
});