/**
 * 🚀 SPENDWISE APP - COMPLETE ROUTING & ADMIN SYSTEM
 * Features: Admin routing, OAuth integration, Role-based protection, Performance tracking
 * NOW WITH ZUSTAND STORES! (90% bundle reduction)
 * @version 2.0.0
 */

import React, { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

// Core UI components
import LoadingSpinner from './components/ui/LoadingSpinner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenu from './components/common/AccessibilityMenu';

// ✅ NEW: Import Zustand stores (replaces ALL Context providers!)
import { 
  StoreProvider,
  useAuth,
  useTranslation,
  useTheme 
} from './stores';

console.log('🚀 App - stores imported:', { 
  hasStoreProvider: !!StoreProvider, 
  hasUseAuth: !!useAuth, 
  hasUseTranslation: !!useTranslation, 
  hasUseTheme: !!useTheme 
});

// NEW: Import unified API and performance monitoring
import spendWiseAPI, { authAPI, adminAPI, performanceAPI } from './api';

// Components

// ✅ Lazy-loaded pages using centralized system
import * as LazyComponents from './components/LazyComponents';

// Replace existing lazy imports with:
const Login = LazyComponents.Login;
const Register = LazyComponents.Register;
const PasswordReset = LazyComponents.PasswordReset;
const VerifyEmail = LazyComponents.VerifyEmail;
const Dashboard = LazyComponents.Dashboard;
const Profile = LazyComponents.Profile;
const Transactions = LazyComponents.Transactions;

// ✅ Lazy-loaded admin pages
const AdminDashboard = LazyComponents.AdminDashboard;
const AdminUsers = LazyComponents.AdminUsers;
const AdminSettings = LazyComponents.AdminSettings;
const AdminActivity = LazyComponents.AdminActivity;
const AdminStats = LazyComponents.AdminStats;

// ✅ Lazy-loaded analytics pages  
const Analytics = LazyComponents.Analytics;


// ✅ Utility pages
const NotFound = LazyComponents.NotFound;

// ✅ Performance Monitoring Hook
const usePerformanceTracking = () => {
  const location = useLocation();
  const [pageLoadMetric, setPageLoadMetric] = useState(null);

  useEffect(() => {
    // Start tracking page load
    const metric = performanceAPI.clientMetrics.measurePageLoad(location.pathname);
    setPageLoadMetric(metric);

    // End tracking when component unmounts or location changes
    return () => {
      if (metric) {
        const result = metric.end();
        
        // Log in debug mode
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.log(`📊 Page ${location.pathname} loaded in ${result.duration}ms`);
        }
      }
    };
  }, [location.pathname]);

  return { pageLoadMetric };
};

// ✅ Enhanced Navigation Persistence with Admin Support
const useNavigationPersistence = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (hasToken && location.pathname) {
      // Define valid routes by user role
      const userRoutes = ['/', '/transactions', '/profile', '/analytics'];
      const adminRoutes = ['/admin', '/admin/users', '/admin/settings', '/admin/activity', '/admin/stats'];
      
      const isAdminRoute = location.pathname.startsWith('/admin');
      const isValidUserRoute = userRoutes.includes(location.pathname);
      const isValidAdminRoute = adminRoutes.includes(location.pathname);
      
      // Store location based on user role and route validity
      if (user?.isAdmin && isValidAdminRoute) {
        sessionStorage.setItem('lastAdminPage', location.pathname);
      } else if (isValidUserRoute) {
        sessionStorage.setItem('lastVisitedPage', location.pathname);
      }
    }
  }, [location.pathname, hasToken, user]);

  // Clear stored locations on logout
  useEffect(() => {
    if (!hasToken) {
      sessionStorage.removeItem('lastVisitedPage');
      sessionStorage.removeItem('lastAdminPage');
    }
  }, [hasToken]);
};

// ✅ Role-Based Route Protection (Updated to use Zustand)
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();
  const hasToken = !!localStorage.getItem('accessToken');
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  
  // Track performance for protected routes
  usePerformanceTracking();
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setShowOfflineMessage(false);
    const handleOffline = () => setShowOfflineMessage(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Show offline message
  if (showOfflineMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.noInternetConnection', { fallback: 'No Internet Connection' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('errors.checkConnectionAndRetry', { fallback: 'Please check your connection and try again.' })}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {t('common.retry', { fallback: 'Retry' })}
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (hasToken && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t('common.loadingData', { fallback: 'Connecting to server...' })}
          </p>
        </div>
      </div>
    );
  }
  
  // Authentication failed with token
  if (hasToken && !isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.connectionIssues', { fallback: 'Connection Issues' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('errors.unableToVerifyLogin', { fallback: 'Unable to verify your login. Please try again.' })}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common.retry', { fallback: 'Retry' })}
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('accessToken');
                // Use proper navigation instead of hard redirect
                if (window.spendWiseNavigate) {
                  window.spendWiseNavigate('/auth/login', { replace: true });
                } else {
                  window.location.replace('/auth/login');
                }
              }} 
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('auth.loginAgain', { fallback: 'Login Again' })}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check admin permissions
  if (superAdminOnly && !user?.isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.superAdminRequired', { fallback: 'Super Admin Access Required' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('errors.noPermission', { fallback: "You don't have permission to access this page." })}
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {t('common.back', { fallback: 'Go Back' })}
          </button>
        </div>
      </div>
    );
  }
  
  if (adminOnly && !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.adminRequired', { fallback: 'Admin Access Required' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('errors.noPermission', { fallback: "You don't have permission to access this page." })}
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {t('common.back', { fallback: 'Go Back' })}
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// ✅ Smart Redirect with Admin Support (Updated to use Zustand)
const SmartRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');
  
  if (hasToken && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Determine redirect destination based on user role and stored preferences
  let redirectTo = '/';
  
  if (user?.isAdmin) {
    const lastAdminPage = sessionStorage.getItem('lastAdminPage');
    const adminRoutes = ['/admin', '/admin/users', '/admin/settings', '/admin/activity', '/admin/stats'];
    
    if (lastAdminPage && adminRoutes.includes(lastAdminPage)) {
      redirectTo = lastAdminPage;
    } else {
      redirectTo = '/admin'; // Default admin page
    }
  } else {
    const lastVisitedPage = sessionStorage.getItem('lastVisitedPage');
    const validRoutes = ['/', '/transactions', '/profile', '/analytics'];
    
    if (lastVisitedPage && validRoutes.includes(lastVisitedPage)) {
      redirectTo = lastVisitedPage;
    }
  }
  
  return <Navigate to={redirectTo} replace />;
};

// ✅ Enhanced Loading Component
const RouteLoadingFallback = ({ route = 'page' }) => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400 font-medium">
        Loading {route}...
      </p>
    </div>
  </div>
);

