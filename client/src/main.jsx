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

// Global error handler for role access errors
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes("Cannot read properties of undefined (reading 'role')")) {
    console.warn('🔧 CAUGHT role access error - using fallback');
    event.preventDefault(); // Prevent error from breaking the app
    return false;
  }
});

// Create React root and render
const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  root.render(<SpendWiseApp />);
} catch (error) {
  console.error('❌ Critical app error:', error);
  
  // Fallback UI
  root.render(
    React.createElement('div', {
      style: { 
        padding: '20px', 
        textAlign: 'center',
        fontFamily: 'system-ui'
      }
    }, [
      React.createElement('h1', { key: 'title' }, 'SpendWise'),
      React.createElement('p', { key: 'msg' }, 'Loading... Please refresh if this persists.'),
      React.createElement('button', { 
        key: 'refresh',
        onClick: () => window.location.reload(),
        style: { 
          padding: '10px 20px',
          margin: '10px',
          border: 'none',
          borderRadius: '5px',
          background: '#007bff',
          color: 'white',
          cursor: 'pointer'
        }
      }, 'Refresh Page')
    ])
  );
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