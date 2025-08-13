/**
 * 🚀 SPENDWISE APP - CLEAN & OPTIMIZED
 * Features: Clean routing, Role-based protection, Optimized performance
 * @version 3.0.0 - MAJOR OPTIMIZATION
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

// Core UI components
import TopProgressBar from './components/common/TopProgressBar.jsx';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenu from './components/common/AccessibilityMenu';
import AccessibilityFab from './components/common/AccessibilityFab.jsx';
import OnboardingManager from './components/common/OnboardingManager';

// ✅ Zustand stores
import { StoreProvider, useAuth, useTranslation } from './stores';

// ✅ Toast Provider
import { ToastProvider } from './hooks/useToast';
import AuthToastProvider from './components/common/AuthToastProvider';
import AuthRecoveryProvider from './components/common/AuthRecoveryProvider';
import ConnectionStatusOverlay from './components/common/ConnectionStatusOverlay';

// ✅ Balance Provider  
import { BalanceProvider } from './contexts/BalanceContext';

// ✅ App Initializer
import AppInitializer from './components/common/AppInitializer';

// ✅ Lazy-loaded pages
import * as LazyComponents from './components/LazyComponents';

// ✅ QueryClient Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) return false;
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
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// ✅ Route Loading Fallback
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
      onError={(error) => console.error(`Route error in ${routeName}:`, error)}
      onReset={() => window.location.reload()}
    >
      {children}
    </ErrorBoundary>
  );
};

// ✅ Role-Based Route Protection - FIXED
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isLoading, user, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  
  // Loading state: keep route area light and non-blocking
  if (isLoading) {
    return (
      <>
        <TopProgressBar visible={true} />
        <div className="min-h-[40vh]" />
      </>
    );
  }
  
  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check super admin permission
  if (superAdminOnly && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">Super Admin Access Required</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mb-4">
            Current role: {user?.role || 'Unknown'} | Required: super_admin
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check admin permission
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mb-4">
            Current role: {user?.role || 'Unknown'} | Required: admin or super_admin
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // If blocked user somehow passed auth middleware (e.g., cached token), route to blocked page
  if (user?.isBlocked || (Array.isArray(user?.restrictions) && user.restrictions.some(r => r.restriction_type === 'blocked'))) {
    return <Navigate to="/blocked" replace state={{ reason: user?.restrictions?.[0]?.reason }} />;
  }

  return children;
};

// ✅ Smart Redirect for authenticated users
const SmartRedirect = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // For admin users, check if they were trying to access admin pages
  if (user?.isAdmin && location.state?.from?.startsWith('/admin')) {
    return <Navigate to={location.state.from} replace />;
  }
  
  // For admin users, default to admin dashboard
  if (user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // For regular users, go to dashboard
  return <Navigate to="/" replace />;
};

// ✅ App Content - SIMPLIFIED
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set global navigation for error handling
  useEffect(() => {
    window.spendWiseNavigate = navigate;
    return () => { window.spendWiseNavigate = null; };
  }, [navigate]);

  // ✅ NAVIGATION LOGIC - Integrated directly (no separate component needed)
  useEffect(() => {
    if (isLoading) return;
    
    const path = location.pathname;
    // If on blocked page, prevent any automatic redirects by early-returning
    if (path === '/blocked') {
      try {
        if (typeof window !== 'undefined') {
          window.__SPENDWISE_BLOCKED__ = true;
        }
        localStorage.setItem('blockedSession', '1');
      } catch (_) {}
      return;
    }
    
    // Handle legacy auth routes
    if (path.startsWith('/auth/')) {
      if (isAuthenticated) {
        navigate('/', { replace: true });
      } else {
        // Redirect to clean auth routes
        if (path.startsWith('/auth/login')) navigate('/login', { replace: true });
        if (path.startsWith('/auth/register')) navigate('/register', { replace: true });
      }
    }
    
    // Handle legacy dashboard route
    if (path === '/dashboard') {
      navigate('/', { replace: true });
    }
    
    // Handle onboarding redirect
    if (path === '/onboarding') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      <TopProgressBar visible={isLoading} />
      {/* Onboarding Manager */}
      {isAuthenticated && <OnboardingManager />}
      
      {/* Header */}
      {isAuthenticated && <Header />}
      
      <main className="flex-grow">
        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/login" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="Login">
                <Suspense fallback={<RouteLoadingFallback route="login" />}>
                  <LazyComponents.Login />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/register" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="Register">
                <Suspense fallback={<RouteLoadingFallback route="registration" />}>
                  <LazyComponents.Register />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/forgot-password" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="PasswordReset">
                <Suspense fallback={<RouteLoadingFallback route="password reset" />}>
                  <LazyComponents.PasswordReset />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          <Route path="/verify-email/:token" element={
            !isAuthenticated ? (
              <RouteErrorBoundary routeName="VerifyEmail">
                <Suspense fallback={<RouteLoadingFallback route="email verification" />}>
                  <LazyComponents.VerifyEmail />
                </Suspense>
              </RouteErrorBoundary>
            ) : <SmartRedirect />
          } />
          
          {/* ✅ Protected User Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Dashboard">
                <Suspense fallback={<RouteLoadingFallback route="dashboard" />}>
                  <LazyComponents.Dashboard />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          {/* ✅ Blocked route (public, for redirected blocked users) */}
          <Route path="/blocked" element={
            <RouteErrorBoundary routeName="Blocked">
              <Suspense fallback={<RouteLoadingFallback route="blocked" />}>
                <LazyComponents.Blocked />
              </Suspense>
            </RouteErrorBoundary>
          } />
          
          <Route path="/transactions" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Transactions">
                <Suspense fallback={<RouteLoadingFallback route="transactions" />}>
                  <LazyComponents.Transactions />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Profile">
                <Suspense fallback={<RouteLoadingFallback route="profile" />}>
                  <LazyComponents.Profile />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Analytics">
                <Suspense fallback={<RouteLoadingFallback route="analytics" />}>
                  <LazyComponents.Analytics />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* ✅ Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminDashboard">
                <Suspense fallback={<RouteLoadingFallback route="admin dashboard" />}>
                  <LazyComponents.AdminDashboard />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminUsers">
                <Suspense fallback={<RouteLoadingFallback route="user management" />}>
                  <LazyComponents.AdminUsers />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedRoute superAdminOnly={true}>
              <RouteErrorBoundary routeName="AdminSettings">
                <Suspense fallback={<RouteLoadingFallback route="admin settings" />}>
                  <LazyComponents.AdminSettings />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/activity" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminActivity">
                <Suspense fallback={<RouteLoadingFallback route="activity log" />}>
                  <LazyComponents.AdminActivity />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/stats" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminStats">
                <Suspense fallback={<RouteLoadingFallback route="system statistics" />}>
                  <LazyComponents.AdminStats />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* ✅ Maintenance Route */}
          <Route path="/maintenance" element={
            <RouteErrorBoundary routeName="Maintenance">
              <Suspense fallback={<RouteLoadingFallback route="maintenance" />}>
                <LazyComponents.Maintenance />
              </Suspense>
            </RouteErrorBoundary>
          } />

          {/* ✅ Server Waking Route */}
          <Route path="/server-waking" element={
            <RouteErrorBoundary routeName="ServerWaking">
              <Suspense fallback={<RouteLoadingFallback route="server waking" />}>
                <LazyComponents.ServerWaking />
              </Suspense>
            </RouteErrorBoundary>
          } />

          {/* ✅ 404 Route */}
          <Route path="*" element={
            <RouteErrorBoundary routeName="NotFound">
              <Suspense fallback={<RouteLoadingFallback route="page" />}>
                <LazyComponents.NotFound />
              </Suspense>
            </RouteErrorBoundary>
          } />
        </Routes>
      </main>
      
      {/* Footer & Accessibility */}
      {isAuthenticated && <Footer />}
      {/* Floating accessibility button (works on mobile and desktop) */}
      {isAuthenticated && <AccessibilityFab />}
      
      {/* Portal container for modals */}
      <div id="portal-root" />
      {/* Global connection status overlays */}
      <ConnectionStatusOverlay />
    </div>
  );
};

