import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from '../../stores';

// Defined OUTSIDE RouteErrorBoundary so React sees a stable component type
// and never needlessly remounts the error boundary.
const RouteErrorFallback = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('errors.pageError') || 'Page Error'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('errors.pageErrorDesc') || 'Something went wrong loading this page.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t('actions.retry') || 'Try Again'}
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t('actions.home') || 'Go Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const RouteErrorBoundary = ({ children, routeName }) => (
  <ErrorBoundary
    FallbackComponent={RouteErrorFallback}
    onError={(error) => console.error(`Route error in ${routeName}:`, error)}
    onReset={() => window.location.reload()}
  >
    {children}
  </ErrorBoundary>
);

export default RouteErrorBoundary;
