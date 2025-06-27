/**
 * Exchange Calculator Component - BEAUTIFUL GRADIENT DESIGN MATCHING SPENDWISE MODALS
 * 
 * ✅ ENHANCED: Beautiful gradient header with animations like CategoryManager/RecurringModal
 * ✅ INTEGRATED: Same window structure and responsive design
 * ✅ COLORFUL: Vibrant SpendWise design language
 * ✅ CONSISTENT: Same visual vibe as other modals
 * ✅ MOBILE: Fully responsive mobile design
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
      {/* ✅ FIXED: Mobile responsive overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        
        {/* ✅ FIXED: Mobile responsive modal with proper sizing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md sm:max-w-lg lg:max-w-2xl h-full max-h-[95vh] sm:max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          
          {/* ✅ FIXED: Compact mobile header */}
          <div className="flex-none bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white relative overflow-hidden">
            {/* ✅ REDUCED: Fewer animated elements for mobile performance */}
            <div className="absolute inset-0">
              <div className="absolute top-0 -right-4 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-4 sm:-bottom-8 -left-4 sm:-left-8 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
              <div className="absolute top-1/3 right-1/3 w-8 sm:w-16 h-8 sm:h-16 bg-white/20 rounded-full blur-xl animate-ping hidden sm:block" style={{ animationDuration: '3s' }} />
            </div>
            
            <div className="relative z-10 p-3 sm:p-4">
              {/* ✅ MOBILE: Compact header layout */}
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Calculator className="icon-adaptive-sm" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg lg:text-xl font-bold flex items-center gap-1 sm:gap-2">
                      {t('exchange.title')}
                      <Sparkles className="icon-adaptive-sm" />
                    </h1>
                    <div className="flex items-center gap-1 sm:gap-2 text-white/90 text-xs sm:text-sm">
                      <Globe className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">
                        {t('exchange.footer.possiblePairs', { 
                          count: conversionStats.availableCurrencies, 
                          pairs: conversionStats.possiblePairs 
                        })}
                      </span>
                      <span className="sm:hidden">
                        {t('exchange.footer.availableCurrencies', { count: conversionStats.availableCurrencies })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* ✅ MOBILE: Compact close button */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    size="small"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm p-1.5 sm:p-2"
                  >
                    <RefreshCw className="icon-adaptive-sm" />
                  </Button>
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200"
                  >
                    <X className="icon-adaptive-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* ✅ FIXED: Properly scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12 px-4">
                <div className="text-center">
                  <motion.div 
                    className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('exchange.loading')}</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <RefreshCw className="w-8 h-8 sm:w-12 sm:h-12 text-red-400 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('exchange.error.title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-sm mb-3 sm:mb-4">
                  {t('exchange.error.message')}
                </p>
                <Button onClick={() => refetch()} variant="outline" size="small">
                  <RefreshCw className="icon-adaptive-sm mr-2" />
                  {t('exchange.error.tryAgain')}
                </Button>
              </div>
            ) : (
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-4 sm:space-y-6">

                  {/* ✅ MOBILE: Compact amount input */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('exchange.form.amountLabel')}
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={t('exchange.form.amountPlaceholder')}
                      className="text-center text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 h-12 sm:h-14"
                      min="0"
                      step="0.01"
                    />
                  </motion.div>

                  {/* ✅ MOBILE: Compact currency selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    {/* From Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('exchange.form.fromLabel')}
                      </label>
                      <div className={`bg-gradient-to-r ${SUPPORTED_CURRENCIES[fromCurrency].color} p-[2px] rounded-xl`}>
                        <select
                          value={fromCurrency}
                          onChange={(e) => setFromCurrency(e.target.value)}
                          className="w-full p-3 sm:p-4 border-0 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                        >
                          {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.flag} {t(`exchange.currencies.${currency.code}`)} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center -my-1 sm:-my-2">
                      <motion.button
                        onClick={handleSwapCurrencies}
                        className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ArrowUpDown className="icon-adaptive-sm" />
                      </motion.button>
                    </div>

                    {/* To Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('exchange.form.toLabel')}
                      </label>
                      <div className={`bg-gradient-to-r ${SUPPORTED_CURRENCIES[toCurrency].color} p-[2px] rounded-xl`}>
                        <select
                          value={toCurrency}
                          onChange={(e) => setToCurrency(e.target.value)}
                          className="w-full p-3 sm:p-4 border-0 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                        >
                          {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.flag} {t(`exchange.currencies.${currency.code}`)} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>

                  {/* ✅ MOBILE: Compact conversion result */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="adaptive-card bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-xl sm:rounded-2xl border-2 border-green-200 dark:border-green-700"
                  >
                    <div className="text-center space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-lg sm:text-2xl">{SUPPORTED_CURRENCIES[fromCurrency].flag}</span>
                        <span className="font-semibold text-base sm:text-lg">{formatAmount(parseFloat(amount) || 0, fromCurrency)}</span>
                        <Zap className="icon-adaptive-sm text-yellow-500" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        <span className="text-lg sm:text-2xl mr-2">{SUPPORTED_CURRENCIES[toCurrency].flag}</span>
                        {formatAmount(convertedAmount, toCurrency)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 inline-block">
                        {t('exchange.result.rate', { from: fromCurrency, rate: getExchangeRate().toFixed(4), to: toCurrency })}
                      </div>
                    </div>
                  </motion.div>

                  {/* ✅ MOBILE: Responsive popular conversions grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('exchange.popular.title')}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {POPULAR_CONVERSIONS.map((conversion, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handlePopularConversion(conversion.from, conversion.to)}
                          className={cn(
                            "p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border-2",
                            fromCurrency === conversion.from && toCurrency === conversion.to
                              ? `bg-gradient-to-r ${conversion.gradient} text-white border-transparent shadow-lg`
                              : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 text-gray-700 dark:text-gray-300"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                            <span className="text-sm sm:text-lg">{SUPPORTED_CURRENCIES[conversion.from].flag}</span>
                            <ArrowUpDown className="w-2 h-2 sm:w-3 sm:h-3 opacity-70" />
                            <span className="text-sm sm:text-lg">{SUPPORTED_CURRENCIES[conversion.to].flag}</span>
                          </div>
                          <div className="text-xs opacity-90">
                            {conversion.from} → {conversion.to}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* ✅ MOBILE: Compact footer info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <Clock className="icon-adaptive-sm" />
                    <span className="text-center">
                      <span className="hidden sm:inline">{t('exchange.footer.liveRates')}</span>
                      <span className="sm:hidden">{t('exchange.footer.liveRatesMobile')}</span>
                    </span>
                    <Globe className="icon-adaptive-sm" />
                  </motion.div>

                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExchangeCalculator; 