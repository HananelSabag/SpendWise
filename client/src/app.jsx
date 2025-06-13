// client/src/app.jsx
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Button from './components/ui/Button';

// Core components
import LoadingSpinner from './components/ui/LoadingSpinner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenu from './components/common/AccessibilityMenu';

// Context providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { DateProvider } from './context/DateContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './hooks/useToast';

// Lazy-loaded pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const PasswordReset = lazy(() => import('./pages/auth/PasswordReset'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Transactions = lazy(() => import('./pages/Transactions'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * ✅ FIXED: Navigation persistence that works with authentication timing
 */
const useNavigationPersistence = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // ✅ FIX: Check for hasToken instead of isAuthenticated during startup
  const hasToken = !!localStorage.getItem('accessToken');

  // Store current location when we have a token and on valid route
  useEffect(() => {
    if (hasToken && location.pathname) {
      const validRoutes = ['/', '/transactions', '/profile'];
      if (validRoutes.includes(location.pathname)) {
        sessionStorage.setItem('lastVisitedPage', location.pathname);
        console.log('🔄 [NAV] Stored current page:', location.pathname);
      }
    }
  }, [location.pathname, hasToken]); // ← Use hasToken instead of isAuthenticated

  // Clear stored location only when explicitly logged out (no token)
  useEffect(() => {
    if (!hasToken) {
      sessionStorage.removeItem('lastVisitedPage');
      console.log('🔄 [NAV] Cleared stored page (no token)');
    }
  }, [hasToken]);
};

/**
 * ✅ IMPROVED: Authentication-aware route component with server connectivity handling
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  
  // ✅ NEW: Monitor online status
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
  
  // ✅ IMPROVED: Show offline message if detected
  if (showOfflineMessage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Internet Connection
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please check your internet connection and try again.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="primary"
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  // ✅ IMPROVED: During startup with token, show better loading state
  if (hasToken && isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Connecting to server...
          </p>
        </div>
      </div>
    );
  }
  
  // ✅ IMPROVED: Handle token exists but user not loaded yet
  if (hasToken && !isAuthenticated && !isLoading) {
    // Token exists but authentication failed - could be server issue
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connection Issues
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to verify your login. This might be temporary.
          </p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry
            </Button>
            <Button 
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
              }} 
              variant="primary"
            >
              Login Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // ✅ STANDARD: Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

/**
 * ✅ SMART: Redirect component that respects stored navigation
 */
const SmartRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');
  
  // ✅ FIX: During startup, check stored page
  if (hasToken && isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // ✅ FIX: Get stored page when authenticated
  const lastVisitedPage = sessionStorage.getItem('lastVisitedPage');
  const validRoutes = ['/', '/transactions', '/profile'];
  const redirectTo = (lastVisitedPage && validRoutes.includes(lastVisitedPage)) 
    ? lastVisitedPage 
    : '/';

  console.log('🔄 [NAV] Smart redirect to:', redirectTo);
  return <Navigate to={redirectTo} replace />;
};

/**
 * Application content with routing
 */
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Use navigation persistence hook
  useNavigationPersistence();
  
  // Suppress React Router warnings in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
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

  // Show loading screen while authentication state is being determined
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated && <Header />}
      
      <main className="flex-grow">
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
            <LoadingSpinner />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              !isAuthenticated ? <Login /> : <SmartRedirect />
            } />
            <Route path="/register" element={
              !isAuthenticated ? <Register /> : <SmartRedirect />
            } />
            <Route path="/forgot-password" element={
              !isAuthenticated ? <PasswordReset /> : <SmartRedirect />
            } />
            <Route path="/reset-password" element={
              !isAuthenticated ? <PasswordReset /> : <SmartRedirect />
            } />
            <Route path="/verify-email/:token" element={
              !isAuthenticated ? <VerifyEmail /> : <SmartRedirect />
            } />
            
            {/* ✅ FIXED: Protected Routes that respect stored navigation */}
            <Route path="/" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute><Transactions /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      
      {isAuthenticated && <Footer />}
      {isAuthenticated && <AccessibilityMenu />}
      
      {/* Portal container for modals */}
      <div id="portal-root" />
    </div>
  );
};

/**
 * ✅ FIX: Create QueryClient with proper configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * ✅ ADD: App initialization component
 */
const AppInitializer = ({ children }) => {
  useEffect(() => {
    // ✅ ADD: Listen for session reset events
    const handleSessionReset = () => {
      console.log('🔄 [APP] Session reset detected, clearing contexts');
      // Language context will handle its own reset
      // Theme context will handle its own reset
    };

    const handleAuthLogout = () => {
      console.log('🔄 [APP] Auth logout detected');
      // Clear any app-level state if needed
    };

    // ✅ ADD: Listen for language session reset
    const handleLanguageSessionReset = () => {
      console.log('🔄 [APP] Language session reset');
      // LanguageContext will handle this internally
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    window.addEventListener('preferences-reset', handleSessionReset);
    window.addEventListener('language-session-reset', handleLanguageSessionReset);

    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
      window.removeEventListener('preferences-reset', handleSessionReset);
      window.removeEventListener('language-session-reset', handleLanguageSessionReset);
    };
  }, []);

  return children;
};

/**
 * Main Application Component
 */
function App() {
  useEffect(() => {
    // Initialize application preferences
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    
    localStorage.removeItem('a11y_darkMode');
    
    // Restore user preferences
    const initializePreferences = () => {
      try {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        const savedCurrency = localStorage.getItem('preferredCurrency');
        
        console.log('🚀 [APP] Initializing with preferences:', {
          language: savedLanguage || 'browser-default',
          currency: savedCurrency || 'ILS',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.warn('⚠️ [APP] Error restoring preferences:', error);
      }
    };
    
    initializePreferences();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <LanguageProvider>
          <AccessibilityProvider initialDarkMode={false}>
            <ThemeProvider>
              <AuthProvider>
                <DateProvider>
                  <CurrencyProvider>
                    <ToastProvider>
                      <Suspense fallback={
                        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                          <LoadingSpinner size="large" />
                        </div>
                      }>
                        <AppInitializer>
                          <AppContent />
                        </AppInitializer>
                      </Suspense>
                    </ToastProvider>
                  </CurrencyProvider>
                </DateProvider>
              </AuthProvider>
            </ThemeProvider>
          </AccessibilityProvider>
        </LanguageProvider>
      </Router>

      {/* ✅ Development tools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;