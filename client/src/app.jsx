/**
 * 🚀 SPENDWISE APP - CLEAN & OPTIMIZED
 * Features: Clean routing, Role-based protection, Optimized performance
 * @version 3.0.0 - MAJOR OPTIMIZATION
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 🟢 TanStack Query localStorage persistence — real "offline mode".
// When the user's browser has stale cache from a previous session, the
// queryClient hydrates from localStorage on mount. So when the API is down
// (Render asleep, Supabase paused, etc.), the dashboard / transactions still
// render with last-seen data instead of a spinner. As soon as the API comes
// back, queries refetch in the background and update the UI.
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Core UI components
import TopProgressBar from './components/common/TopProgressBar.jsx';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AccessibilityMenuHost from './components/common/AccessibilityMenuHost.jsx';
import ModernOnboardingManager from './components/common/ModernOnboardingManager';
import MobileBottomNav from './components/common/MobileBottomNav';

// ✅ Zustand stores
import { StoreProvider, useAuth, useTranslation } from './stores';

// ✅ Toast Provider
import { ToastProvider } from './hooks/useToast';
import { useToastCleanup } from './hooks/useToastCleanup';
import { usePWAAutoReload } from './hooks/usePWAAutoReload';
import { useFinancialDataSync } from './hooks/useFinancialDataSync';
import { useBankSyncMonitor } from './hooks/useBankSyncMonitor';
import AuthToastProvider from './components/common/AuthToastProvider';
import AuthRecoveryProvider from './components/common/AuthRecoveryProvider';
import ConnectionStatusOverlay from './components/common/ConnectionStatusOverlay';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import UnifiedTransactionActions from './components/features/transactions/actions/UnifiedTransactionActions.jsx';

// ✅ App Initializer
import AppInitializer from './components/common/AppInitializer';

// ✅ Routing
import { AppRoutes } from './components/routing/AppRoutes';

// ✅ Use centralized QueryClient configuration
import queryClient from './config/queryClient';
import { getSessionFlag } from './utils/sessionFlags';

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

// ✅ App Content - SIMPLIFIED
const AppContent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Auto-dismiss loading toasts on navigation
  useToastCleanup();

  // ✅ Auto-reload on PWA service worker update
  usePWAAutoReload();

  // Keep every financial query aligned after background bank/card syncs.
  useFinancialDataSync();
  useBankSyncMonitor();

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
  const showDesktopShell = isAuthenticated && !isQuickExpensePage && !isShoppingMode && !isShowingPicker;

  return (
    <div
      className={`flex flex-col min-h-screen ${showDesktopShell ? 'sw-desktop-shell' : ''}`}
      data-sidebar-side={showDesktopShell ? (isRTL ? 'right' : 'left') : undefined}
    >
      <TopProgressBar visible={isLoading} />
      {isAuthenticated && <ModernOnboardingManager />}

      {/* Header — hidden in shopping mode and while home picker is on screen */}
      {showDesktopShell && <Header />}

      {/* Bottom nav — always rendered (ShoppingModeNav / FullNav); hidden only during home picker */}
      {isAuthenticated && !isQuickExpensePage && !isShowingPicker && <MobileBottomNav />}

      <main className="flex-grow lg:pb-0 pb-20">
        <AppRoutes isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer & accessibility settings host */}
      {isAuthenticated && !isQuickExpensePage && <Footer />}
      {isAuthenticated && <AccessibilityMenuHost />}
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
          // v4 drops cycle snapshots persisted before bank-sync invalidation covered the
          // `cycles` query family. Rehydrating them could show a stale statement after sync.
          buster: 'spendwise-cache-v4',
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
