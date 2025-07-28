/**
 * 🚀 MAIN APPLICATION ENTRY POINT
 * SpendWise client initialization with React Query and Error Boundaries
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

import App from './app.jsx';
import './index.css';

import { queryClient } from './config/queryClient';
import { api } from './api';

/**
 * 🚨 Application Error Fallback
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
      <div className="max-w-md w-full mx-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-red-200 dark:border-red-800">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.124 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
            {error?.message || 'An unexpected error occurred'}
          </p>
          
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 🎯 Main SpendWise Application
 */
function SpendWiseApp() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Create React root and render
const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  root.render(<SpendWiseApp />);
} catch (error) {
  console.error('🚨 CRITICAL ERROR during root.render:', error);
  
  // Fallback UI for critical render errors
  document.getElementById('root').innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); font-family: system-ui, -apple-system, sans-serif;">
      <div style="max-width: 400px; width: 100%; margin: 0 1rem; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); text-align: center;">
        <div style="color: #ef4444; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem;">Unable to load SpendWise</h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">Please refresh the page or contact support if the problem persists.</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
}

// Development tools (only in development)
if (import.meta.env.DEV) {
  // Global development helpers
  window.spendWiseAPI = api;
  window.queryClient = queryClient;
  window.clearAllCaches = () => {
    queryClient.clear();
    if (api.clearCache) api.clearCache();
  };
  window.getPerformanceStats = () => {
    return {
      memory: performance.memory,
      navigation: performance.navigation,
      timing: performance.timing
    };
  };
}