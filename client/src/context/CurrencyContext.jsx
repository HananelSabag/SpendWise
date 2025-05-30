// src/context/CurrencyContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExchangeRates, formatCurrency as formatCurrencyUtil } from '../utils/currencyAPI';

const CurrencyContext = createContext(null);

// Supported currencies
export const currencies = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  ILS: { symbol: '₪', code: 'ILS', name: 'Israeli Shekel' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' }
};

export const CurrencyProvider = ({ children }) => {
  // Get initial currency from localStorage or default to ILS
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('preferredCurrency') || 'ILS';
  });
  
  // Use React Query for exchange rates
  const { data: exchangeRates, isLoading, error, refetch } = useQuery({
    queryKey: ['exchangeRates', currency],
    queryFn: () => getExchangeRates(currency),
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    initialData: {
      USD: currency === 'ILS' ? 0.28 : 1,
      ILS: currency === 'USD' ? 3.6 : 1,
      EUR: currency === 'USD' ? 0.92 : currency === 'ILS' ? 0.26 : 1
    }
  });
  
  // Save currency preference
  const updateCurrency = useCallback((newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  }, []);
  
  // Convert amount between currencies
  const convertAmount = useCallback((amount, fromCurrency, toCurrency = currency) => {
    if (!amount || fromCurrency === toCurrency) return amount;
    
    // If we have the direct rate
    if (fromCurrency === currency && exchangeRates?.[toCurrency]) {
      return amount * exchangeRates[toCurrency];
    }
    
    // If we need to convert through the base currency
    if (exchangeRates?.[fromCurrency] && exchangeRates?.[toCurrency]) {
      // Convert to base currency first, then to target
      const inBaseCurrency = amount / exchangeRates[fromCurrency];
      return inBaseCurrency * exchangeRates[toCurrency];
    }
    
    // Fallback rates
    const fallbackRates = {
      USD: { ILS: 3.6, EUR: 0.92 },
      ILS: { USD: 0.28, EUR: 0.26 },
      EUR: { USD: 1.09, ILS: 3.91 }
    };
    
    const rate = fallbackRates[fromCurrency]?.[toCurrency];
    return rate ? amount * rate : amount;
  }, [currency, exchangeRates]);
  
  // Format amount in the selected currency
  const formatAmount = useCallback((amount, sourceCurrency = 'ILS') => {
    const convertedAmount = convertAmount(amount, sourceCurrency, currency);
    return formatCurrencyUtil(convertedAmount, currency);
  }, [currency, convertAmount]);
  
  // Toggle between currencies
  const toggleCurrency = useCallback(() => {
    const availableCurrencies = Object.keys(currencies);
    const currentIndex = availableCurrencies.indexOf(currency);
    const nextIndex = (currentIndex + 1) % availableCurrencies.length;
    updateCurrency(availableCurrencies[nextIndex]);
  }, [currency, updateCurrency]);
  
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
  
  const value = {
    // Current currency
    currency,
    setCurrency: updateCurrency,
    toggleCurrency,
    
    // Currency data
    currencies,
    currencySymbol: currencies[currency].symbol,
    currencyName: currencies[currency].name,
    
    // Exchange rates
    exchangeRates: exchangeRates || {},
    isLoading,
    error,
    refreshRates: refetch,
    
    // Conversion methods
    convertAmount,
    formatAmount,
    getRate,
    
    // Utility
    formatCurrency: formatCurrencyUtil
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