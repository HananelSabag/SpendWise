/**
 * 🚀 APP INITIALIZER - with cold-start retry and auth error differentiation
 * Scenarios handled:
 *   • Server waking (5xx / network timeout) → retry with backoff, show waking banner
 *   • Genuine 401 (expired/missing token) → clear tokens, stay on login
 *   • 403 USER_BLOCKED → redirect to /blocked
 *   • Success → clear waking flag, start token refresh timer
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores';
import TopProgressBar from './TopProgressBar.jsx';
import { api } from '../../api';
import { useAppStore } from '../../stores/appStore';

// Fetch fresh profile with cold-start-aware retry.
// Returns { success, user?, errorCode?, status? }
async function fetchProfileWithRetry(authActions, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await authActions.getProfile({ silent: true });

    if (result.success) {
      return result;
    }

    const status = result.error?.status || 0;
    const code   = result.error?.code   || '';

    // Hard auth failures — don't retry, caller handles these
    if (status === 401 || status === 403) {
      return result;
    }

    // Transient: network error (status 0), 5xx, or gateway errors
    if (attempt < maxAttempts) {
      // Signal the waking banner after the first failed attempt
      window.__SERVER_WAKING__ = true;
      const delay = attempt === 1 ? 3000 : 7000; // 3s, then 7s
      await new Promise(r => setTimeout(r, delay));
    }
  }

  // All attempts exhausted — still transient, return last result
  return { success: false, error: { code: 'SERVER_UNAVAILABLE', status: 0 } };
}

const AppInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const authActions = useAuthStore.getState().actions;

        // 1. Synchronous state alignment (token → isAuthenticated)
        //    Also schedules startTokenRefreshTimer() via setTimeout(0)
        authActions.initialize();

        // 2. If we have a token, validate it against the server
        const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
        if (token) {
          const result = await fetchProfileWithRetry(authActions, 3);

          if (result.success) {
            // Server is alive — clear any waking flag
            window.__SERVER_WAKING__ = false;
          } else {
            const status = result.error?.status || 0;
            const code   = result.error?.code   || '';

            if (status === 401) {
              // Token is genuinely expired / invalid — clear it so the user
              // sees the login page on their next navigation instead of stale data
              localStorage.removeItem('accessToken');
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              authActions.reset();
            } else if (status === 403) {
              if (code === 'USER_BLOCKED') {
                // Redirect to blocked page; don't touch tokens (server does that)
                if (window.spendWiseNavigate) {
                  window.spendWiseNavigate('/blocked', { replace: true });
                } else {
                  window.location.replace('/blocked');
                }
              } else {
                // Other 403 (deactivated etc.) — treat like 401
                localStorage.removeItem('accessToken');
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                authActions.reset();
              }
            }
            // 5xx / network: we leave the token intact and let the user proceed
            // with stale data; the refresh timer will re-validate when server wakes.
          }
        }

        // 3. Load admin system settings for admin users only
        try {
          const { isAuthenticated, user } = useAuthStore.getState();
          const role = user?.role;
          const isAdmin = role === 'admin' || role === 'super_admin' || user?.isAdmin || user?.isSuperAdmin;
          if (isAuthenticated && isAdmin) {
            const result = await api.admin.settings.get();
            const settings = Array.isArray(result.data) ? result.data : [];
            const siteName     = settings.find(s => s.key === 'site_name')?.value || 'SpendWise';
            const googleEnabled = settings.find(s => s.key === 'google_oauth_enabled')?.value !== false;
            const supportEmail  = settings.find(s => s.key === 'support_email')?.value || 'spendwise.verifiction@gmail.com';

            document.title = `${siteName}`;
            useAppStore.setState((state) => { state.pageTitle = siteName; });
            window.__SW_GOOGLE_OAUTH_ENABLED__ = googleEnabled;
            window.__SW_SUPPORT_EMAIL__ = supportEmail;
          }
        } catch (_) {}

        setIsInitialized(true);
      } catch (_) {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []); // runs once on mount

  return (
    <>
      <TopProgressBar visible={!isInitialized} />
      {children}
    </>
  );
};

export default AppInitializer;
