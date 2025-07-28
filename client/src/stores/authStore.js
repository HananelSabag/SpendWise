/**
 * 🔐 AUTH STORE - SIMPLIFIED
 * Basic authentication with role-based access
 * @version 2.0.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authAPI } from '../api';

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
            const token = localStorage.getItem('accessToken');
              
              set((state) => {
                state.initialized = true;
                state.isLoading = false;

              // Simple token check - if exists, assume authenticated
              if (token) {
                      state.isAuthenticated = true;
                // Will be validated on first API call
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
                state.error = api.normalizeError ? api.normalizeError(error) : { message: error.message };
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

          // Logout - SIMPLIFIED
          logout: async () => {
              // Clear token
              localStorage.removeItem('accessToken');
              
              // Reset state
            get().actions.reset();

            // Navigate to login
                if (window.spendWiseNavigate) {
                  window.spendWiseNavigate('/login', { replace: true });
                } else {
                  window.location.replace('/login');
                }

            return { success: true };
          },

          // Set user data and derive role-based state
          setUser: (user) => {
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
              
              // ✅ Derive role-based state
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

          // ✅ Sync user preferences with other stores
          syncUserPreferences: (user) => {
            if (!user) return;

            try {
              // Sync with app store
              const appStore = window.spendWiseStores?.app || (typeof useAppStore !== 'undefined' ? useAppStore.getState() : null);
              if (appStore && appStore.actions) {
                // Sync currency
                const userCurrency = user.currency_preference || user.currencyPreference || 'USD';
                if (userCurrency !== appStore.currency) {
                  appStore.actions.setCurrency(userCurrency);
                }

                // Sync theme
                const userTheme = user.theme_preference || user.themePreference || 'light';
                if (userTheme !== appStore.theme) {
                  appStore.actions.setTheme(userTheme);
                }
              }

              // Sync with translation store
              const translationStore = window.spendWiseStores?.translation || (typeof useTranslationStore !== 'undefined' ? useTranslationStore.getState() : null);
              if (translationStore && translationStore.actions) {
                const userLanguage = user.language_preference || user.languagePreference || 'en';
                if (userLanguage !== translationStore.currentLanguage) {
                  translationStore.actions.setLanguage(userLanguage);
                }
              }
            } catch (error) {
              console.warn('Failed to sync user preferences:', error);
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

          // Reset auth store
          reset: () => {
            const { autoLogoutTimer } = get();
            if (autoLogoutTimer) {
              clearTimeout(autoLogoutTimer);
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
              state.deviceFingerprint = null;
              state.securityAnalysis = null;
              state.biometricEnabled = false;
              state.initialized = false;
            });
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