// ✅ Main App Component - CLEAN & OPTIMIZED
function App() {
  // Development tools
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🚀 SpendWise App - Clean & Optimized');
      window.queryClient = queryClient;
      // Expose env for debugging local issues (safe: dev only)
      try {
        const viteKeys = Object.keys(import.meta.env || {}).filter((k) => k.startsWith('VITE_'));
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          console.log('🧪 Vite Env Debug:', {
            MODE: import.meta.env.MODE,
            DEV: import.meta.env.DEV,
            VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            VITE_API_URL: import.meta.env.VITE_API_URL,
            VITE_KEYS: viteKeys
          });
        }
        window.__SW_DEBUG_ENV_APP__ = {
          MODE: import.meta.env.MODE,
          DEV: import.meta.env.DEV,
          VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          VITE_API_URL: import.meta.env.VITE_API_URL,
          VITE_KEYS: viteKeys
        };
        // Allow manual override for DEV when .env injection is problematic
        if (!import.meta.env.VITE_GOOGLE_CLIENT_ID && typeof window !== 'undefined') {
          const manual = window.__SW_GOOGLE_CLIENT_ID__ || (typeof localStorage !== 'undefined' && localStorage.getItem('SW_DEV_GOOGLE_CLIENT_ID'));
          if (manual && import.meta.env.VITE_DEBUG_MODE === 'true') {
            console.warn('⚠️ Using DEV manual Google Client ID override');
          }
        }
      } catch (_) {}
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
        <StoreProvider>
          <BalanceProvider>
            <ToastProvider>
              <AuthToastProvider>
                <AuthRecoveryProvider>
                  <AppInitializer>
                    <AppContent />
                  </AppInitializer>
                </AuthRecoveryProvider>
              </AuthToastProvider>
            </ToastProvider>
          </BalanceProvider>
        </StoreProvider>
      </Router>

      {/* Development tools */}
      {import.meta.env.DEV && (
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