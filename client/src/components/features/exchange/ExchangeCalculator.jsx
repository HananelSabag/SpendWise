/**
 * 💱 EXCHANGE CALCULATOR - MOBILE-FIRST
 * Enhanced currency exchange calculator with real-time rates
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw,
  Clock, Star, History, Calculator, Globe, Zap,
  BookmarkPlus, Bookmark, AlertCircle, CheckCircle, X
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications
} from '../../../stores';

import { Button, Card, Input, Badge, Dropdown, Tooltip } from '../../ui';
import { cn } from '../../../utils/helpers';

const ExchangeCalculator = ({
  isOpen = false,
  onClose = () => {},
  onAddToTransaction,
  showHistory = true,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('exchange');
  const { 
    currency: baseCurrency, 
    availableCurrencies,
    formatCurrency,
    getExchangeRate,
    updateExchangeRates,
    exchangeRatesUpdatedAt
  } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  // State management
  const [fromCurrency, setFromCurrency] = useState(baseCurrency);
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState(['USD', 'EUR', 'GBP', 'JPY']);
  const [history, setHistory] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Popular currencies
  const popularCurrencies = availableCurrencies.filter(curr => 
    ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF'].includes(curr.code)
  );

  // Preset amounts
  const presetAmounts = [50, 100, 250, 500, 1000, 2500];

  // Calculate conversion
  const calculateConversion = useCallback(async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setConvertedAmount(0);
      setExchangeRate(0);
      return;
    }

    setIsLoading(true);
    try {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      const converted = parseFloat(amount) * rate;
      
      setExchangeRate(rate);
      setConvertedAmount(converted);
      setLastUpdated(new Date());

      // Add to history
      const historyItem = {
        id: Date.now(),
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
        convertedAmount: converted,
        rate,
        timestamp: new Date()
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.conversionFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }, [amount, fromCurrency, toCurrency, getExchangeRate, addNotification, t]);

  // Auto-calculate on changes (debounced input), throttle full rate refresh to 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && fromCurrency && toCurrency) {
        calculateConversion();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, fromCurrency, toCurrency, calculateConversion]);

  // Throttle background rates update to every 5 minutes
  useEffect(() => {
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();
    if (!exchangeRatesUpdatedAt || now - exchangeRatesUpdatedAt > fiveMinutes) {
      // fire and forget; calculateConversion will pick latest
      updateExchangeRates().catch(() => {});
    }
  }, [exchangeRatesUpdatedAt, updateExchangeRates]);

  // Swap currencies
  const swapCurrencies = useCallback(() => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    
    // Also swap amounts for convenience
    if (convertedAmount > 0) {
      setAmount(convertedAmount.toString());
    }
  }, [fromCurrency, toCurrency, convertedAmount]);

  // Refresh rates
  const refreshRates = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateExchangeRates();
      await calculateConversion();
      
      addNotification({
        type: 'success',
        title: t('success.ratesUpdated'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('errors.updateFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateExchangeRates, calculateConversion, addNotification, t]);

  // Toggle favorite
  const toggleFavorite = useCallback((currencyCode) => {
    setFavorites(prev => {
      if (prev.includes(currencyCode)) {
        return prev.filter(code => code !== currencyCode);
      } else {
        return [...prev, currencyCode];
      }
    });
  }, []);

  // Add to transaction
  const handleAddToTransaction = useCallback(() => {
    if (convertedAmount > 0 && onAddToTransaction) {
      onAddToTransaction({
        amount: convertedAmount,
        originalAmount: parseFloat(amount),
        fromCurrency,
        toCurrency,
        exchangeRate,
        description: t('exchange.addedTransaction', {
          fromAmount: formatCurrency(parseFloat(amount), fromCurrency),
          toAmount: formatCurrency(convertedAmount, toCurrency)
        })
      });

      addNotification({
        type: 'success',
        title: t('success.addedToTransaction'),
        duration: 3000
      });
    }
  }, [convertedAmount, amount, fromCurrency, toCurrency, exchangeRate, onAddToTransaction, formatCurrency, addNotification, t]);

  // Rate trend calculation
  const rateTrend = useMemo(() => {
    if (history.length < 2) return null;
    
    const current = history[0]?.rate || 0;
    const previous = history[1]?.rate || 0;
    
    return {
      direction: current > previous ? 'up' : current < previous ? 'down' : 'same',
      percentage: previous > 0 ? ((current - previous) / previous) * 100 : 0
    };
  }, [history]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container same sizing as Category/Recurring managers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-4 sm:inset-8 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('exchange.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400">{t('exchange.subtitle')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
        className={cn("space-y-6", className)}
      >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('exchange.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t('exchange.subtitle')}
        </p>
      </motion.div>

      {/* Main calculator */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 space-y-6">
          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('exchange.amount')}
            </label>
            
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-2xl font-bold text-center"
            />

            {/* Preset amounts */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={selectedPreset === preset ? "primary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAmount(preset.toString());
                    setSelectedPreset(preset);
                  }}
                >
                  {formatCurrency(preset, fromCurrency)}
                </Button>
              ))}
            </div>
          </div>

          {/* Currency selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            {/* From currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('exchange.from')}
              </label>
              
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between h-12">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {availableCurrencies.find(c => c.code === fromCurrency)?.flag}
                      </span>
                      <span className="font-medium">{fromCurrency}</span>
                    </div>
                    
                    {favorites.includes(fromCurrency) && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </Button>
                }
                items={[
                  // Favorites first
                  ...favorites.map(code => {
                    const currency = availableCurrencies.find(c => c.code === code);
                    return {
                      label: `${currency?.flag} ${code} - ${currency?.name}`,
                      onClick: () => setFromCurrency(code),
                      active: fromCurrency === code
                    };
                  }),
                  { type: 'separator' },
                  // All currencies
                  ...availableCurrencies
                    .filter(currency => !favorites.includes(currency.code))
                    .map(currency => ({
                      label: `${currency.flag} ${currency.code} - ${currency.name}`,
                      onClick: () => setFromCurrency(currency.code),
                      active: fromCurrency === currency.code
                    }))
                ]}
              />
            </div>

            {/* To currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('exchange.to')}
              </label>
              
              <Dropdown
                trigger={
                  <Button variant="outline" className="w-full justify-between h-12">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {availableCurrencies.find(c => c.code === toCurrency)?.flag}
                      </span>
                      <span className="font-medium">{toCurrency}</span>
                    </div>
                    
                    {favorites.includes(toCurrency) && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </Button>
                }
                items={[
                  // Favorites first
                  ...favorites.map(code => {
                    const currency = availableCurrencies.find(c => c.code === code);
                    return {
                      label: `${currency?.flag} ${code} - ${currency?.name}`,
                      onClick: () => setToCurrency(code),
                      active: toCurrency === code
                    };
                  }),
                  { type: 'separator' },
                  // All currencies
                  ...availableCurrencies
                    .filter(currency => !favorites.includes(currency.code))
                    .map(currency => ({
                      label: `${currency.flag} ${currency.code} - ${currency.name}`,
                      onClick: () => setToCurrency(currency.code),
                      active: toCurrency === currency.code
                    }))
                ]}
              />
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={swapCurrencies}
              className="p-3 rounded-full"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Result */}
          <div className="text-center space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  {t('exchange.calculating')}
                </span>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(convertedAmount, toCurrency)}
                </div>
                
                {exchangeRate > 0 && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                    </span>
                    
                    {rateTrend && rateTrend.direction !== 'same' && (
                      <div className={cn(
                        "flex items-center",
                        rateTrend.direction === 'up' ? "text-green-600" : "text-red-600"
                      )}>
                        {rateTrend.direction === 'up' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(rateTrend.percentage).toFixed(2)}%
                      </div>
                    )}
                  </div>
                )}

                {lastUpdated && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {t('exchange.lastUpdated', { 
                        time: lastUpdated.toLocaleTimeString() 
                      })}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={refreshRates}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={cn(
                "w-4 h-4 mr-2",
                isLoading && "animate-spin"
              )} />
              {t('exchange.refresh')}
            </Button>
            
            {onAddToTransaction && convertedAmount > 0 && (
              <Button
                variant="primary"
                onClick={handleAddToTransaction}
                className="flex-1"
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('exchange.addToTransaction')}
              </Button>
            )}
          </div>
        </Card>
          </motion.div>

          {/* Popular currencies */}
          <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('exchange.popularCurrencies')}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {popularCurrencies.map((currency) => (
            <Card
              key={currency.code}
              className={cn(
                "p-3 cursor-pointer transition-all hover:shadow-md",
                favorites.includes(currency.code) && "ring-2 ring-yellow-500"
              )}
              onClick={() => {
                if (fromCurrency === currency.code) {
                  setToCurrency(currency.code);
                } else {
                  setFromCurrency(currency.code);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{currency.flag}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {currency.code}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currency.name}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(currency.code);
                  }}
                  className="p-1"
                >
                  {favorites.includes(currency.code) ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  ) : (
                    <BookmarkPlus className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
          </motion.div>

          {/* History */}
          {showHistory && history.length > 0 && (
            <motion.div variants={itemVariants}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t('exchange.history')}
          </h3>
          
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => {
                    setFromCurrency(item.fromCurrency);
                    setToCurrency(item.toCurrency);
                    setAmount(item.amount.toString());
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">
                          {formatCurrency(item.amount, item.fromCurrency)}
                        </span>
                        <ArrowLeftRight className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">
                          {formatCurrency(item.convertedAmount, item.toCurrency)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.rate.toFixed(4)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              </Card>
            </motion.div>
          )}
          {/* Close container motion.div */}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExchangeCalculator; 