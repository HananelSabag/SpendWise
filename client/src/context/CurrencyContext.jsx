/**
 * CurrencyContext - Display-Only Currency Support
 * Shows amounts in user's preferred currency symbol format
 * NO actual conversion - symbol display only for user convenience
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const CurrencyContext = createContext(null);

// Supported currencies with symbol information only
export const SUPPORTED_CURRENCIES = {
  USD: { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar',
    locale: 'en-US'
  },
  ILS: { 
    code: 'ILS', 
    symbol: '₪', 
    name: 'Israeli Shekel',
    locale: 'he-IL'
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro',
    locale: 'de-DE'
  },
  GBP: { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound',
    locale: 'en-GB'
  }
};

export const CurrencyProvider = ({ children }) => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const toastService = useToast();
  
  // Currency state - user's display preference (SYMBOL ONLY)
  const [currency, setCurrencyState] = useState(() => {
    // For authenticated users, use user preference
    if (user?.preferences?.currency) {
      return user.preferences.currency;
    }
    
    // For guests, check localStorage fallback
    if (!isAuthenticated) {
      const saved = localStorage.getItem('guestCurrency');
      return saved || 'ILS';
    }
    
    return 'ILS'; // Default to ILS for Israeli app
  });

  // Sync currency with user preferences
  useEffect(() => {
    if (user?.preferences?.currency && user.preferences.currency !== currency) {
      setCurrencyState(user.preferences.currency);
    }
  }, [user?.preferences?.currency]);
  
  // Currency change (updates symbol preference only)
  const changeCurrency = useCallback(async (newCurrency, options = {}) => {
    if (!SUPPORTED_CURRENCIES[newCurrency]) {
      console.warn('Invalid currency code:', newCurrency);
      return;
    }
    
    console.log(`💰 [CURRENCY] Symbol change: ${currency} → ${newCurrency}`);
    
    const previousCurrency = currency;
    
    // Optimistically update UI
    setCurrencyState(newCurrency);
    
    if (isAuthenticated) {
      try {
        await updateProfile({ currency_preference: newCurrency });
        // ✅ FIXED: Only show toast if not suppressed (ProfileManager handles its own toasts)
        if (!options.suppressToast) {
          toastService.success('toast.success.preferencesUpdated');
        }
      } catch (error) {
        // Revert on error
        setCurrencyState(previousCurrency);
        if (!options.suppressToast) {
          toastService.error('toast.error.operationFailed');
        }
        throw error; // Re-throw so ProfileManager can handle the error
      }
    } else {
      // For guests, save to localStorage
      localStorage.setItem('guestCurrency', newCurrency);
      if (!options.suppressToast) {
        toastService.success('toast.success.preferencesUpdated');
      }
    }
  }, [isAuthenticated, updateProfile, currency, toastService]);
  
  // Format amount with currency symbol (NO CONVERSION - DISPLAY ONLY)
  const formatAmount = useCallback((amount, sourceCurrency = 'ILS', options = {}) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0';
    
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    const locale = options.locale || currencyInfo.locale || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
      ...options
    }).format(numAmount);
  }, [currency]);
  
  // Format with compact notation for large numbers (SYMBOL ONLY)
  const formatCompact = useCallback((amount, sourceCurrency = 'ILS') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0';
    
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    
    return new Intl.NumberFormat(currencyInfo.locale || 'en-US', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(numAmount);
  }, [currency]);

  // Get currency symbol
  const getCurrencySymbol = useCallback((currencyCode) => {
    return SUPPORTED_CURRENCIES[currencyCode]?.symbol || '₪';
  }, []);

  // Get currency info
  const getCurrencyInfo = useCallback((currencyCode) => {
    return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.ILS;
  }, []);

  const value = {
    currency,
    changeCurrency,
    formatAmount,
    formatCompact,
    getCurrencySymbol,
    getCurrencyInfo,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    isLoading: false // No API calls in display-only mode
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;