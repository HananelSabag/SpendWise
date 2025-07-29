// src/utils/currencyAPI.js - Enhanced currency API with caching
import axios from 'axios';
import { storage } from './helpers';

const API_URL = import.meta.env.VITE_CURRENCY_API_URL || 'https://api.frankfurter.app';
const CACHE_KEY = 'exchange_rates';
const CACHE_DURATION = 60; // 60 minutes

// Fallback rates
const FALLBACK_RATES = {
  USD: { ILS: 3.6, EUR: 0.92 },
  ILS: { USD: 0.28, EUR: 0.26 },
  EUR: { USD: 1.09, ILS: 3.91 }
};

/**
 * Get cached rates or fetch new ones
 */
export const getExchangeRates = async (base = 'USD') => {
  try {
    // Check cache first
    const cached = storage.get(`${CACHE_KEY}_${base}`);
    if (cached) {
      console.log(`Using cached rates for ${base}`);
      return cached;
    }

    // Fetch fresh rates
    console.log(`Fetching fresh rates for ${base}...`);
    const response = await axios.get(`${API_URL}/latest`, {
      params: { from: base },
      timeout: 5000
    });

    if (response.data && response.data.rates) {
      const rates = response.data.rates;
      
      // Cache the results
      storage.set(`${CACHE_KEY}_${base}`, rates, CACHE_DURATION);
      
      return rates;
    }

    throw new Error('Invalid response from currency API');
  } catch (error) {
    console.error('Currency API error:', error.message);
    
    // Return fallback rates
    return FALLBACK_RATES[base] || {};
  }
};

/**
 * Convert amount between currencies
 */
export const convertCurrency = async (amount, from, to) => {
  if (from === to) return amount;
  
  try {
    const rates = await getExchangeRates(from);
    const rate = rates[to];
    
    if (!rate) {
      // Try reverse conversion
      const reverseRates = await getExchangeRates(to);
      const reverseRate = reverseRates[from];
      
      if (reverseRate) {
        return amount / reverseRate;
      }
      
      throw new Error(`No rate found for ${from} to ${to}`);
    }
    
    return amount * rate;
  } catch (error) {
    console.error('Currency conversion error:', error);
    
    // Use fallback rates
    const fallbackRate = FALLBACK_RATES[from]?.[to];
    if (fallbackRate) {
      return amount * fallbackRate;
    }
    
    // Last resort - return original amount
    return amount;
  }
};

/**
 * Get specific exchange rate
 */
export const getExchangeRate = async (from, to) => {
  if (from === to) return 1;
  
  const rates = await getExchangeRates(from);
  return rates[to] || null;
};

/**
 * Get all available currencies
 */
export const getAvailableCurrencies = async () => {
  try {
    const response = await axios.get(`${API_URL}/currencies`, {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to fetch currencies:', error);
    
    // Return common currencies as fallback
    return {
      USD: 'United States Dollar',
      EUR: 'Euro',
      ILS: 'Israeli New Shekel',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      CHF: 'Swiss Franc'
    };
  }
};

/**
 * Format currency with proper symbol
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    ILS: '₪',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF'
  };
  
  return symbols[currency] || currency;
};

/**
 * Clear currency cache
 */
export const clearCurrencyCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_KEY)) {
      localStorage.removeItem(key);
    }
  });
};

// Export for backward compatibility
export const fetchExchangeRate = getExchangeRate;

export default {
  getExchangeRates,
  getExchangeRate,
  convertCurrency,
  getAvailableCurrencies,
  formatCurrency,
  getCurrencySymbol,
  clearCurrencyCache
};