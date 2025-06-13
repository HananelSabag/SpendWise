/**
 * Exchange Calculator Component - BEAUTIFUL GRADIENT DESIGN MATCHING SPENDWISE MODALS
 * 
 * ✅ ENHANCED: Beautiful gradient header with animations like CategoryManager/RecurringModal
 * ✅ INTEGRATED: Same window structure and responsive design
 * ✅ COLORFUL: Vibrant SpendWise design language
 * ✅ CONSISTENT: Same visual vibe as other modals
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  Clock,
  Globe,
  X,
  Calculator,
  RefreshCw,
  Zap,
  TrendingUp,
  DollarSign,
  Sparkles,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getExchangeRates } from '../../../utils/currencyAPI';
import { queryKeys } from '../../../utils/api';
import { useLanguage } from '../../../context/LanguageContext';
import { cn } from '../../../utils/helpers';
import { Card, Input, Button } from '../../ui';

const SUPPORTED_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', color: 'from-green-500 to-emerald-500' },
  ILS: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱', color: 'from-blue-500 to-cyan-500' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', color: 'from-indigo-500 to-purple-500' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', color: 'from-red-500 to-pink-500' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', color: 'from-orange-500 to-amber-500' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', color: 'from-teal-500 to-cyan-500' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', color: 'from-yellow-500 to-orange-500' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭', color: 'from-gray-500 to-slate-500' }
};

const POPULAR_CONVERSIONS = [
  { from: 'USD', to: 'ILS', label: 'USD → ILS', gradient: 'from-green-500 to-blue-500' },
  { from: 'EUR', to: 'ILS', label: 'EUR → ILS', gradient: 'from-purple-500 to-blue-500' },
  { from: 'ILS', to: 'USD', label: 'ILS → USD', gradient: 'from-blue-500 to-green-500' },
  { from: 'GBP', to: 'USD', label: 'GBP → USD', gradient: 'from-red-500 to-green-500' },
  { from: 'EUR', to: 'USD', label: 'EUR → USD', gradient: 'from-purple-500 to-green-500' },
  { from: 'ILS', to: 'EUR', label: 'ILS → EUR', gradient: 'from-blue-500 to-purple-500' }
];

const ExchangeCalculator = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('ILS');
  const [convertedAmount, setConvertedAmount] = useState(null);

  // Get exchange rates - Use ILS as base for Frankfurter API
  const { data: exchangeRates, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.exchangeRates('ILS'),
    queryFn: () => getExchangeRates('ILS'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: isOpen // Only fetch when modal is open
  });

  // Get exchange rate for display
  const getExchangeRate = React.useCallback(() => {
    if (!exchangeRates || fromCurrency === toCurrency) return 1;
    
    if (fromCurrency === 'ILS') {
      return exchangeRates[toCurrency] || 0;
    } else if (toCurrency === 'ILS') {
      return 1 / (exchangeRates[fromCurrency] || 1);
    } else {
      const fromToILS = exchangeRates[fromCurrency];
      const ILSToTarget = exchangeRates[toCurrency];
      if (fromToILS && ILSToTarget) {
        return ILSToTarget / fromToILS;
      }
      return 0;
    }
  }, [exchangeRates, fromCurrency, toCurrency]);

  // Calculate conversion statistics
  const conversionStats = React.useMemo(() => {
    const currencies = Object.keys(SUPPORTED_CURRENCIES);
    const pairs = currencies.length * (currencies.length - 1);
    const rate = getExchangeRate();
    
    return {
      availableCurrencies: currencies.length,
      possiblePairs: pairs,
      currentRate: rate,
      isValidConversion: rate > 0
    };
  }, [fromCurrency, toCurrency, exchangeRates, getExchangeRate]);

  // Fixed conversion calculation
  useEffect(() => {
    if (amount && exchangeRates && fromCurrency !== toCurrency) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        if (fromCurrency === 'ILS') {
          // Converting from ILS to other currency
          const rate = exchangeRates[toCurrency];
          if (rate) {
            setConvertedAmount(numAmount * rate);
          }
        } else if (toCurrency === 'ILS') {
          // Converting to ILS from other currency
          const rate = exchangeRates[fromCurrency];
          if (rate) {
            setConvertedAmount(numAmount / rate);
          }
        } else {
          // Converting between two non-ILS currencies via ILS
          const fromToILS = exchangeRates[fromCurrency]; // Rate from fromCurrency to ILS
          const ILSToTarget = exchangeRates[toCurrency]; // Rate from ILS to toCurrency
          if (fromToILS && ILSToTarget) {
            const amountInILS = numAmount / fromToILS;
            setConvertedAmount(amountInILS * ILSToTarget);
          }
        }
      }
    } else if (fromCurrency === toCurrency) {
      setConvertedAmount(parseFloat(amount) || 0);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  // Swap currencies
  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Handle popular conversion click
  const handlePopularConversion = (from, to) => {
    setFromCurrency(from);
    setToCurrency(to);
  };

  // Enhanced format with proper currency display
  const formatAmount = (amount, currency) => {
    if (!amount || isNaN(amount)) return '0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* ✅ ENHANCED: Beautiful modal overlay matching other modals */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        
        {/* ✅ ENHANCED: Modal with beautiful gradient header like RecurringModal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          
          {/* ✅ NEW: Beautiful gradient header with animations */}
          <div className="flex-none bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white relative overflow-hidden">
            {/* ✅ NEW: Animated background decoration */}
            <div className="absolute inset-0">
              <div className="absolute top-0 -right-4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500" />
              <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
              
              {/* ✅ NEW: Floating animated particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{
                    top: `${10 + i * 15}%`,
                    left: `${5 + i * 15}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10 p-4">
              {/* ✅ Enhanced: Compact header with title and close button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
                      Exchange Calculator
                      <Sparkles className="w-4 h-4" />
                    </h1>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Globe className="w-3 h-3" />
                      <span>
                        {conversionStats.availableCurrencies} currencies • {conversionStats.possiblePairs} conversion pairs
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* ✅ Enhanced: Close button matching other modals */}
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ✅ Enhanced: Action buttons in header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2 justify-end"
              >
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  loading={isLoading}
                  size="small"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* ✅ Enhanced: Content area with proper scrolling */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <motion.div 
                    className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-gray-600 dark:text-gray-400">Loading exchange rates...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Failed to Load Exchange Rates
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm mb-4">
                  Unable to fetch current exchange rates. Please check your connection.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-y-auto h-full p-6">
                <div className="space-y-6">

                  {/* Amount Input Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Amount to Convert
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100"
                      className="text-center text-xl font-bold bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 h-14"
                      min="0"
                      step="0.01"
                    />
                  </motion.div>

                  {/* Currency Selection Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    {/* From Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        From
                      </label>
                      <div className={`bg-gradient-to-r ${SUPPORTED_CURRENCIES[fromCurrency].color} p-[2px] rounded-xl`}>
                        <select
                          value={fromCurrency}
                          onChange={(e) => setFromCurrency(e.target.value)}
                          className="w-full p-4 border-0 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                        >
                          {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.flag} {currency.name} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center -my-2">
                      <motion.button
                        onClick={handleSwapCurrencies}
                        className="p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ArrowUpDown className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* To Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        To
                      </label>
                      <div className={`bg-gradient-to-r ${SUPPORTED_CURRENCIES[toCurrency].color} p-[2px] rounded-xl`}>
                        <select
                          value={toCurrency}
                          onChange={(e) => setToCurrency(e.target.value)}
                          className="w-full p-4 border-0 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                        >
                          {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.flag} {currency.name} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>

                  {/* Conversion Result */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700"
                  >
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-2xl">{SUPPORTED_CURRENCIES[fromCurrency].flag}</span>
                        <span className="font-semibold text-lg">{formatAmount(parseFloat(amount) || 0, fromCurrency)}</span>
                        <Zap className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        <span className="text-2xl mr-2">{SUPPORTED_CURRENCIES[toCurrency].flag}</span>
                        {formatAmount(convertedAmount, toCurrency)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 rounded-full px-4 py-2 inline-block">
                        1 {fromCurrency} = {getExchangeRate().toFixed(4)} {toCurrency}
                      </div>
                    </div>
                  </motion.div>

                  {/* Popular Conversions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Popular Conversions
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {POPULAR_CONVERSIONS.map((conversion, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handlePopularConversion(conversion.from, conversion.to)}
                          className={cn(
                            "p-3 rounded-xl text-sm font-medium transition-all duration-200 border-2",
                            fromCurrency === conversion.from && toCurrency === conversion.to
                              ? `bg-gradient-to-r ${conversion.gradient} text-white border-transparent shadow-lg`
                              : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 text-gray-700 dark:text-gray-300"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-lg">{SUPPORTED_CURRENCIES[conversion.from].flag}</span>
                            <ArrowUpDown className="w-3 h-3 opacity-70" />
                            <span className="text-lg">{SUPPORTED_CURRENCIES[conversion.to].flag}</span>
                          </div>
                          <div className="text-xs opacity-90">
                            {conversion.from} → {conversion.to}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Footer Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Live rates • Updated every 5 minutes</span>
                    <Globe className="w-4 h-4" />
                  </motion.div>

                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExchangeCalculator; 