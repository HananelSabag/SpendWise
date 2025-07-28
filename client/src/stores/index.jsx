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
      
      // Initialize translation store
      const savedLanguage = localStorage.getItem('spendwise-language') || 
                           (navigator.language.startsWith('he') ? 'he' : 'en');
      await useTranslationStore.getState().actions.setLanguage(savedLanguage);
      
      // Initialize app store
      const appStore = useAppStore.getState();
      appStore.actions.updateResolvedTheme();
      appStore.actions.applyAccessibilitySettings();
      
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

export const StoreProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simple initialization without complex timeouts
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

  // Simple loading screen - no timeouts needed
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Initializing SpendWise...
          </p>
        </div>
      </div>
    );
  }

  return children;
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

// ✅ Development utilities
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.stores = {
    auth: useAuthStore,
    translation: useTranslationStore,
    app: useAppStore,
    manager: storeManager
  };
  
  window.resetAllStores = () => storeManager.resetAll();
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