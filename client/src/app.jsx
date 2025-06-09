// client/src/app.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

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
 * ✅ SMART: Authentication-aware route component
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const hasToken = !!localStorage.getItem('accessToken');
  
  // ✅ FIX: During startup with token, show loading until auth resolves
  if (hasToken && isLoading) {
    return <LoadingSpinner />;
  }
  
  // ✅ FIX: Check stored page preference for valid token holders
  if (hasToken && !isAuthenticated) {
    // Token exists but user not loaded yet - show loading
    return <LoadingSpinner />;
  }
  
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
    return <LoadingSpinner />;
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
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated && <Header />}
      
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
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
        <AuthProvider>
          <AccessibilityProvider initialDarkMode={false}>
            <ThemeProvider>
              <LanguageProvider>
                <DateProvider>
                  <CurrencyProvider>
                    <Suspense fallback={
                      <div className="h-screen w-screen flex items-center justify-center">
                        <LoadingSpinner size="large" />
                      </div>
                    }>
                      <AppInitializer>
                        <AppContent />
                      </AppInitializer>
                    </Suspense>
                  </CurrencyProvider>
                </DateProvider>
              </LanguageProvider>
            </ThemeProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </Router>

      {/* ✅ Development tools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}

      {/* Global toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            maxWidth: '500px',
          },
          success: {
            style: {
              background: '#10B981',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#EF4444',
              color: 'white',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;