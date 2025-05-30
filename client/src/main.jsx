import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';
import { queryClient } from './config/queryClient';

// Enable React Query persistence (optional)
if (typeof window !== 'undefined') {
  import('@tanstack/query-sync-storage-persister').then(({ persistQueryClient }) => {
    import('@tanstack/react-query-persist-client').then(({ PersistQueryClientProvider }) => {
      const persister = {
        persistClient: async (client) => {
          const data = JSON.stringify(client);
          localStorage.setItem('REACT_QUERY_CACHE', data);
        },
        restoreClient: async () => {
          const data = localStorage.getItem('REACT_QUERY_CACHE');
          return data ? JSON.parse(data) : undefined;
        },
        removeClient: async () => {
          localStorage.removeItem('REACT_QUERY_CACHE');
        },
      };
      
      // Persist the client
      persistQueryClient({
        queryClient,
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      });
    });
  });
}

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
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);