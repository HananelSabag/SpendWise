import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './app';
import './index.css';
import { queryClient } from './config/queryClient';

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
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-error mb-4">Oops! Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              We're sorry for the inconvenience. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary btn-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Render the app
console.log('🔧 [MAIN] React version:', React.version);
console.log('🔧 [MAIN] Environment:', import.meta.env.MODE);

ReactDOM.createRoot(document.getElementById('root')).render(
  // ✅ הסר StrictMode לפרודקשן-like behavior
  <ErrorBoundary>
    <PersistQueryClientProvider 
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        console.log('Query cache persisted successfully');
      }}
    >
      <App />
      {process.env.NODE_ENV === 'development' && (
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