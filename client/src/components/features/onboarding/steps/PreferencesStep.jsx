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
  Check, ChevronDown, Moon, Sun, Heart, Shield, ChevronRight, ChevronLeft, Monitor
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
  const { user, updateProfile, updatePreferences } = useAuth();
  const { currency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const isRTL = language === 'he';

  const [preferences, setPreferences] = useState({
    language: language || 'en',
    currency: currency || 'USD',
    theme: theme || 'light',
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

  // Theme options – translation-driven names
  const themes = [
    { code: 'light', icon: Sun },
    { code: 'dark', icon: Moon },
    { code: 'system', icon: Monitor }
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
      // ✅ OPTIMIZATION: Only apply changes if they're different from current values
      let hasChanges = false;
      const profileUpdates = {};

      // Check and apply language change
      if (preferences.language !== language) {
        console.log('🌐 [ONBOARDING] Language change detected:', language, '→', preferences.language);
        changeLanguagePermanent(preferences.language);
        profileUpdates.language_preference = preferences.language;
        hasChanges = true;
      }
      
      // Check and apply theme change
      if (preferences.theme !== theme) {
        console.log('🎨 [ONBOARDING] Theme change detected:', theme, '→', preferences.theme);
        setTheme(preferences.theme);
        profileUpdates.theme_preference = preferences.theme;
        hasChanges = true;
      }

      // Check and apply currency change
      if (preferences.currency !== currency) {
        console.log('💰 [ONBOARDING] Currency change detected:', currency, '→', preferences.currency);
        profileUpdates.currency_preference = preferences.currency;
        hasChanges = true;
      }

      // ✅ OPTIMIZATION: Only save to database if there are actual changes
      if (hasChanges) {
        console.log('💾 [ONBOARDING] Saving profile changes:', profileUpdates);
        await updateProfile(profileUpdates);
      } else {
        console.log('✅ [ONBOARDING] No preference changes detected, skipping API call');
      }

      // ✅ REMOVED: Monthly budget feature not implemented yet
      // No JSONB preferences to save in onboarding for now
      console.log('✅ [ONBOARDING] No additional preferences to save, basic settings only');

      // ✅ IMPROVED: Better success message
      if (hasChanges) {
        console.log('🎉 [ONBOARDING] Preferences saved successfully');
      } else {
        console.log('✅ [ONBOARDING] No changes to save, proceeding to next step');
      }
      
      console.log('🚀 [ONBOARDING] Calling onNext() to proceed to next step');
      onNext();
      console.log('✅ [ONBOARDING] onNext() called successfully');
    } catch (error) {
      console.error('❌ [ONBOARDING] Failed to save preferences:', error);
      
      // ✅ IMPROVED: Better error handling - show specific error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save preferences';
      console.error('Full error details:', error);
      
      // Still allow user to continue but show warning
      if (window.confirm(`שגיאה בשמירת ההעדפות: ${errorMessage}\n\nהאם לאפתח להמשיך בכל זאת?`)) {
        onNext();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col justify-center">
      {/* ✅ COMPACT: Ultra-Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('onboarding.preferences.title')}
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {t('onboarding.preferences.description')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Language & Currency - ULTRA-COMPACT */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card space-y-3 p-4 rounded-xl"
        >
          <h3 className={cn(
            "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Globe className="w-4 h-4 text-blue-600" />
            {t('onboarding.preferences.localization')}
          </h3>

          <div className="space-y-3">
            {/* Language Selection - ULTRA-COMPACT */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {t('onboarding.preferences.language')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleChange('language', lang.code)}
                    className={cn(
                      "p-2 rounded-lg border transition-all duration-200 text-xs",
                      preferences.language === lang.code
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-2 justify-center",
                      isRTL && "flex-row-reverse"
                    )}>
                      <span className="text-sm">{lang.flag}</span>
                      <span className="font-medium text-xs">{lang.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Selection - ULTRA-COMPACT */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {t('onboarding.preferences.currency')}
              </label>
              <select
                value={preferences.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className={cn(
                  "input w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs bg-white dark:bg-gray-800",
                  isRTL && "text-right"
                )}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {t(`exchange.currencies.${currency.code}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Theme & Budget - ULTRA-COMPACT */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="card space-y-3 p-4 rounded-xl"
        >
          <h3 className={cn(
            "text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2",
            isRTL && "flex-row-reverse"
          )}>
            <Palette className="w-4 h-4 text-purple-600" />
            {t('onboarding.preferences.appearance')}
          </h3>

          <div className="space-y-3">
            {/* Theme Selection - ULTRA-COMPACT */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {t('onboarding.preferences.theme')}
              </label>
              <div className="grid grid-cols-3 gap-1">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.code}
                    onClick={() => handleChange('theme', themeOption.code)}
                    className={cn(
                      "p-2 rounded-lg border transition-all duration-200 text-center",
                      preferences.theme === themeOption.code
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                  >
                    <themeOption.icon className="w-3 h-3 mx-auto mb-0.5" />
                    <span className="text-xs font-medium">{t(`onboarding.preferences.themes.${themeOption.code}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Future Features Placeholder - Budget will be added later */}
            <div className="text-center py-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('onboarding.preferences.comingSoon')}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ✅ COMPACT: Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-center mt-4"
      >
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className={cn(
            "px-6 py-2 text-sm font-semibold",
            "bg-gradient-to-r from-purple-600 to-blue-600",
            "hover:from-purple-700 hover:to-blue-700",
            "transform hover:scale-105 transition-all duration-200",
            "shadow-md hover:shadow-lg",
            isRTL && "flex-row-reverse"
          )}
        >
          {isLoading ? (
            <span className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('onboarding.preferences.saving')}</span>
            </span>
          ) : (
            <span className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <Heart className="w-4 h-4" />
              <span>{t('onboarding.common.next')}</span>
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default PreferencesStep; 