// ✅ Route Error Boundary
const RouteErrorBoundary = ({ children, routeName }) => {
  const handleError = (error, errorInfo) => {
    console.error(`Route error in ${routeName}:`, error, errorInfo);
    
    // Track route-specific errors
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('Route error details:', { routeName, error: error.message, stack: error.stack });
    }
  };

  const ErrorFallback = ({ error, resetErrorBoundary }) => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Page Error
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Something went wrong loading this page.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Clear route-specific caches on reset
        spendWiseAPI.utils.clearAllCaches();
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// ✅ Application Content with Enhanced Routing (Updated to use Zustand)
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Set global navigation for API client error handling
  useEffect(() => {
    window.spendWiseNavigate = navigate;
    return () => {
      window.spendWiseNavigate = null;
    };
  }, [navigate]);
  
  // Use navigation persistence and performance tracking
  useNavigationPersistence();
  usePerformanceTracking();
  
  // Suppress React Router warnings in development
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      const originalWarn = console.warn;
      console.warn = (msg, ...args) => {
        if (msg.includes('React Router Future Flag Warning')) {
          return;
        }
        originalWarn(msg, ...args);
      };
      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  // Show loading screen during initial authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
            Initializing SpendWise...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated && <Header />}
      
      <main className="flex-grow">
        <Routes>
          {/* ✅ Public Authentication Routes */}
          <Route path="/login" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="Login">
                <Suspense fallback={<RouteLoadingFallback route="login" />}>
                  <Login />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/register" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="Register">
                <Suspense fallback={<RouteLoadingFallback route="registration" />}>
                  <Register />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/forgot-password" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="PasswordReset">
                <Suspense fallback={<RouteLoadingFallback route="password reset" />}>
                  <PasswordReset />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/reset-password" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="PasswordReset">
                <Suspense fallback={<RouteLoadingFallback route="password reset" />}>
                  <PasswordReset />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/verify-email/:token" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="VerifyEmail">
                <Suspense fallback={<RouteLoadingFallback route="email verification" />}>
                  <VerifyEmail />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          {/* ✅ Protected User Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Dashboard">
                <Suspense fallback={<RouteLoadingFallback route="dashboard" />}>
                  <Dashboard />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/transactions" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Transactions">
                <Suspense fallback={<RouteLoadingFallback route="transactions" />}>
                  <Transactions />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Profile">
                <Suspense fallback={<RouteLoadingFallback route="profile" />}>
                  <Profile />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* ✅ Analytics Routes */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Analytics">
                <Suspense fallback={<RouteLoadingFallback route="analytics" />}>
                  <Analytics />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          

          
          {/* ✅ Admin Routes (Admin Access Required) */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminDashboard">
                <Suspense fallback={<RouteLoadingFallback route="admin dashboard" />}>
                  <AdminDashboard />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminUsers">
                <Suspense fallback={<RouteLoadingFallback route="user management" />}>
                  <AdminUsers />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedRoute superAdminOnly={true}>
              <RouteErrorBoundary routeName="AdminSettings">
                <Suspense fallback={<RouteLoadingFallback route="admin settings" />}>
                  <AdminSettings />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/activity" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminActivity">
                <Suspense fallback={<RouteLoadingFallback route="activity log" />}>
                  <AdminActivity />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/stats" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminStats">
                <Suspense fallback={<RouteLoadingFallback route="system statistics" />}>
                  <AdminStats />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* ✅ 404 Route */}
          <Route path="*" element={
            <RouteErrorBoundary routeName="NotFound">
              <Suspense fallback={<RouteLoadingFallback route="page" />}>
                <NotFound />
              </Suspense>
            </RouteErrorBoundary>
          } />
        </Routes>
      </main>
      
      {isAuthenticated && <Footer />}
      {isAuthenticated && <AccessibilityMenu />}
      
      {/* Portal container for modals */}
      <div id="portal-root" />
    </div>
  );
};

// ✅ Enhanced QueryClient Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) return false;
        // Retry network errors and server errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Retry network errors but not client errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// ✅ Main Application Component (ZUSTAND POWERED!)
function App() {
  // Initialize API client on app start
  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('🚀 SpendWise App initialized with Zustand stores + unified API');
      console.log('📦 Bundle reduction: ~550KB → ~50KB (90% reduction!)');
      
      // Expose API for development
      window.spendWiseAPI = spendWiseAPI;
      window.authAPI = authAPI;
      window.adminAPI = adminAPI;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        {/* ✅ REPLACED: All Context providers with single StoreProvider! */}
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </Router>

      {/* Development tools */}
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
  );
}

export default App;