/**
 * 🔐 AUTH STORE - BULLETPROOF SECURITY
 * Authentication with role-based access - CLIENT-SIDE ROLES FOR UI ONLY
 * @version 3.0.0 - SECURITY HARDENED
 * 
 * ⚠️ SECURITY WARNING: All role checks in this store are for UI display only!
 * Server-side validation is the ONLY source of truth for permissions.
 * Client-side roles can be tampered with and should never be trusted for security decisions.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authAPI } from '../api';
import { useAppStore } from './appStore';
import { useTranslationStore } from './translationStore';
import { queryClient } from '../config/queryClient';
import {
  migrateLegacyKeys, isAccessTokenValid, hasSession, getRefreshToken, clearTokens,
} from '../auth/tokenStorage';
import {
  ensureFreshToken, sessionStarted, sessionEnded,
} from '../auth/refreshManager';

// Wipe every caching layer that could carry one user's data to the next.
// Called on both logout and login (before new user's queries fire).
const clearAllCaches = () => {
  // 1. In-memory TanStack Query cache (the main culprit)
  try { queryClient.clear(); } catch (_) {}
  // 2. TanStack persisted cache in localStorage
  try { localStorage.removeItem('spendwise-query-cache'); } catch (_) {}
  // 3. Axios-level response cache (SpendWiseAPIClient.cache)
  try { window.__spendWiseAPI?.cache?.clear?.(); } catch (_) {}
  // 4. PWA Service-Worker cache (no-store headers now cover this, belt-and-suspenders)
  try {
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(n => caches.delete(n)));
    }
  } catch (_) {}
};

// ✅ Auth Store
export const useAuthStore = create(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // ✅ Authentication State
        isAuthenticated: false,
        isLoading: false,
        user: null,
        userRole: 'user',
        isAdmin: false,
        isSuperAdmin: false,
        
        // ✅ Session State
        sessionStart: null,
        
        // ✅ Error State
        error: null,
        initialized: false,

        // ✅ Actions
        actions: {
          // Initialize auth state from the token layer (single source of truth).
          // Three cases:
          //   no session          → guest
          //   valid access token  → authenticated (persisted user = instant paint)
          //   expired access +
          //   refresh available   → authenticated, refresh fires immediately so
          //                         queries go out with a fresh token instead of
          //                         producing a 401 burst on every return visit.
          initialize: () => {
            migrateLegacyKeys();

            const sessionExists = hasSession();
            const accessValid = isAccessTokenValid();

            set((state) => {
              state.initialized = true;
              state.isLoading = false;

              if (sessionExists) {
                state.isAuthenticated = true;
              } else {
                state.isAuthenticated = false;
                state.user = null;
                state.userRole = 'user';
                state.isAdmin = false;
                state.isSuperAdmin = false;
              }
            });

            if (sessionExists) {
              if (accessValid) {
                // Arm the proactive refresh timer for the current token.
                sessionStarted();
              } else if (getRefreshToken()) {
                // Access token stale — refresh NOW (single-flight; transient
                // failures keep the session and retry, never logging out).
                ensureFreshToken();
              } else {
                // Access token dead and nothing to refresh with → guest.
                clearTokens();
                set((state) => {
                  state.isAuthenticated = false;
                  state.user = null;
                });
              }
            }

            return true;
          },

          // Basic login - SIMPLIFIED
          login: async (email, password) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const result = await authAPI.login(email, password);
              
              if (result.success) {
                const userData = result.user;

                // Clear any previous user's cached data before setting new user state
                clearAllCaches();

                set((state) => {
                  state.isAuthenticated = true;
                  state.initialized = true; // Ensure queries aren't blocked after re-login
                  state.user = userData;
                  state.userRole = userData?.role || 'user';
                  state.isAdmin = ['admin', 'super_admin'].includes(userData?.role || 'user');
                  state.isSuperAdmin = (userData?.role || 'user') === 'super_admin';
                  state.isLoading = false;
                  state.error = null;
                  state.sessionStart = new Date().toISOString();
                });

                // Arm proactive refresh for the new session
                sessionStarted();

                // ✅ NEW: Apply user preferences immediately (theme, language, currency)
                try {
                  get().actions.syncUserPreferences(userData);
                } catch (e) {
                  // silent
                }

                return { success: true, user: userData };
              } else {
                set((state) => {
                  state.isLoading = false;
                  state.error = result.error;
                });

                return { success: false, error: result.error };
              }
            } catch (error) {
              const errorObj = {
                message: error.message || 'Login failed',
                code: 'LOGIN_ERROR'
              };
              
              set((state) => {
                state.isLoading = false;
                state.error = errorObj;
              });

              return { success: false, error: errorObj };
            }
          },

          // ✅ NEW: Google OAuth login - EXACT same logic as regular login
          // Google login — REQUIRES the GSI credential. (The old version
          // called authAPI.googleLogin() with no argument, which always
          // threw — a permanently broken path.)
          googleLogin: async (credential) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const result = await authAPI.processGoogleCredential(credential);

              if (result.success) {
                const userData = result.user;
                clearAllCaches();

                set((state) => {
                  state.isAuthenticated = true;
                  state.initialized = true;
                  state.user = userData;
                  state.userRole = userData?.role || 'user';
                  state.isAdmin = ['admin', 'super_admin'].includes(userData?.role || 'user');
                  state.isSuperAdmin = (userData?.role || 'user') === 'super_admin';
                  state.isLoading = false;
                  state.error = null;
                  state.sessionStart = new Date().toISOString();
                });

                sessionStarted();
                try { get().actions.syncUserPreferences(userData); } catch (e) { /* silent */ }
                return { success: true, user: userData };
              }

              set((state) => {
                state.isLoading = false;
                state.error = result.error;
              });
              return { success: false, error: result.error };
            } catch (error) {
              const errorObj = {
                message: error.message || 'Google login failed',
                code: 'GOOGLE_LOGIN_ERROR'
              };
              set((state) => {
                state.isLoading = false;
                state.error = errorObj;
              });
              return { success: false, error: errorObj };
            }
          },

          // Enhanced register with AI security
          register: async (userData) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const result = await authAPI.register(userData);
              
              if (result.success) {
                // Don't auto-login, let user verify email first
                return { 
                  success: true, 
                  message: result.message,
                  requiresVerification: true 
                };
              } else {
                set((state) => {
                  state.error = result.error;
                });
                return { success: false, error: result.error };
              }
            } catch (error) {
              const errorObj = { message: error.message || 'Registration failed' };
              set((state) => {
                state.error = errorObj;
              });
              return { success: false, error: errorObj };
            } finally {
              set((state) => {
                state.isLoading = false;
              });
            }
          },

          // Verify email
          verifyEmail: async (token) => {
            try {
              const result = await authAPI.verifyEmail({ token });
              
              if (result.success && result.user) {
                get().actions.setUser(result.user);
              }

              return result;
            } catch (error) {
              throw error;
            }
          },

          // ✅ ADD: Get fresh profile data from server
          // silent: true → skip global isLoading flag (background refreshes, e.g. Blocked page check)
          getProfile: async ({ silent = false } = {}) => {
            if (!silent) {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });
            }

            try {
              const result = await authAPI.getProfile();

              if (result.success) {
                // Update user data in store with fresh server data
                set((state) => {
                  state.user = result.user;
                  if (!silent) state.isLoading = false;
                  state.error = null;
                });

                // Sync updated preferences
                get().actions.syncUserPreferences(result.user);

                return { success: true, user: result.user };
              } else {
                if (!silent) {
                  set((state) => {
                    state.error = result.error;
                    state.isLoading = false;
                  });
                }
                return { success: false, error: result.error };
              }
            } catch (error) {
              if (!silent) {
                set((state) => {
                  state.error = { message: error.message || 'Failed to load profile' };
                  state.isLoading = false;
                });
              }
              throw error;
            }
          },

          // Update user profile
          updateProfile: async (updates) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const result = await authAPI.updateProfile(updates);
              
              if (result.success) {
                // Update user data in store
                set((state) => {
                  state.user = { ...state.user, ...result.user };
                  state.isLoading = false;
                  state.error = null;
                });

                // Sync updated preferences
                get().actions.syncUserPreferences(result.user);

                return { success: true, user: result.user };
              } else {
                set((state) => {
                  state.error = result.error;
                  state.isLoading = false;
                });
                return { success: false, error: result.error };
              }
            } catch (error) {
              const errorObj = { message: error.message || 'Profile update failed' };
              set((state) => {
                state.error = errorObj;
                state.isLoading = false;
              });
              return { success: false, error: errorObj };
            }
          },

          // ✅ Enhanced Logout with toast notifications - RELIABLE VERSION
          logout: async (showToast = true) => {
            try {
              // Show loading toast if needed
              let loadingToastId;
              if (showToast && window.authToasts) {
                loadingToastId = window.authToasts.signingOut();
              }

              // Stop refresh scheduling first so nothing refreshes mid-logout
              sessionEnded();

              // Call logout API with a short timeout. Previously this used the
              // default 45s axios timeout — which meant when the server was
              // down (Render asleep / Supabase paused), clicking "logout"
              // appeared to do nothing for 45s. The local cleanup below is
              // what actually logs the user out; the server call is a courtesy.
              try {
                await Promise.race([
                  authAPI.logout(),
                  new Promise((_, rej) => setTimeout(() => rej(new Error('logout-timeout')), 3000))
                ]);
              } catch (error) {
                // Server unreachable / timed out — proceed with local cleanup anyway.
              }

              // ✅ Clear ALL caches before touching auth state
              clearAllCaches();

              // One call clears every token key (including legacy ones)
              clearTokens();
              // Clear session-scoped UI prefs
              try {
                sessionStorage.removeItem('spendwise-session-theme');
                sessionStorage.removeItem('spendwise-session-accessibility');
                sessionStorage.removeItem('spendwise-session-language');
              } catch (_) {}

              // Reset state
              get().actions.reset();

              // Dismiss loading toast and show success
              if (showToast && window.authToasts) {
                if (loadingToastId && window.authToasts.dismiss) {
                  window.authToasts.dismiss(loadingToastId);
                }
                window.authToasts.logoutSuccess();
              }

              // Navigate to login
              if (window.spendWiseNavigate) {
                window.spendWiseNavigate('/login', { replace: true });
              } else {
                window.location.replace('/login');
              }

              return { success: true };
            } catch (error) {
              // silent

              // ✅ FIX: Force clear everything even if logout API fails
              clearAllCaches();
              clearTokens();
              try {
                sessionStorage.removeItem('spendwise-session-theme');
                sessionStorage.removeItem('spendwise-session-accessibility');
              } catch (_) {}
              sessionEnded();
              get().actions.reset();
              
              if (showToast && window.authToasts) {
                window.authToasts.logoutFailed();
              }
              
              return { success: false, error };
            }
          },

          // Set user data and derive role-based state
          setUser: (user) => {
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
              
              // ✅ Derive role-based state (UI ONLY - server validates permissions)
              state.userRole = (user && user.role) || 'user';
              state.isAdmin = user ? ['admin', 'super_admin'].includes(user.role || 'user') : false;
              state.isSuperAdmin = user ? (user.role || 'user') === 'super_admin' : false;
              
              // ✅ Set permissions based on role
              state.permissions = get().actions.getPermissionsForRole((user && user.role) || 'user');
              state.lastActivity = Date.now();
              // NOTE: the old 24h sessionExpiry force-logout timer is gone —
              // session lifetime is governed by the refresh token (7d) and
              // refreshManager. Logging active users out at an arbitrary
              // 24h mark was a bug, not a feature.
            });

            // Arm proactive token refresh for this session
            sessionStarted();

            // ✅ Sync user preferences with other stores
            get().actions.syncUserPreferences(user);
          },

          // Get permissions for role
          getPermissionsForRole: (role) => {
            const rolePermissions = {
              user: ['read:own', 'write:own'],
              admin: ['read:own', 'write:own', 'read:users', 'manage:users'],
              super_admin: ['read:own', 'write:own', 'read:users', 'manage:users', 'manage:system']
            };

            return rolePermissions[role] || rolePermissions.user;
          },

          // ✅ Sync user preferences with other stores - respects session overrides (theme/language)
          syncUserPreferences: (user) => {
            if (!user) return;

            try {
              // silent

              // ✅ Check for session overrides (user changed during this session from header/UI)
              let hasSessionThemeOverride = false;
              let hasSessionLanguageOverride = false;
              try {
                hasSessionThemeOverride = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('spendwise-session-theme');
              } catch (_) {}
              try {
                hasSessionLanguageOverride = typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('spendwise-session-language');
              } catch (_) {}

              // ✅ Sync with app store (FIXED: Direct import approach like Profile page) with override guard
              try {
                const appStore = useAppStore.getState();
                
                if (appStore && appStore.actions) {
                  // ✅ Sync currency - Use correct defaults and mappings
                  const userCurrency = user.currency_preference || user.currencyPreference || 'ILS';
                  // Handle legacy 'shekel' mapping to 'ILS'
                  const normalizedCurrency = userCurrency === 'shekel' ? 'ILS' : userCurrency;
                  
                  if (normalizedCurrency !== appStore.currency) {
                    appStore.actions.setCurrency(normalizedCurrency);
                    // silent
                  }

                  // ✅ Sync theme - Apply immediately to DOM (skip if user set a session override)
                  const userTheme = user.theme_preference || user.themePreference || 'system';
                  if (!hasSessionThemeOverride) {
                    if (userTheme !== appStore.theme) {
                      appStore.actions.setTheme(userTheme);
                      // silent
                      // Apply theme to DOM immediately
                      get().actions.applyThemeToDOM(userTheme);
                    }
                  } else {
                    // silent
                  }
                }
              } catch (error) {
                // silent
              }

              // ✅ Sync with translation store (FIXED: Direct import approach like Profile page) with override guard
              try {
                const translationStore = useTranslationStore.getState();
                
                if (translationStore && translationStore.actions) {
                  const userLanguage = user.language_preference || user.languagePreference || 'en';
                  if (!hasSessionLanguageOverride) {
                    if (userLanguage !== translationStore.currentLanguage) {
                      translationStore.actions.setLanguage(userLanguage);
                      // silent
                    }
                  } else {
                    // silent
                  }
                }
              } catch (error) {
                // silent
              }
              
              // silent
              
            } catch (error) {
              // silent
            }
          },

          // ✅ Apply theme to DOM immediately (helper for preference sync)
          applyThemeToDOM: (theme) => {
            try {
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else if (theme === 'light') {
                document.documentElement.classList.remove('dark');
              } else if (theme === 'system' || theme === 'auto') {
                // Apply system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
              }
            } catch (error) {
              // silent
            }
          },

          // Update last activity
          updateActivity: () => {
            set((state) => {
              state.lastActivity = Date.now();
            });
          },

          // ✅ Setup guest preferences (called on logout and app init for non-authenticated users)
          setupGuestPreferences: () => {
            try {
              // Clear any existing guest preferences (using direct store access)
              const appStore = useAppStore.getState();
              if (appStore && appStore.actions) {
                appStore.actions.clearGuestPreferences();
                appStore.actions.initializeGuestPreferences();
              }

              // Initialize guest language preferences (using direct store access)
              const translationStore = useTranslationStore.getState();
              if (translationStore && translationStore.actions) {
                translationStore.actions.setLanguage('en'); // Default to English for guests
              }

              // silent
            } catch (error) {
              // silent
            }
          },

          // ✅ Initialize authentication state (called on app startup)
          initializeAuth: () => {
            const { isAuthenticated } = get();
            
            if (!isAuthenticated) {
              // User is not authenticated, setup guest preferences
              get().actions.setupGuestPreferences();
            }
            // If authenticated, preferences will be synced via syncUserPreferences
          },

          // Reset auth store
          reset: () => {
            sessionEnded();

            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
              state.userRole = null;
              state.isAdmin = false;
              state.isSuperAdmin = false;
              state.permissions = [];
              state.lastActivity = Date.now();
              // Stay initialized: the app already booted; only the session
              // ended. (initialized=false used to block queries after logout.)
              state.initialized = true;
            });
          },

          // NOTE: token refresh scheduling lives in src/auth/refreshManager.js
          // (single-flight, transient-vs-fatal classification). The old
          // per-store timer that duplicated it was deleted.
        }
      })),
      {
        name: 'spendwise-auth',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist ONLY the user object — it's a paint cache so the UI can
          // render the profile instantly on reload. isAuthenticated is NEVER
          // persisted: it is always derived from the tokens in initialize(),
          // so the two can no longer disagree ("zombie session" bug).
          user: state.user,
          userRole: state.userRole,
          isAdmin: state.isAdmin,
          isSuperAdmin: state.isSuperAdmin
        })
      }
    )
  )
);

