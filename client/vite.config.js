import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Let Vite handle environment loading automatically
  console.log('🔍 Vite Mode:', mode, 'Command:', command);
  
  // Mode-specific configuration
  const isAdmin = mode === 'admin';
  const isAnalytics = mode === 'analytics';
  const isDev = command === 'serve';
  const isProd = command === 'build' && mode === 'production';
  
  return {
    plugins: [
      react({
        // ✅ Optimized React Fast Refresh for performance
        fastRefresh: true,
        babel: {
          plugins: [
            // Add admin/analytics specific optimizations
            ...(isAdmin ? [['@babel/plugin-transform-runtime']] : []),
          ]
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'SpendWise - Financial Management Platform',
          short_name: 'SpendWise',
          description: 'Smart financial management with analytics, admin system, and advanced features',
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
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // ✅ Enhanced caching for admin and analytics
          runtimeCaching: [
            {
              urlPattern: /^\/api\/v1\/admin\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'admin-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 5 * 60 // 5 minutes for admin data
                }
              }
            },
            {
              urlPattern: /^\/api\/v1\/analytics\//,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'analytics-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 10 * 60 // 10 minutes for analytics
                }
              }
            }
          ]
        }
      })
    ],
    
    // ✅ Enhanced path aliases for new architecture
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@config': path.resolve(__dirname, './src/config'),
        '@assets': path.resolve(__dirname, './src/assets'),
        // ✅ NEW: Admin system aliases
        '@admin': path.resolve(__dirname, './src/components/admin'),
        '@analytics': path.resolve(__dirname, './src/components/analytics'),
        '@api': path.resolve(__dirname, './src/api'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@translations': path.resolve(__dirname, './src/translations'),
        '@auth': path.resolve(__dirname, './src/components/auth'),
        '@pages': path.resolve(__dirname, './src/pages')
      }
    },
    
    // ✅ Enhanced server configuration
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      open: false, // ✅ Disable auto-open - let dev-clean.js handle it
      
      hmr: {
        host: 'localhost',
        port: 5174,
        overlay: true,
        clientPort: 5174
      },
      
      watch: {
        usePolling: false,
        interval: 1000,
        ignored: ['**/node_modules/**', '**/dist/**'],
        depth: 3
      },
      
      cors: true,
      middlewareMode: false
    },
    
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true
    },
    
    // ✅ Enhanced build optimization with admin/analytics chunking
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
            // Core React chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // UI and animation chunks
            'ui-vendor': ['framer-motion', '@radix-ui/react-tabs', 'lucide-react', '@heroicons/react'],
            
            // Data and API chunks
            'data-vendor': ['@tanstack/react-query', 'axios', 'date-fns', 'zustand'],
            
            // Chart and analytics chunks
            'chart-vendor': ['recharts', 'react-chartjs-2', 'chart.js'],
            
            // ✅ NEW: Admin system chunks
            'admin-vendor': ['react-table', 'react-window', 'react-virtualized-auto-sizer'],
            
            // ✅ NEW: OAuth and auth chunks
                            // 'auth-vendor': ['@google-cloud/oauth2'], // Removed - not used in client
            
            // ✅ NEW: Performance and utilities chunks
            'utils-vendor': ['react-error-boundary', 'use-debounce', 'react-intersection-observer', 'web-vitals'],
            
            // Form and validation chunks
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            
            // Styling chunks
            'style-vendor': ['clsx', 'classnames', 'tailwind-merge']
          }
        }
      },
      reportCompressedSize: true,
      chunkSizeWarningLimit: isAdmin ? 1500 : 1000, // Larger limit for admin builds
      sourcemap: isProd ? 'hidden' : true
    },
    
    // ✅ Enhanced dependency optimization
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
        'recharts',
        // ✅ NEW: Admin dependencies
        'react-table',
        'react-window',
        // ✅ NEW: Performance dependencies
        'react-error-boundary',
        'web-vitals'
      ],
      exclude: ['@vitejs/plugin-react'],
      force: isDev
    },
    
    // ✅ Enhanced environment definitions + FORCED Google Client ID
    define: {
      global: 'globalThis',
      __DEV__: isDev,
      __ADMIN_MODE__: isAdmin,
      __ANALYTICS_MODE__: isAnalytics,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
      // 🔥 FORCED ENVIRONMENT VARIABLES - F*CK THE .ENV SYSTEM
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('680960783178-vl2oi588lavo17vjd00p9kounnfam7kh.apps.googleusercontent.com'),
      'import.meta.env.VITE_API_URL': JSON.stringify(isDev ? 'http://localhost:10000/api/v1' : 'https://spendwise-dx8g.onrender.com/api/v1'),
      'import.meta.env.VITE_CLIENT_URL': JSON.stringify(isDev ? 'http://localhost:5173' : 'https://spendwise-client.vercel.app'),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify('true'),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(isDev ? 'development' : 'production'),
      'import.meta.env.MODE': JSON.stringify(isDev ? 'development' : 'production'),
      'import.meta.env.DEV': JSON.stringify(isDev),
      'import.meta.env.PROD': JSON.stringify(!isDev),
      'import.meta.env.VITE_APP_NAME': JSON.stringify('SpendWise'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify('2.0.0')
    },
    
    clearScreen: false,
    
    // ✅ Enhanced CSS configuration
    css: {
      devSourcemap: isDev,
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    },
    
    // ✅ Mode-specific configurations
    ...(isAdmin && {
      // Admin-specific optimizations
      build: {
        ...this.build,
        rollupOptions: {
          ...this.build?.rollupOptions,
          external: isDev ? [] : ['react-devtools-core']
        }
      }
    }),
    
    ...(isAnalytics && {
      // Analytics-specific optimizations
      optimizeDeps: {
        ...this.optimizeDeps,
        include: [
          ...this.optimizeDeps?.include || [],
          'chart.js',
          'react-chartjs-2'
        ]
      }
    })
  };
});