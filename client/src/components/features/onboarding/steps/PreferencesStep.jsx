/**
 * PreferencesStep Component - User preferences setup
 * 
 * ✅ FEATURES:
 * - Language selection
 * - Currency selection 
 * - Theme preference
 * - Budget preferences
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, Palette, DollarSign, Target, 
  Check, ChevronDown, Moon, Sun 
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useTheme } from '../../../../context/ThemeContext';
import { cn } from '../../../../utils/helpers';
import { Button } from '../../../ui';

/**
 * PreferencesStep - User preferences customization
 */
const PreferencesStep = ({ onNext, onPrevious, stepData, updateStepData }) => {
  const { t, language, changeLanguagePermanent } = useLanguage();
  const { user, updatePreferences } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const isRTL = language === 'he';

  const [preferences, setPreferences] = useState({
    language: language || 'en',
    currency: currency || 'USD',
    theme: theme || 'light',
    budgetAlerts: true,
    monthlyBudget: '',
    ...stepData.preferences
  });

  const [isLoading, setIsLoading] = useState(false);

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' }
  ];

  // Currency options
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
  ];

  // Handle preference changes
  const handleChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updateStepData({ preferences: newPreferences });
  };

  // Handle continue
  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Apply preferences immediately
      if (preferences.language !== language) {
        changeLanguagePermanent(preferences.language);
      }
      
      if (preferences.currency !== currency) {
        setCurrency(preferences.currency);
      }
      
      if (preferences.theme !== theme) {
        toggleTheme();
      }

      // Save preferences to user profile
      await updatePreferences({
        language: preferences.language,
        currency: preferences.currency,
        theme: preferences.theme,
        budgetAlerts: preferences.budgetAlerts,
        monthlyBudget: preferences.monthlyBudget ? parseFloat(preferences.monthlyBudget) : null
      });

      onNext();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-screen p-6",
      "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-4">
            <Palette className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('onboarding.preferences.title')}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300">
            {t('onboarding.preferences.subtitle')}
          </p>
        </div>

        {/* Preferences Form */}
        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="inline w-4 h-4 mr-2" />
              {t('profile.language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleChange('language', lang.code)}
                  className={cn(
                    "flex items-center p-3 rounded-lg border-2 transition-all",
                    preferences.language === lang.code
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  )}
                >
                  <span className="text-2xl mr-3">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {preferences.language === lang.code && (
                    <Check className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="inline w-4 h-4 mr-2" />
              {t('profile.currency')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {currencies.slice(0, 4).map(curr => (
                <button
                  key={curr.code}
                  onClick={() => handleChange('currency', curr.code)}
                  className={cn(
                    "flex items-center p-3 rounded-lg border-2 transition-all",
                    preferences.currency === curr.code
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  )}
                >
                  <span className="text-lg font-bold mr-2">{curr.symbol}</span>
                  <span className="font-medium">{curr.code}</span>
                  {preferences.currency === curr.code && (
                    <Check className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="inline w-4 h-4 mr-2" />
              {t('profile.theme')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChange('theme', 'light')}
                className={cn(
                  "flex items-center p-3 rounded-lg border-2 transition-all",
                  preferences.theme === 'light'
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Sun className="w-5 h-5 mr-3 text-yellow-500" />
                <span className="font-medium">{t('theme.light')}</span>
                {preferences.theme === 'light' && (
                  <Check className="w-5 h-5 text-blue-500 ml-auto" />
                )}
              </button>
              
              <button
                onClick={() => handleChange('theme', 'dark')}
                className={cn(
                  "flex items-center p-3 rounded-lg border-2 transition-all",
                  preferences.theme === 'dark'
                    ? "border-blue-500 bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                )}
              >
                <Moon className="w-5 h-5 mr-3 text-blue-500" />
                <span className="font-medium">{t('theme.dark')}</span>
                {preferences.theme === 'dark' && (
                  <Check className="w-5 h-5 text-blue-500 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Monthly Budget (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Target className="inline w-4 h-4 mr-2" />
              {t('budget.monthlyBudget')} <span className="text-gray-400">({t('common.optional')})</span>
            </label>
            <input
              type="number"
              placeholder={t('budget.enterAmount')}
              value={preferences.monthlyBudget}
              onChange={(e) => handleChange('monthlyBudget', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className={cn(
          "flex justify-between items-center mt-8 pt-6 border-t",
          isRTL ? "flex-row-reverse" : ""
        )}>
          <Button
            variant="ghost"
            onClick={onPrevious}
            className="flex items-center"
          >
            {isRTL ? <ChevronDown className="w-4 h-4 mr-2 rotate-90" /> : <ChevronDown className="w-4 h-4 ml-2 -rotate-90" />}
            {t('onboarding.common.previous')}
          </Button>

          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-8"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('common.saving')}
              </>
            ) : (
              <>
                {t('onboarding.common.next')}
                {isRTL ? <ChevronDown className="w-4 h-4 mr-2 -rotate-90" /> : <ChevronDown className="w-4 h-4 ml-2 rotate-90" />}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PreferencesStep; 