/**
 * 💰 CURRENCY SELECTOR - Currency Preference Component
 * Extracted from massive PreferencesStep.jsx for better organization
 * Features: Popular currencies, Search, Regional grouping, Live formatting
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Search, Check, TrendingUp } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useCurrency } from '../../../../../stores';
import { Card, Input, Badge } from '../../../../ui';
import { cn } from '../../../../../utils/helpers';

/**
 * 💰 Currency Selector Component
 */
const CurrencySelector = ({
  selectedCurrency,
  onCurrencyChange,
  showSearch = true,
  showPopular = true,
  layout = 'grid', // grid, list
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency, availableCurrencies } = useCurrency();
  
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Enhanced currency data
  const currencyData = {
    USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸', popular: true, region: 'Americas' },
    EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', popular: true, region: 'Europe' },
    GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', popular: true, region: 'Europe' },
    JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', popular: true, region: 'Asia' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', popular: true, region: 'Americas' },
    AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', popular: true, region: 'Oceania' },
    CHF: { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', popular: false, region: 'Europe' },
    CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', popular: false, region: 'Asia' },
    INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', popular: false, region: 'Asia' },
    BRL: { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', popular: false, region: 'Americas' },
    RUB: { name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', popular: false, region: 'Europe' },
    KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', popular: false, region: 'Asia' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', popular: false, region: 'Asia' },
    NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', popular: false, region: 'Europe' },
    SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', popular: false, region: 'Europe' },
    ILS: { name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', popular: false, region: 'Middle East' }
  };

  // ✅ Filter available currencies
  const availableCurrencyOptions = useMemo(() => {
    return Object.entries(currencyData)
      .filter(([code]) => availableCurrencies.includes(code))
      .map(([code, data]) => ({ code, ...data }));
  }, [availableCurrencies]);

  // ✅ Filter currencies by search
  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return availableCurrencyOptions;
    
    const search = searchTerm.toLowerCase();
    return availableCurrencyOptions.filter(currency => 
      currency.code.toLowerCase().includes(search) ||
      currency.name.toLowerCase().includes(search) ||
      currency.symbol.includes(search)
    );
  }, [availableCurrencyOptions, searchTerm]);

  // ✅ Popular currencies
  const popularCurrencies = useMemo(() => {
    return filteredCurrencies.filter(currency => currency.popular);
  }, [filteredCurrencies]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // ✅ Render currency grid
  const renderGrid = (currencies) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {currencies.map((currency) => {
        const isSelected = selectedCurrency === currency.code;
        
        return (
          <motion.div
            key={currency.code}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => onCurrencyChange?.(currency.code)}
              className={cn(
                "relative p-3 cursor-pointer transition-all border-2 text-center",
                isSelected 
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Currency Info */}
              <div className="space-y-2">
                {/* Flag and Symbol */}
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl">{currency.flag}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currency.symbol}
                  </span>
                </div>

                {/* Code and Name */}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {currency.code}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {currency.name}
                  </div>
                </div>

                {/* Sample Amount */}
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(1234.56, currency.code)}
                </div>
              </div>

              {/* Popular Badge */}
              {currency.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 left-2"
                >
                  <Badge variant="warning" size="sm">
                    {t('preferences.currency.popular')}
                  </Badge>
                </motion.div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  // ✅ Render currency list
  const renderList = (currencies) => (
    <div className="space-y-2">
      {currencies.map((currency) => {
        const isSelected = selectedCurrency === currency.code;
        
        return (
          <motion.div
            key={currency.code}
            variants={itemVariants}
            whileHover={{ x: isRTL ? -4 : 4 }}
          >
            <Card
              onClick={() => onCurrencyChange?.(currency.code)}
              className={cn(
                "relative p-3 cursor-pointer transition-all border",
                isSelected 
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
              )}
            >
              <div className="flex items-center space-x-4">
                {/* Flag and Symbol */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-xl">{currency.flag}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {currency.symbol}
                  </span>
                </div>

                {/* Currency Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {currency.code}
                    </h3>
                    {currency.popular && (
                      <Badge variant="warning" size="sm">
                        {t('preferences.currency.popular')}
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge variant="success" size="sm">
                        {t('preferences.currency.selected')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currency.name} • {currency.region}
                  </div>
                </div>

                {/* Sample Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(1234.56, currency.code)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('preferences.currency.sample')}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <Check className="w-5 h-5 text-green-600" />
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('preferences.currency.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('preferences.currency.description')}
          </p>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('preferences.currency.searchPlaceholder')}
            className="pl-10"
          />
        </div>
      )}

      {/* Popular Currencies */}
      {showPopular && !searchTerm && popularCurrencies.length > 0 && (
        <motion.div variants={itemVariants}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>{t('preferences.currency.popularTitle')}</span>
          </h4>
          {layout === 'grid' ? renderGrid(popularCurrencies) : renderList(popularCurrencies)}
        </motion.div>
      )}

      {/* All Currencies */}
      {(!showPopular || searchTerm || popularCurrencies.length === 0) && (
        <motion.div variants={itemVariants}>
          {showPopular && searchTerm && (
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('preferences.currency.searchResults', { 
                count: filteredCurrencies.length,
                query: searchTerm 
              })}
            </h4>
          )}
          {layout === 'grid' ? renderGrid(filteredCurrencies) : renderList(filteredCurrencies)}
        </motion.div>
      )}

      {/* Empty State */}
      {filteredCurrencies.length === 0 && searchTerm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Search className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('preferences.currency.noResults', { query: searchTerm })}
          </p>
        </motion.div>
      )}

      {/* Selected Currency Preview */}
      {selectedCurrency && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700"
        >
          <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
            {t('preferences.currency.preview')}:
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{currencyData[selectedCurrency]?.flag}</span>
              <span className="font-medium text-green-900 dark:text-green-100">
                {currencyData[selectedCurrency]?.name}
              </span>
              <span className="text-sm text-green-700 dark:text-green-300">
                ({selectedCurrency})
              </span>
            </div>
            <div className="text-green-900 dark:text-green-100 font-medium">
              {formatCurrency(1234.56, selectedCurrency)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('preferences.currency.help')}
      </div>
    </motion.div>
  );
};

export default CurrencySelector; 