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
import { jwtDecode } from 'jwt-decode';
import { useAppStore } from './appStore';
import { useTranslationStore } from './translationStore';

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
          // Initialize auth store - SIMPLIFIED
          initialize: () => {
            // ✅ FIXED: Synchronous initialization to prevent race conditions
            const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

            set((state) => {
              state.initialized = true;
              state.isLoading = false;

              // Align auth state with actual token presence
              if (token) {
                state.isAuthenticated = true;
              } else {
                state.isAuthenticated = false;
                state.user = null;
                state.userRole = 'user';
                state.isAdmin = false;
                state.isSuperAdmin = false;
              }
            });

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
                
                // ✅ Login success - user data received
                
                set((state) => {
                  state.isAuthenticated = true;
                  state.user = userData;
                  state.userRole = userData?.role || 'user';
                  state.isAdmin = ['admin', 'super_admin'].includes(userData?.role || 'user');
                  state.isSuperAdmin = (userData?.role || 'user') === 'super_admin';
                  state.isLoading = false;
                  state.error = null;
                  state.sessionStart = new Date().toISOString();
                });

                // ✅ FIX: Start token refresh monitoring for regular login
                get().actions.startTokenRefreshTimer();

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
          googleLogin: async () => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const result = await authAPI.googleLogin();
              
              if (result.success) {
                const userData = result.user;
                
                set((state) => {
                  state.isAuthenticated = true;
                  state.user = userData;
                  state.userRole = userData?.role || 'user';
                  state.isAdmin = ['admin', 'super_admin'].includes(userData?.role || 'user');
                  state.isSuperAdmin = (userData?.role || 'user') === 'super_admin';
                  state.isLoading = false;
                  state.error = null;
                  state.sessionStart = new Date().toISOString();
                });

                // ✅ FIX: Start token refresh monitoring for Google login
                get().actions.startTokenRefreshTimer();

                // ✅ NEW: Apply user preferences immediately
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
          getProfile: async () => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const result = await authAPI.getProfile();
              
              if (result.success) {
                // 🔍 DEBUG: Log what auth store receives
                console.log('🔍 CLIENT: Auth store received user data:', {
                  hasPassword: result.user?.hasPassword,
                  has_password: result.user?.has_password,
                  oauth_provider: result.user?.oauth_provider,
                  google_id: result.user?.google_id,
                  userKeys: Object.keys(result.user || {})
                });
                
                // Update user data in store with fresh server data
                set((state) => {
                  state.user = result.user;
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
              set((state) => {
                state.error = { message: error.message || 'Failed to load profile' };
                state.isLoading = false;
              });
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

              // ✅ FIX: Clear timers first to prevent automatic refresh during logout
              get().actions.clearTokenRefreshTimer();

              // Call logout API (don't let this fail the logout)
              try {
                await authAPI.logout();
              } catch (error) {
                // Log error but continue with local logout
                // silent
              }

              // ✅ FIX: Clear ALL tokens and auth data  
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
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
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              try {
                sessionStorage.removeItem('spendwise-session-theme');
                sessionStorage.removeItem('spendwise-session-accessibility');
              } catch (_) {}
              get().actions.clearTokenRefreshTimer();
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
              
              // ✅ Update session
              state.lastActivity = Date.now();
              state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

              // ✅ FIX: Mock biometric (not implemented yet)
              state.biometricEnabled = false; // TODO: Implement BiometricAuthManager
            });

            // Setup auto logout timer
            get().actions.setupAutoLogout();

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

          // Setup auto logout timer
          setupAutoLogout: () => {
            const { autoLogoutTimer, sessionExpiry } = get();
            
            // Clear existing timer
            if (autoLogoutTimer) {
              clearTimeout(autoLogoutTimer);
            }

            // Set new timer
            if (sessionExpiry) {
              const timeUntilExpiry = sessionExpiry - Date.now();
              if (timeUntilExpiry > 0) {
                const timer = setTimeout(() => {
                  get().actions.logout();
                }, timeUntilExpiry);

                set((state) => {
                  state.autoLogoutTimer = timer;
                });
              }
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
            const { autoLogoutTimer, tokenRefreshTimer } = get();
            if (autoLogoutTimer) {
              clearTimeout(autoLogoutTimer);
            }
            if (tokenRefreshTimer) {
              clearTimeout(tokenRefreshTimer);
            }

            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.isLoading = false;
              state.error = null;
              state.userRole = null;
              state.isAdmin = false;
              state.isSuperAdmin = false;
              state.permissions = [];
              state.oauthProvider = null;
              state.isOAuthLogin = false;
              state.lastActivity = Date.now();
              state.sessionExpiry = null;
              state.autoLogoutTimer = null;
              state.tokenRefreshTimer = null;
              state.deviceFingerprint = null;
              state.securityAnalysis = null;
              state.biometricEnabled = false;
              state.initialized = false;
            });
          },

          // ✅ NEW: Token Refresh Timer Management
          startTokenRefreshTimer: () => {
            // Clear existing timer
            get().actions.clearTokenRefreshTimer();

            const token = localStorage.getItem('accessToken');
            if (!token) return;

            try {
              const decoded = jwtDecode(token);
              const now = Date.now() / 1000;
              
              // Refresh 2 minutes before expiry
              const refreshTime = (decoded.exp - now - 120) * 1000;
              
              if (refreshTime > 0) {
                const timer = setTimeout(async () => {
                  // silent
                  const result = await authAPI.refreshToken();
                  
                  if (result.success) {
                    // silent
                    // Restart timer for new token
                    get().actions.startTokenRefreshTimer();
                  } else if (result.requiresLogin) {
                    // silent
                    get().actions.logout(false); // Silent logout
                  }
                }, refreshTime);

                set((state) => {
                  state.tokenRefreshTimer = timer;
                });

                // silent
              }
            } catch (error) {
              // silent
            }
          },

          clearTokenRefreshTimer: () => {
            const { tokenRefreshTimer } = get();
            if (tokenRefreshTimer) {
              clearTimeout(tokenRefreshTimer);
              set((state) => {
                state.tokenRefreshTimer = null;
              });
            }
          }
        }
      })),
      {
        name: 'spendwise-auth',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist essential auth state
          isAuthenticated: state.isAuthenticated,
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

// ✅ Enhanced exports with performance selectors and all methods
export const useAuth = () => {
  const store = useAuthStore();
  return {
    // State
    ...store,
    
    // Actions
    login: store.actions.login,
    googleLogin: store.actions.googleLogin, // ✅ ADD: Export googleLogin method
    register: store.actions.register,
    logout: store.actions.logout,
    updateProfile: store.actions.updateProfile,
    getProfile: store.actions.getProfile, // ✅ ADD: Export getProfile method
    verifyEmail: store.actions.verifyEmail,
    
    // Utilities
    reset: store.actions.reset,
    setupBiometric: store.actions.setupBiometric,
    
    // Session management
    extendSession: store.actions.extendSession,
    checkSession: store.actions.checkSession
  };
};

export const useAuthUser = () => useAuthStore(authSelectors.user);
export const useAuthRole = () => useAuthStore(authSelectors.userRole);
export const useIsAdmin = () => useAuthStore(authSelectors.isAdmin);
export const useIsSuperAdmin = () => useAuthStore(authSelectors.isSuperAdmin);

export default useAuthStore; 