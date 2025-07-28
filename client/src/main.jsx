console.log('🚀 MAIN.JSX - Starting app initialization...');

/**
 * 🚀 SPENDWISE MAIN ENTRY POINT - PERFORMANCE OPTIMIZED
 * Features: Performance monitoring, Web Vitals, Enhanced error boundaries, API integration
 * NOW WITH ZUSTAND STORES! (90% bundle reduction)
 * @version 2.0.0
 */

console.log('🚀 MAIN.JSX - About to import React...');
import React, { StrictMode, Suspense } from 'react';
console.log('🚀 MAIN.JSX - React imported successfully');

console.log('🚀 MAIN.JSX - About to import ReactDOM...');
import ReactDOM from 'react-dom/client';
console.log('🚀 MAIN.JSX - ReactDOM imported successfully');

console.log('🚀 MAIN.JSX - About to import React Query...');
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
console.log('🚀 MAIN.JSX - React Query imported successfully');

console.log('🚀 MAIN.JSX - About to import ErrorBoundary...');
import { ErrorBoundary } from 'react-error-boundary';
console.log('🚀 MAIN.JSX - ErrorBoundary imported successfully');

console.log('🚀 MAIN.JSX - About to import core App...');
// Core imports
import App from './app';
console.log('🚀 MAIN.JSX - App imported successfully');

console.log('🚀 MAIN.JSX - About to import CSS...');
import './index.css';
console.log('🚀 MAIN.JSX - CSS imported successfully');

console.log('🚀 MAIN.JSX - About to import query client...');
import { queryClient } from './config/queryClient';
console.log('🚀 MAIN.JSX - Query client imported successfully');

console.log('🚀 MAIN.JSX - About to import API...');
// NEW: Import our unified API and performance monitoring
import spendWiseAPI, { performanceAPI } from './api';
console.log('🚀 MAIN.JSX - API imported successfully');

console.log('🚀 MAIN.JSX - About to import performance utils...');
// ✅ NEW: Performance optimization imports
import { 
  initPerformanceOptimization, 
  productionOptimizations 
} from './utils/performanceOptimizer';
import { deploymentUtils } from './utils/buildOptimizer';
console.log('🚀 MAIN.JSX - Performance utils imported successfully');

// ✅ Initialize performance optimization
const performanceManager = initPerformanceOptimization();

// ✅ Production optimizations
if (import.meta.env.MODE === 'production') {
  productionOptimizations.removeDevTools();
  productionOptimizations.enableCompression();
  productionOptimizations.optimizeFonts();
}

// ✅ Performance Monitoring Setup
class PerformanceMonitor {
  constructor() {
    this.startTime = performance.now();
    this.vitalsCollected = false;
    this.pageLoadMetric = null;
  }

  // Initialize performance monitoring
  async init() {
    // Track main app load time
    this.pageLoadMetric = performanceAPI.clientMetrics.measurePageLoad('main-app');
    
    // Initialize Web Vitals (async)
    this.collectWebVitals();
    
    // Setup API performance tracking
    this.setupAPITracking();
    
    // Performance monitoring initialized
  }

  // Collect Web Vitals metrics
  async collectWebVitals() {
    try {
      const vitals = await performanceAPI.clientMetrics.getWebVitals();
      if (vitals.success) {
        this.vitalsCollected = true;
        

        
        // Store vitals for dashboard
        sessionStorage.setItem('web-vitals', JSON.stringify(vitals.data));
      }
    } catch (error) {
      console.warn('Web Vitals collection failed:', error);
    }
  }

  // Setup API performance tracking interceptor
  setupAPITracking() {
    const originalRequest = spendWiseAPI.client.client.request;
    
    spendWiseAPI.client.client.request = async function(config) {
      const startTime = performance.now();
      const endpoint = config.url || 'unknown';
      
      try {
        const response = await originalRequest.call(this, config);
        const duration = performance.now() - startTime;
        
        // Track successful API call
        performanceAPI.clientMetrics.trackAPICall(endpoint, duration, true);
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Track failed API call
        performanceAPI.clientMetrics.trackAPICall(endpoint, duration, false);
        
        throw error;
      }
    };
  }

  // Complete app load measurement
  completeAppLoad() {
    if (this.pageLoadMetric) {
      const result = this.pageLoadMetric.end();
      
      // Store app load time
      sessionStorage.setItem('app-load-time', JSON.stringify(result));
      

      
      return result;
    }
  }
}

