/**
 * CurrencyContext - Database-Driven Multi-Currency Support
 * Syncs with user preferences from database, no localStorage for authenticated users
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExchangeRates, formatCurrency as formatCurrencyUtil } from '../utils/currencyAPI';
import { useAuth } from '../hooks/useAuth';
import { queryKeys } from '../utils/api';
import toast from 'react-hot-toast';

const CurrencyContext = createContext(null);

// Supported currencies with full metadata
export const SUPPORTED_CURRENCIES = {
  USD: { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar',
    locale: 'en-US',
    position: 'before' // Symbol position
  },
  ILS: { 
    code: 'ILS', 
    symbol: '₪', 
    name: 'Israeli Shekel',
    locale: 'he-IL',
    position: 'before'
  },
  EUR: { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro',
    locale: 'de-DE',
    position: 'before'
  },
  GBP: { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound',
    locale: 'en-GB',
    position: 'before'
  }
};

export const CurrencyProvider = ({ children }) => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  
  // Currency state - database driven for authenticated users
  const [currency, setCurrencyState] = useState(() => {
    // For authenticated users, use user preference
    if (user?.preferences?.currency) {
      return user.preferences.currency;
    }
    
    // For guests, check localStorage fallback
    if (!isAuthenticated) {
      const saved = localStorage.getItem('guestCurrency');
      return saved || 'USD';
    }
    
    return 'USD';
  });
  
  // Sync currency with user preferences
  useEffect(() => {
    if (user?.preferences?.currency && user.preferences.currency !== currency) {
      setCurrencyState(user.preferences.currency);
    }
  }, [user?.preferences?.currency]);
  
  // Exchange rates query with smart caching
  const { data: exchangeRates, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.exchangeRates(currency),
    queryFn: () => getExchangeRates(currency),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours - rates don't change frequently
    cacheTime: 12 * 60 * 60 * 1000, // 12 hours
    retry: 2,
    refetchInterval: 4 * 60 * 60 * 1000, // Refetch every 4 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!currency,
    initialData: {
      USD: currency === 'ILS' ? 0.27 : currency === 'EUR' ? 1.08 : currency === 'GBP' ? 1.27 : 1,
      ILS: currency === 'USD' ? 3.70 : currency === 'EUR' ? 4.00 : currency === 'GBP' ? 4.70 : 1,
      EUR: currency === 'USD' ? 0.93 : currency === 'ILS' ? 0.25 : currency === 'GBP' ? 1.16 : 1,
      GBP: currency === 'USD' ? 0.79 : currency === 'ILS' ? 0.21 : currency === 'EUR' ? 0.86 : 1
    }
  });
  
  // Change currency - syncs with database for authenticated users
  const changeCurrency = useCallback(async (newCurrency) => {
    if (!SUPPORTED_CURRENCIES[newCurrency]) {
      console.warn('Invalid currency code:', newCurrency);
      return;
    }
    
    // Optimistically update UI
    setCurrencyState(newCurrency);
    
    if (isAuthenticated) {
      // ✅ FIX: השתמש ב-updateProfile במקום updatePreferences
      try {
        await updateProfile({ currency_preference: newCurrency });
        toast.success(`Currency changed to ${SUPPORTED_CURRENCIES[newCurrency].name}`);
      } catch (error) {
        // Revert on error
        setCurrencyState(currency);
        toast.error('Failed to update currency preference');
      }
    } else {
      // For guests, save to localStorage
      localStorage.setItem('guestCurrency', newCurrency);
      toast.success(`Currency changed to ${SUPPORTED_CURRENCIES[newCurrency].name}`);
    }
  }, [isAuthenticated, updateProfile, currency]); // ✅ וודא ש-updateProfile בdependencies
  
  // Convert amount between currencies with caching
  const convertAmount = useCallback((amount, fromCurrency, toCurrency = currency) => {
    if (!amount || fromCurrency === toCurrency) return amount;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    
    // If we have the direct rate
    if (fromCurrency === currency && exchangeRates?.[toCurrency]) {
      return numAmount * exchangeRates[toCurrency];
    }
    
    // If we need to convert through the base currency
    if (exchangeRates?.[fromCurrency] && exchangeRates?.[toCurrency]) {
      // Convert to base currency first, then to target
      const inBaseCurrency = numAmount / exchangeRates[fromCurrency];
      return inBaseCurrency * exchangeRates[toCurrency];
    }
    
    // Fallback rates
    const fallbackRates = {
      USD: { ILS: 3.70, EUR: 0.93, GBP: 0.79 },
      ILS: { USD: 0.27, EUR: 0.25, GBP: 0.21 },
      EUR: { USD: 1.08, ILS: 4.00, GBP: 0.86 },
      GBP: { USD: 1.27, ILS: 4.70, EUR: 1.16 }
    };
    
    const rate = fallbackRates[fromCurrency]?.[toCurrency];
    return rate ? numAmount * rate : numAmount;
  }, [currency, exchangeRates]);
  
  // Format amount in the selected currency with proper locale
  const formatAmount = useCallback((amount, sourceCurrency = currency, options = {}) => {
    const convertedAmount = sourceCurrency === currency 
      ? amount 
      : convertAmount(amount, sourceCurrency, currency);
    
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    const locale = options.locale || currencyInfo.locale || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
      ...options
    }).format(convertedAmount);
  }, [currency, convertAmount]);
  
  // Format with compact notation for large numbers
  const formatCompact = useCallback((amount, sourceCurrency = currency) => {
    const convertedAmount = sourceCurrency === currency 
      ? amount 
      : convertAmount(amount, sourceCurrency, currency);
    
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    const formatter = new Intl.NumberFormat('en', {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    
    return `${currencyInfo.symbol}${formatter.format(convertedAmount)}`;
  }, [currency, convertAmount]);
  
  // Cycle through currencies
  const toggleCurrency = useCallback(() => {
    const currencies = Object.keys(SUPPORTED_CURRENCIES);
    const currentIndex = currencies.indexOf(currency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    changeCurrency(currencies[nextIndex]);
  }, [currency, changeCurrency]);
  
  // Get rate between two currencies
  const getRate = useCallback((from, to) => {
    if (from === to) return 1;
    
    if (from === currency) {
      return exchangeRates?.[to] || 1;
    }
    
    if (to === currency) {
      return 1 / (exchangeRates?.[from] || 1);
    }
    
    // Convert through base currency
    const fromRate = exchangeRates?.[from] || 1;
    const toRate = exchangeRates?.[to] || 1;
    return toRate / fromRate;
  }, [currency, exchangeRates]);
  
  // Memoized currency info
  const currentCurrency = useMemo(() => 
    SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD,
    [currency]
  );
  
  // Listen for external currency changes
  useEffect(() => {
    const handleCurrencyChange = (event) => {
      const newCurrency = event.detail;
      if (SUPPORTED_CURRENCIES[newCurrency] && newCurrency !== currency) {
        setCurrencyState(newCurrency);
      }
    };
    
    window.addEventListener('currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('currency-changed', handleCurrencyChange);
  }, [currency]);
  
  // Prefetch exchange rates for common currencies
  useEffect(() => {
    if (!exchangeRates || error) return;
    
    // Prefetch rates for quick switching
    const prefetchCurrencies = Object.keys(SUPPORTED_CURRENCIES).filter(c => c !== currency);
    prefetchCurrencies.forEach(targetCurrency => {
      // Cache the conversion calculation
      const testAmount = 100;
      convertAmount(testAmount, currency, targetCurrency);
    });
  }, [currency, exchangeRates, error, convertAmount]);
  
  const value = useMemo(() => ({
    // Current currency
    currency,
    setCurrency: changeCurrency,
    toggleCurrency,
    
    // Currency data
    currencies: SUPPORTED_CURRENCIES,
    currentCurrency,
    currencySymbol: currentCurrency.symbol,
    currencyName: currentCurrency.name,
    currencyLocale: currentCurrency.locale,
    
    // Exchange rates
    exchangeRates: exchangeRates || {},
    isLoadingRates: isLoading,
    ratesError: error,
    refreshRates: refetch,
    
    // Conversion methods
    convertAmount,
    formatAmount,
    formatCompact,
    getRate,
    
    // Utility
    formatCurrency: formatCurrencyUtil,
    isSupported: (code) => !!SUPPORTED_CURRENCIES[code]
  }), [
    currency,
    changeCurrency,
    toggleCurrency,
    currentCurrency,
    exchangeRates,
    isLoading,
    error,
    refetch,
    convertAmount,
    formatAmount,
    formatCompact,
    getRate
  ]);
  
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

// Export for external use
export default CurrencyContext;