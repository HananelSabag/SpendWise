import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './app';
import './index.css';
import { queryClient } from './config/queryClient';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

// Create storage persister
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_CACHE'
});

// Error boundary for the entire app
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Only log in development
    if (import.meta.env.MODE === 'development') {
      console.error('Application error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Since we can't use translations in class components outside context,
      // we'll use a functional component with basic error display
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-error mb-4">Application Error</h1>
            <p className="text-muted-foreground mb-4">
              Please refresh the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary btn-md"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
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
            style: {
              marginBottom: '60px',
            },
          }}
        />
      )}
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

// Setup global utilities for development
if (import.meta.env.MODE === 'development') {
  window.queryClient = queryClient;
}