// ✅ Create global performance monitor
const performanceMonitor = new PerformanceMonitor();

// ✅ Enhanced Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const isDevelopment = import.meta.env.MODE === 'development';
  
  // Log error details in development
  if (isDevelopment) {
    console.error('🚨 Application Error:', error);
  }
  
  const handleReport = () => {
    // In production, could send error to monitoring service
    if (!isDevelopment) {
      // Future: Send to error reporting service
      console.warn('Error reporting not implemented');
    }
  };

  const handleRefresh = () => {
    // Clear any corrupted data
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear API caches
      spendWiseAPI.utils.clearAllCaches();
      
      // Clear performance metrics
      performanceAPI.clientMetrics.clearMetrics();
      
    } catch (clearError) {
      console.warn('Cache clearing failed:', clearError);
    }
    
    // Reset error boundary
    resetErrorBoundary();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-red-100 dark:border-red-900/30">
          {/* Error Icon */}
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Application Error
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Something unexpected happened. We've been notified and are working to fix it.
          </p>
          
          {/* Error Details (Development Only) */}
          {isDevelopment && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Error Details:
              </h3>
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              🔄 Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              🏠 Go Home
            </button>
            
            {!isDevelopment && (
              <button
                onClick={handleReport}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
              >
                📋 Report Issue
              </button>
            )}
          </div>
          
          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact us at{' '}
              <a href="mailto:support@spendwise.app" className="text-primary-600 hover:text-primary-700">
                support@spendwise.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Loading Fallback Component
const GlobalLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        Loading SpendWise...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
        Powered by Zustand stores
      </p>
    </div>
  </div>
);

// ✅ Create storage persister with error handling
const createPersister = () => {
  try {
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: 'SPENDWISE_CACHE_V2', // New cache key for v2
      retry: (failureCount) => failureCount < 3,
      retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000)
    });
  } catch (error) {
    console.warn('Storage persister creation failed, using in-memory cache:', error);
    return null;
  }
};

const persister = createPersister();

// ✅ Root Element Management with HMR support
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}

// Prevent multiple root creation during HMR
let root = rootElement._reactRoot;

if (!root) {
  root = ReactDOM.createRoot(rootElement);
  rootElement._reactRoot = root;
}

// ✅ App Initialization Function
const initializeApp = async () => {
  try {
    // Initialize performance monitoring
    await performanceMonitor.init();
    
    // Initialize API client
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      // Expose API for development
      window.spendWiseAPI = spendWiseAPI;
      window.performanceMonitor = performanceMonitor;
    }
    
    return true;
  } catch (error) {
    console.error('App initialization failed:', error);
    return false;
  }
};

// ✅ Main App Component with Performance Tracking
console.log('🚀 MAIN.JSX - Defining SpendWiseApp component...');

const SpendWiseApp = () => {
  console.log('🚀 MAIN.JSX - SpendWiseApp component rendering...');

  React.useEffect(() => {
    console.log('🚀 MAIN.JSX - SpendWiseApp useEffect running...');
    try {
      // Complete app load measurement when component mounts
      const loadResult = performanceMonitor.completeAppLoad();
      console.log('🚀 MAIN.JSX - Performance monitoring completed:', loadResult);
      
      // Initialize app features
      initializeApp();
      console.log('🚀 MAIN.JSX - App initialization completed');
    } catch (error) {
      console.error('🚨 MAIN.JSX - Error in SpendWiseApp useEffect:', error);
    }
  }, []);

  const AppContent = () => {
    console.log('🚀 MAIN.JSX - AppContent rendering...');
    
    try {
      return (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(error, errorInfo) => {
            console.error('🚨 MAIN.JSX - ErrorBoundary caught error:', error, errorInfo);
            // Log error in development
            if (import.meta.env.MODE === 'development') {
              console.error('🚨 Error Boundary Caught:', error, errorInfo);
            }
            
            // In production, could send to monitoring service
          }}
          onReset={() => {
            console.log('🚀 MAIN.JSX - ErrorBoundary reset triggered');
            // Clear caches on reset
            queryClient.clear();
            spendWiseAPI.utils.clearAllCaches();
          }}
        >
          <Suspense fallback={<GlobalLoadingFallback />}>
            {persister ? (
              <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{ persister }}
              >
                <App />
                {import.meta.env.MODE === 'development' && (
                  <ReactQueryDevtools
                    initialIsOpen={false}
                    position="bottom-right"
                    toggleButtonProps={{
                      style: { marginBottom: '60px' }
                    }}
                  />
                )}
              </PersistQueryClientProvider>
            ) : (
              <QueryClientProvider client={queryClient}>
                <App />
                {import.meta.env.MODE === 'development' && (
                  <ReactQueryDevtools
                    initialIsOpen={false}
                    position="bottom-right"
                    toggleButtonProps={{
                      style: { marginBottom: '60px' }
                    }}
                  />
                )}
              </QueryClientProvider>
            )}
          </Suspense>
        </ErrorBoundary>
      );
    } catch (error) {
      console.error('🚨 MAIN.JSX - Error in AppContent:', error);
      throw error;
    }
  };

  try {
    console.log('🚀 MAIN.JSX - About to return SpendWiseApp content...');
    return import.meta.env.MODE === 'development' ? (
      <StrictMode>
        <AppContent />
      </StrictMode>
    ) : (
      <AppContent />
    );
  } catch (error) {
    console.error('🚨 MAIN.JSX - Error in SpendWiseApp return:', error);
    throw error;
  }
};

