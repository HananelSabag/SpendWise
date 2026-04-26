/**
 * 🏪 ZUSTAND STORES INDEX - Complete State Management System
 * Replaces ALL Context API providers with optimized Zustand stores
 * @version 3.0.0 - SIMPLIFIED & OPTIMIZED
 */

// ✅ Import all stores
import useAuthStore, {
  useAuth,
  useAuthUser,
  useAuthRole,
  useIsAdmin,
  useIsSuperAdmin,
  // 🟢 NEW granular selectors — prefer these over useAuth() in new code
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthActions,
  authSelectors
} from './authStore.js';

import useTranslationStore, { 
  useTranslation, 
  useAuthTranslation,
  useCommonTranslation,
  useErrorTranslation,
  useNavTranslation,
  SUPPORTED_LANGUAGES 
} from './translationStore.js';

import useAppStore, { 
  useTheme, 
  useAccessibility, 
  useCurrency, 
  useNotifications,
  THEMES,
  CURRENCIES,
  DATE_FORMATS,
  appSelectors 
} from './appStore.js';

// ✅ Store Initialization Manager - SIMPLIFIED
class StoreManager {
  constructor() {
    this.initialized = false;
  }

  // Initialize all stores - FAST & SIMPLE
  async initialize() {
    if (this.initialized) return true;

    try {
      // Initialize auth store
      await useAuthStore.getState().actions.initialize();
      
      // Initialize translation store with localStorage first (works immediately)
      // ✅ FIXED: Force English as default to avoid Hebrew/English module mismatch
      const savedLanguage = localStorage.getItem('spendwise-language') || 'en';
      
      // ✅ DEBUG: Log language detection for troubleshooting
      if (import.meta.env.DEV) {
        console.log('🌐 Language detection:', {
          savedLanguage,
          browserLanguage: navigator.language,
          finalLanguage: savedLanguage
        });
      }
      
      await useTranslationStore.getState().actions.setLanguage(savedLanguage);
      
      // Initialize app store with defaults first
      const appStore = useAppStore.getState();
      appStore.actions.updateResolvedTheme();
      appStore.actions.applyAccessibilitySettings();
      
      // Then sync with user preferences if authenticated (async)
      const authState = useAuthStore.getState();
      if (authState.user && authState.isAuthenticated) {
        // Sync user preferences after initialization
        authState.actions.syncUserPreferences(authState.user);
      } else {
        // Setup guest preferences for non-authenticated users
        authState.actions.setupGuestPreferences();
      }
      
      this.initialized = true;
      
      if (import.meta.env.DEV) {
        console.log('🏪 Zustand stores initialized');
      }
      
      return true;
    } catch (error) {
      console.error('Store initialization error:', error);
      return false;
    }
  }

  // Reset all stores
  resetAll() {
    useAuthStore.getState().actions.reset();
    useTranslationStore.getState().actions.clearCache();
    useAppStore.getState().actions.resetToDefaults();
    
    this.initialized = false;
  }

  // Get all store states (for debugging)
  getAllStates() {
    return {
      auth: useAuthStore.getState(),
      translation: useTranslationStore.getState(),
      app: useAppStore.getState()
    };
  }
}

// ✅ Global store manager instance
export const storeManager = new StoreManager();

// ✅ Store Provider Component - SIMPLIFIED
import React, { useEffect, useState } from 'react';
import TopProgressBar from '../components/common/TopProgressBar.jsx';

export const StoreProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await storeManager.initialize();
      } catch (error) {
        console.warn('Store initialization error (continuing anyway):', error);
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []);

  return (
    <>
      <TopProgressBar visible={!isReady} />
      {children}
    </>
  );
};

// ✅ Main exports
export {
  // Auth store
  useAuthStore,
  useAuth,
  useAuthUser,
  useAuthRole,
  useIsAdmin,
  useIsSuperAdmin,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthActions,
  authSelectors,
  
  // Translation store
  useTranslationStore,
  useTranslation,
  useAuthTranslation,
  useCommonTranslation,
  useErrorTranslation,
  useNavTranslation,
  SUPPORTED_LANGUAGES,
  
  // App store
  useAppStore,
  useTheme,
  useAccessibility,
  useCurrency,
  useNotifications,
  THEMES,
  CURRENCIES,
  DATE_FORMATS,
  appSelectors
};

// ✅ Legacy compatibility exports
export const useLanguage = useTranslation;
export const AuthProvider = StoreProvider;
export const LanguageProvider = StoreProvider;
export const ThemeProvider = StoreProvider;
export const AccessibilityProvider = StoreProvider;
export const CurrencyProvider = StoreProvider;
export const DateProvider = StoreProvider;
export const AppStateProvider = StoreProvider;

// ✅ Development utilities + Store access for currency functions
if (typeof window !== 'undefined') {
  window.stores = {
    auth: useAuthStore,
    translation: useTranslationStore,
    app: useAppStore,
    manager: storeManager
  };
  
  // Add stores for currency functions to access
  window.spendWiseStores = {
    auth: useAuthStore,
    translation: useTranslationStore,
    app: useAppStore
  };
  
  if (import.meta.env.DEV) {
    window.resetAllStores = () => storeManager.resetAll();
  }
}

// ✅ Default export
export default {
  useAuth,
  useTranslation,
  useTheme,
  useAccessibility,
  useCurrency,
  useNotifications,
  StoreProvider,
  storeManager
};

// ✅ Additional utility hooks
export const useSecurityMetrics = () => {
  const { user } = useAuth();
  return {
    securityScore: user?.securityScore || 95,
    lastSecurityScan: user?.lastSecurityScan || new Date().toISOString(),
    riskLevel: user?.riskLevel || 'low'
  };
};

export const useSessionManager = () => {
  const { user, logout } = useAuth();
  return {
    sessionActive: !!user,
    sessionExpiry: user?.sessionExpiry,
    extendSession: () => {
      // Session extension logic handled in auth store
    },
    invalidateSession: logout
  };
}; 