/**
 * Auth lifecycle provider.
 *
 * Replaces the old 638-line authRecoveryManager with the three things the
 * app actually needs at boot:
 *   1. Warm-up ping — starts waking a sleeping Render server before the
 *      user clicks anything.
 *   2. ONE listener for the real logout signal ('auth:logout', emitted by
 *      refreshManager only when the refresh token is truly rejected).
 *   3. The window.connectionState helpers used by overlays.
 */

import { useEffect } from 'react';
import { warmUpServer } from '../../auth/serverHealth';
import { useAuthStore } from '../../stores/authStore';

const AUTH_PAGES = ['/login', '/register', '/auth/login', '/auth/register', '/auth/verify-email', '/auth/password-reset'];

const AuthRecoveryProvider = ({ children }) => {
  useEffect(() => {
    // 1. Fire-and-forget server warm-up (no-op if warm in the last 10 min)
    warmUpServer();

    // 2. Overlay helpers
    if (typeof window !== 'undefined') {
      window.connectionState = window.connectionState || {
        setServerWaking(flag) { window.__SERVER_WAKING__ = !!flag; },
        isServerWaking() { return !!window.__SERVER_WAKING__; }
      };
    }

    // 3. The single place that reacts to a dead session.
    //    refreshManager guarantees this fires at most once per session.
    const onAuthLogout = () => {
      try {
        useAuthStore.getState().actions.reset();
      } catch (_) {}

      // Blocked users stay on the blocked page
      const isBlocked = window.location?.pathname === '/blocked' ||
        (() => { try { return localStorage.getItem('blockedSession') === '1'; } catch (_) { return false; } })();
      if (isBlocked) return;

      try { window.authToasts?.sessionExpired?.(); } catch (_) {}

      if (!AUTH_PAGES.includes(window.location.pathname)) {
        if (window.spendWiseNavigate) window.spendWiseNavigate('/login', { replace: true });
        else window.location.replace('/login');
      }
    };

    window.addEventListener('auth:logout', onAuthLogout);
    return () => window.removeEventListener('auth:logout', onAuthLogout);
  }, []);

  return children;
};

export default AuthRecoveryProvider;
