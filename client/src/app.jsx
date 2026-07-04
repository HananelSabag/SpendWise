/**
 * 🚀 SPENDWISE APP - CLEAN & OPTIMIZED
 * Features: Clean routing, Role-based protection, Optimized performance
 * @version 3.0.0 - MAJOR OPTIMIZATION
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';

// 🟢 NEW: TanStack Query localStorage persistence — real "offline mode".
// When the user's browser has stale cache from a previous session, the
// queryClient hydrates from localStorage on mount. So when the API is down
// (Render asleep, Supabase paused, etc.), the dashboard / transactions still
// render with last-seen data instead of a spinner. As soon as the API comes
// back, queries refetch in the background and update the UI.
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Core UI components
import TopProgressBar from './components/common/TopProgressBar.jsx';
import PageSkeleton from './components/ui/PageSkeleton';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenu from './components/common/AccessibilityMenu';
import AccessibilityFab from './components/common/AccessibilityFab.jsx';
import ModernOnboardingManager from './components/common/ModernOnboardingManager';
import MobileBottomNav from './components/common/MobileBottomNav';
import NotificationBell from './components/layout/NotificationBell';

// ✅ Zustand stores
import { StoreProvider, useAuth, useTranslation } from './stores';

// ✅ Toast Provider
import { ToastProvider } from './hooks/useToast';
import { useToastCleanup } from './hooks/useToastCleanup';
import AuthToastProvider from './components/common/AuthToastProvider';
import AuthRecoveryProvider from './components/common/AuthRecoveryProvider';
import ConnectionStatusOverlay from './components/common/ConnectionStatusOverlay';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import UnifiedTransactionActions from './components/features/transactions/actions/UnifiedTransactionActions.jsx';

// ✅ Balance Provider  

// ✅ App Initializer
import AppInitializer from './components/common/AppInitializer';

// ✅ Lazy-loaded pages
import * as LazyComponents from './components/LazyComponents';

// ✅ Use centralized QueryClient configuration
import queryClient from './config/queryClient';

// 🟢 Persister for offline-survives-reload. localStorage is fine here:
// - It's already used for auth tokens, so the user has implicit consent.
// - QueryClient's max-age guard below prevents serving truly ancient data.
const queryPersister = typeof window !== 'undefined'
  ? createSyncStoragePersister({
      storage: window.localStorage,
      key: 'spendwise-query-cache',
      // Keep cached data trim — Render-free-tier clients are mobile-heavy.
      // Anything bigger than 4 MB starts hitting localStorage quotas on Safari.
      throttleTime: 1000,
    })
  : undefined;

// Map Suspense route names → PageSkeleton page types.
// This replaces the old translation-based fallback that showed raw i18n keys
// ("errors.loadingPage", "Loading transactions...") when the translation store
// hadn't initialized yet.
const ROUTE_SKELETON_MAP = {
  dashboard: 'dashboard',
  transactions: 'transactions',
  analytics: 'analytics',
  profile: 'profile',
  shopping: 'shopping',
  'bank sync': 'profile',
  'admin dashboard': 'admin',
  'user management': 'admin',
  'activity log': 'admin',
  'system statistics': 'admin',
  'admin settings': 'admin',
};

const RouteLoadingFallback = ({ route = 'page' }) => {
  const page = ROUTE_SKELETON_MAP[route];
  if (page) return <PageSkeleton page={page} />;
  // Auth / misc routes — just a plain spinner, no text, no translation dependency
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
};

// ✅ Route Error Fallback — defined OUTSIDE RouteErrorBoundary so React sees
// a stable component type and never needlessly remounts the error boundary.
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

// ✅ Route Error Boundary
const RouteErrorBoundary = ({ children, routeName }) => (
  <ErrorBoundary
    FallbackComponent={RouteErrorFallback}
    onError={(error) => console.error(`Route error in ${routeName}:`, error)}
    onReset={() => window.location.reload()}
  >
    {children}
  </ErrorBoundary>
);

// ✅ Role-Based Route Protection - FIXED
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isLoading, user, isAdmin, isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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
          <h3 className="text-xl font-semibold mb-2">{t('errors.superAdminRequired') || 'Super Admin Access Required'}</h3>
          <p className="text-gray-600 mb-4">{t('errors.noPermission') || "You don't have permission to access this page."}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t('errors.roleRequired', { role: user?.role || '?', required: 'super_admin' }) || `Current role: ${user?.role || '?'} | Required: super_admin`}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            {t('actions.back') || 'Go Back'}
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
          <h3 className="text-xl font-semibold mb-2">{t('errors.adminRequired') || 'Admin Access Required'}</h3>
          <p className="text-gray-600 mb-4">{t('errors.noPermission') || "You don't have permission to access this page."}</p>
          <p className="text-sm text-gray-500 mb-4">
            {t('errors.roleRequired', { role: user?.role || '?', required: 'admin / super_admin' }) || `Current role: ${user?.role || '?'} | Required: admin or super_admin`}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
          >
            {t('actions.back') || 'Go Back'}
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

// ✅ Smart Redirect — used only at /login and /register for admin deep-links
const SmartRedirect = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Admin deep-link: if admin was redirected to /login from an admin route, send back there
  if (user?.isAdmin && location.state?.from?.startsWith('/admin')) {
    return <Navigate to={location.state.from} replace />;
  }

  // Everything else goes to "/" which handles home preference logic
  return <Navigate to="/" replace />;
};

// ✅ HomeRoute — handles "/" for authenticated users:
//   1. New users (no preference set) → HomePickerScreen
//   2. Returning users → redirect to saved preference ONCE per session, then Dashboard
const HomePickerScreen = React.lazy(() => import('./components/common/HomePickerScreen'));
const HOME_REDIRECT_KEY = 'sw_home_redirect';

// Helpers to read session flags synchronously (never throws)
const getSessionFlag = (key) => { try { return sessionStorage.getItem(key); } catch { return null; } };

const HomeRoute = () => {
  const { user } = useAuth();
  const prefs = user?.preferences || {};
  const hasChosen      = prefs.home_preference_set === true;
  const legacyShopping = prefs.shopping_list_as_default_page === true;
  const defaultHome    = prefs.default_home;

  // pickerDone: set by HomePickerScreen before navigating, prevents loop while
  // React Query cache is still stale and hasn't received the updateProfile response yet.
  const pickerDone = !!getSessionFlag('sw_picker_done');

  // Show home picker only to users who haven't chosen yet (and didn't just choose this session)
  if (!hasChosen && !defaultHome && !legacyShopping && !user?.isAdmin && !pickerDone) {
    return (
      <React.Suspense fallback={null}>
        <HomePickerScreen />
      </React.Suspense>
    );
  }

  // Once per browser session: redirect to saved preference
  // After that, "/" always shows the Dashboard so nav links work normally
  if (!sessionStorage.getItem(HOME_REDIRECT_KEY)) {
    sessionStorage.setItem(HOME_REDIRECT_KEY, '1');
    if (defaultHome === 'shopping' || legacyShopping) return <Navigate to="/shopping"     replace />;
    if (defaultHome === 'transactions')               return <Navigate to="/transactions" replace />;
    if (user?.isAdmin)                                return <Navigate to="/admin"         replace />;
  }

  return (
    <RouteErrorBoundary routeName="Dashboard">
      <Suspense fallback={<RouteLoadingFallback route="dashboard" />}>
        <LazyComponents.Dashboard />
      </Suspense>
    </RouteErrorBoundary>
  );
};

// ✅ PWA update handler.
// Two halves of "users get new deploys fast":
//  1. controllerchange → reload when a new service worker takes control.
//  2. ACTIVELY CHECK for a new build — the missing piece. autoUpdate only
//     checks on hard navigations, so a long-lived tab / installed PWA never
//     discovered new deploys. Now we call registration.update() when the tab
//     regains focus (throttled to 5 min) and every 60 min as a fallback.
const usePWAAutoReload = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener('controllerchange', reload);

    let lastCheck = 0;
    const checkForUpdate = () => {
      const now = Date.now();
      if (now - lastCheck < 5 * 60 * 1000) return;
      lastCheck = now;
      navigator.serviceWorker.getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(checkForUpdate, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', reload);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);
};

// ✅ App Content - SIMPLIFIED
const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Auto-dismiss loading toasts on navigation
  useToastCleanup();

  // ✅ Auto-reload on PWA service worker update
  usePWAAutoReload();

  const isQuickExpensePage = location.pathname === '/quick-expense';

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

  // Detect shopping-only mode and home picker state to conditionally hide chrome.
  // Use sessionStorage flags in addition to prefs so the UI responds immediately
  // after the user picks (before React Query refreshes the profile cache).
  const prefs          = user?.preferences || {};
  const sessionMode    = getSessionFlag('sw_app_mode');    // 'shopping' | 'dashboard' | null
  const pickerDone     = !!getSessionFlag('sw_picker_done');
  const isShoppingMode = prefs.default_home === 'shopping' ||
                         prefs.shopping_list_as_default_page === true ||
                         sessionMode === 'shopping';
  const isShowingPicker = isAuthenticated && !isLoading && user &&
    !prefs.home_preference_set && !prefs.default_home && !prefs.shopping_list_as_default_page &&
    !user?.isAdmin && !pickerDone;

  return (
    <div className="flex flex-col min-h-screen">
      <TopProgressBar visible={isLoading} />
      {isAuthenticated && <ModernOnboardingManager />}

      {/* Header — hidden in shopping mode and while home picker is on screen */}
      {isAuthenticated && !isQuickExpensePage && !isShoppingMode && !isShowingPicker && <Header />}

      {/* Bottom nav — always rendered (ShoppingModeNav / FullNav); hidden only during home picker */}
      {isAuthenticated && !isQuickExpensePage && !isShowingPicker && <MobileBottomNav />}



      <main className="flex-grow lg:pb-0 pb-20">
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
              <HomeRoute />
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
          
          {/* ✅ Shopping Wishlist Route */}
          <Route path="/shopping" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="Shopping">
                <Suspense fallback={<RouteLoadingFallback route="shopping" />}>
                  <LazyComponents.ShoppingWishlistPage />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          {/* ✅ Bank Sync Route */}
          <Route path="/bank-sync" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="BankSync">
                <Suspense fallback={<RouteLoadingFallback route="bank sync" />}>
                  <LazyComponents.BankSyncPage />
                </Suspense>
              </RouteErrorBoundary>
            </ProtectedRoute>
          } />

          {/* ✅ Quick Expense Route */}
          <Route path="/quick-expense" element={
            <ProtectedRoute>
              <RouteErrorBoundary routeName="QuickExpense">
                <Suspense fallback={<RouteLoadingFallback route="quick expense" />}>
                  <LazyComponents.QuickExpensePage />
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

          <Route path="/admin/sync" element={
            <ProtectedRoute adminOnly={true}>
              <RouteErrorBoundary routeName="AdminSync">
                <Suspense fallback={<RouteLoadingFallback route="bank sync" />}>
                  <LazyComponents.AdminSync />
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
      {isAuthenticated && !isQuickExpensePage && <Footer />}
      {/* Floating accessibility button (works on mobile and desktop) */}
      {isAuthenticated && <AccessibilityFab />}
      {/* Global unified transaction actions (modals orchestrator) */}
      {isAuthenticated && <UnifiedTransactionActions />}
      
      {/* Portal container for modals */}
      <div id="portal-root" />
      {/* Global connection status overlays */}
      <ConnectionStatusOverlay />
      {/* PWA install prompt — only shown when browser deems eligible + not dismissed */}
      {isAuthenticated && <PWAInstallPrompt />}
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

  // Use the persistent provider when persister is available (browser),
  // and the plain provider otherwise (SSR-safety, defensive).
  const queryProviderProps = queryPersister
    ? {
        client: queryClient,
        persistOptions: {
          persister: queryPersister,
          // Drop persisted cache older than 24h. Past that, prefer to refetch
          // than serve potentially stale balances. The whole point of cache
          // here is "survive a reload during a server outage", not eternal data.
          maxAge: 24 * 60 * 60 * 1000,
          // Bump this if the cache shape ever changes (forces a clean rehydrate).
          buster: 'spendwise-cache-v1',
          dehydrateOptions: {
            // Don't persist mutations or in-flight queries. Only successful data.
            shouldDehydrateQuery: (query) =>
              query.state.status === 'success' && !query.isStale(),
          },
        },
      }
    : null;

  const Tree = (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <StoreProvider>
        <ToastProvider>
          <AuthToastProvider>
            <AuthRecoveryProvider>
              <AppInitializer>
                <AppContent />
              </AppInitializer>
            </AuthRecoveryProvider>
          </AuthToastProvider>
        </ToastProvider>
      </StoreProvider>
    </Router>
  );

  const DevTools = import.meta.env.DEV ? (
    <ReactQueryDevtools
      initialIsOpen={false}
      position="bottom-right"
      toggleButtonProps={{ style: { marginBottom: '60px' } }}
    />
  ) : null;

  return queryProviderProps ? (
    <PersistQueryClientProvider {...queryProviderProps}>
      {Tree}
      {DevTools}
    </PersistQueryClientProvider>
  ) : (
    <QueryClientProvider client={queryClient}>
      {Tree}
      {DevTools}
    </QueryClientProvider>
  );
}

export default App;