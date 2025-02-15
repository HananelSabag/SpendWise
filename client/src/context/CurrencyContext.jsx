// CurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchExchangeRate } from '../utils/currencyAPI';

// Context for managing currency and exchange rates
const CurrencyContext = createContext(null);

// Fallback exchange rates in case the API request fails
const FALLBACK_RATES = {
  USD: { ILS: 3.6 },
  ILS: { USD: 0.28 }
};

// Supported currencies with symbols and metadata
export const currencies = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  ILS: { symbol: '₪', code: 'ILS', name: 'Israeli Shekel' }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('ILS'); // Current selected currency
  const [exchangeRates, setExchangeRates] = useState(FALLBACK_RATES); // Exchange rates storage
  const [isLoading, setIsLoading] = useState(false); // Loading state for exchange rates

  // Fetch exchange rates whenever the currency changes
  useEffect(() => {
    const fetchRates = async () => {
      if (currency === 'ILS') return; // Skip fetching if currency is ILS

      try {
        setIsLoading(true);
        const rate = await fetchExchangeRate('ILS', 'USD'); // Fetch ILS to USD exchange rate

        const newExchangeRates = {
          USD: { ILS: 1 / rate },
          ILS: { USD: rate }
        };

        // Log the updated exchange rates to the console
        console.log('Exchange Rates Updated:', newExchangeRates);

        setExchangeRates(newExchangeRates);
      } catch (error) {
        console.warn('Using fallback rates:', FALLBACK_RATES);

        // Log the fallback exchange rates to the console
        console.log('Fallback Exchange Rates:', FALLBACK_RATES);

        setExchangeRates(FALLBACK_RATES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [currency]);

  // Convert an amount from one currency to another
  const convertAmount = useCallback((amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency || !amount) return amount; // No conversion needed

    const rate = exchangeRates[fromCurrency]?.[toCurrency] 
      || FALLBACK_RATES[fromCurrency][toCurrency]; // Use fallback rates if necessary

    return amount * rate; // Perform conversion
  }, [exchangeRates]);

  // Format an amount based on the selected currency
  const formatAmount = useCallback((amount, sourceCurrency = 'ILS') => {
    if (!amount) return currencies[currency].symbol + '0';

    const convertedAmount = convertAmount(amount, sourceCurrency, currency);

    return new Intl.NumberFormat(currency === 'ILS' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(convertedAmount);
  }, [currency, convertAmount]);

  // Toggle between USD and ILS
  const toggleCurrency = useCallback(() => {
    setCurrency(prev => prev === 'USD' ? 'ILS' : 'USD');
  }, []);

  return (
    <CurrencyContext.Provider value={{
      currency,
      isLoading,
      toggleCurrency,
      formatAmount,
      convertAmount,
      currencySymbol: currencies[currency].symbol
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to access the CurrencyContext
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