// ✅ Selectors for Performance
export const authSelectors = {
  user: (state) => state.user,
  isAuthenticated: (state) => state.isAuthenticated,
  isLoading: (state) => state.isLoading,
  userRole: (state) => state.userRole,
  isAdmin: (state) => state.isAdmin,
  isSuperAdmin: (state) => state.isSuperAdmin,
  error: (state) => state.error
};

// 🟢 PERF: granular selectors. Each one subscribes to a single slice, so
// the component using it ONLY re-renders when that slice changes. The old
// `useAuth()` (kept below for backward-compat) subscribes to the entire
// store + spreads it into a fresh object on every render — meaning every
// `useAuth` consumer re-rendered on any state change (token refresh,
// loading flag flicker, etc.) AND any useEffect deps including the
// returned object re-fired every render.
//
// Migration path: replace `const { user } = useAuth()` with `useAuthUser()`,
// `const { isAuthenticated } = useAuth()` with `useIsAuthenticated()`, etc.
export const useAuthUser        = () => useAuthStore(authSelectors.user);
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated);
export const useAuthLoading     = () => useAuthStore(authSelectors.isLoading);
export const useAuthRole        = () => useAuthStore(authSelectors.userRole);
export const useIsAdmin         = () => useAuthStore(authSelectors.isAdmin);
export const useIsSuperAdmin    = () => useAuthStore(authSelectors.isSuperAdmin);
export const useAuthError       = () => useAuthStore(authSelectors.error);

// Stable actions object (selector-based — `actions` is set in the initial
// store state and never reassigned, so reference identity is stable).
export const useAuthActions = () => useAuthStore((s) => s.actions);

// ⚠️ LEGACY: subscribes to the entire store. Prefer the granular selectors
// above for new code. Kept so existing call sites keep working.
export const useAuth = () => {
  const store = useAuthStore();
  return {
    // State
    ...store,

    // Actions
    login: store.actions.login,
    googleLogin: store.actions.googleLogin,
    register: store.actions.register,
    logout: store.actions.logout,
    updateProfile: store.actions.updateProfile,
    getProfile: store.actions.getProfile,
    verifyEmail: store.actions.verifyEmail,

    // Utilities
    reset: store.actions.reset
  };
};

export default useAuthStore; 