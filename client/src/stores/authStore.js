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
          // Initialize auth store
          initialize: async () => {
            try {
              console.log('🔐 Initializing auth store...');
              
              set((state) => {
                state.initialized = true;
                state.isLoading = false;
              });

              // Check for existing token
              const token = localStorage.getItem('accessToken');
              if (token) {
                try {
                  // Try to validate token
                  const user = await authAPI.validateToken(token);
                  if (user.success) {
                    set((state) => {
                      state.isAuthenticated = true;
                      state.user = user.data;
                      state.userRole = user.data.role || 'user';
                      state.isAdmin = user.data.isAdmin || ['admin', 'super_admin'].includes(user.data.role);
                      state.isSuperAdmin = user.data.isSuperAdmin || user.data.role === 'super_admin';
                    });
                  } else {
                    // Invalid token, clear it
                    localStorage.removeItem('accessToken');
                  }
                } catch (error) {
                  console.warn('Token validation failed:', error);
                  localStorage.removeItem('accessToken');
                }
              }

              console.log('✅ Auth store initialized successfully');
              return true;
            } catch (error) {
              console.error('❌ Auth store initialization failed:', error);
              set((state) => {
                state.initialized = true; // Mark as initialized anyway
                state.isLoading = false;
              });
              return false;
            }
          },

          // Basic login
          login: async (email, password, options = {}) => {
            console.log('🔑 Auth store login called', { email });
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Use the authAPI login method
              const result = await authAPI.login(email, password);
              console.log('🔑 Auth API result:', result);
              
              if (result.success) {
                const userData = result.user;
                console.log('🔑 Setting user data:', userData);
                
                // Small delay to ensure token is saved properly
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Force a state update to ensure all components see the authenticated state
                set((state) => {
                  state.isAuthenticated = true;
                  state.user = userData;
                  state.userRole = userData.role || 'user';
                  state.isAdmin = ['admin', 'super_admin'].includes(userData.role);
                  state.isSuperAdmin = userData.role === 'super_admin';
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
              console.error('🔑 Auth store login error:', error);
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

          // Logout
          logout: async () => {
            try {
              // Clear token
              localStorage.removeItem('accessToken');
              
              // Reset state
              set((state) => {
                state.isAuthenticated = false;
                state.user = null;
                state.userRole = 'user';
                state.isAdmin = false;
                state.isSuperAdmin = false;
                state.sessionStart = null;
                state.error = null;
              });

              return { success: true };
            } catch (error) {
              console.error('Logout failed:', error);
              return { success: false, error: error.message };
            }
          },

          // Set user data and derive role-based state
          setUser: (user) => {
            set((state) => {
              state.user = user;
              state.isAuthenticated = true;
              state.isLoading = false;
              state.error = null;
              
              // ✅ Derive role-based state
              state.userRole = user.role || 'user';
              state.isAdmin = ['admin', 'super_admin'].includes(user.role);
              state.isSuperAdmin = user.role === 'super_admin';
              
              // ✅ Set permissions based on role
              state.permissions = get().actions.getPermissionsForRole(user.role);
              
              // ✅ Update session
              state.lastActivity = Date.now();
              state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

              // Check if user has biometric enabled
              state.biometricEnabled = BiometricAuthManager.hasRegisteredCredentials();
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

// ✅ Convenience hooks
export const useAuth = () => {
  const store = useAuthStore();
  
  // Set global store reference for API client error handling
  if (typeof window !== 'undefined') {
    window.spendWiseAuthStore = useAuthStore;
  }
  
  return {
    ...store,
    login: store.actions.login,
    logout: store.actions.logout,
    getProfile: store.actions.getProfile
  };
};

export const useAuthUser = () => useAuthStore(authSelectors.user);
export const useAuthRole = () => useAuthStore(authSelectors.userRole);
export const useIsAdmin = () => useAuthStore(authSelectors.isAdmin);
export const useIsSuperAdmin = () => useAuthStore(authSelectors.isSuperAdmin);

export default useAuthStore; 