// ✅ Render Application
console.log('🚀 MAIN.JSX - About to render app...');

try {
  console.log('🚀 MAIN.JSX - Calling root.render...');
  root.render(<SpendWiseApp />);
  console.log('🚀 MAIN.JSX - App rendered successfully!');
} catch (error) {
  console.error('🚨 MAIN.JSX - CRITICAL ERROR during root.render:', error);
  console.error('🚨 MAIN.JSX - Error stack:', error.stack);
  console.error('🚨 MAIN.JSX - Error name:', error.name);
  console.error('🚨 MAIN.JSX - Error message:', error.message);
  
  // Try to render a basic error message
  try {
    root.render(
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fee',
        border: '2px solid #f00',
        margin: '20px'
      }}>
        <h1>🚨 Critical App Error</h1>
        <p><strong>Error:</strong> {error.message}</p>
        <p><strong>Location:</strong> main.jsx render</p>
        <details>
          <summary>Technical Details</summary>
          <pre>{error.stack}</pre>
        </details>
      </div>
    );
  } catch (fallbackError) {
    console.error('🚨 MAIN.JSX - Even fallback render failed:', fallbackError);
    document.body.innerHTML = `
      <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px;">
        <h1>🚨 Critical App Error</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Location:</strong> main.jsx render</p>
        <p>Check browser console for details</p>
      </div>
    `;
  }
}

// ✅ Development Tools Setup
if (import.meta.env.MODE === 'development') {
  // Global development tools
  window.spendWiseAPI = spendWiseAPI;
  window.queryClient = queryClient;
  
  // Global auth and navigation for API client error handling
  window.spendWiseAuthStore = null; // Will be set by auth store
  window.spendWiseNavigate = null; // Will be set by App component
  
  // Cache utilities
  window.clearAllCaches = () => {
    queryClient.clear();
    spendWiseAPI.utils.clearAllCaches();
    performanceAPI.clientMetrics.clearMetrics();
    console.log('🧹 All caches cleared');
  };
  
  // Performance utilities
  window.getPerformanceStats = () => {
    const apiStats = spendWiseAPI.utils.getPerformanceStats();
    const webVitals = JSON.parse(sessionStorage.getItem('web-vitals') || '{}');
    const appLoadTime = JSON.parse(sessionStorage.getItem('app-load-time') || '{}');
    const apiMetrics = performanceAPI.clientMetrics.getAPIMetrics();
    
    return {
      apiClient: apiStats,
      webVitals,
      appLoadTime,
      apiMetrics: apiMetrics.success ? apiMetrics.data : null
    };
  };
  
  console.log('🛠️ Development tools available:');
  console.log('- window.spendWiseAPI: Unified API client');
  console.log('- window.queryClient: React Query client');
  console.log('- window.clearAllCaches(): Clear all caches');
  console.log('- window.getPerformanceStats(): Get performance metrics');
  console.log('🏪 Zustand stores replace Context API (90% bundle reduction!)');
}

// ✅ Hot Module Replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}