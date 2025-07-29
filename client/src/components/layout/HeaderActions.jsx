/**
 * ⚙️ HEADER ACTIONS - Theme, Language & Currency Controls
 * Extracted from Header.jsx for better performance and maintainability
 * Features: Theme toggle, Language switcher, Currency controls
 * @version 2.0.0 - CLEANED UP (removed settings duplicate)
 */

import React, { useCallback } from 'react';
import {
  Sun,
  Moon,
  Globe,
  DollarSign
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useTranslation, 
  useTheme,
  useCurrency,
  useNotifications
} from '../../stores';

import { cn } from '../../utils/helpers';

/**
 * ⚙️ Header Actions Component
 */
const HeaderActions = ({ 
  onOpenModal,
  className = '' 
}) => {
  const { currentLanguage, setLanguage, t } = useTranslation();
  const { isDark, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Handle theme toggle
  const handleThemeToggle = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    
    addNotification({
      type: 'success',
      message: t('common.themeChanged', { theme: t(`common.${newTheme}Theme`) })
    });
  }, [isDark, setTheme, addNotification, t]);

  // ✅ Handle language toggle
  const handleLanguageToggle = useCallback(() => {
    const newLanguage = currentLanguage === 'en' ? 'he' : 'en';
    setLanguage(newLanguage);
    
    addNotification({
      type: 'success',
      message: t('common.languageChanged')
    });
  }, [currentLanguage, setLanguage, addNotification, t]);

  // ✅ Currency configuration with symbols
  const currencyConfig = {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    ILS: { symbol: '₪', name: 'Israeli Shekel' },
    GBP: { symbol: '£', name: 'British Pound' },
    JPY: { symbol: '¥', name: 'Japanese Yen' }
  };

  // ✅ Handle currency cycle
  const handleCurrencyToggle = useCallback(() => {
    const currencies = Object.keys(currencyConfig);
    const currentIndex = currencies.indexOf(currency);
    const nextCurrency = currencies[(currentIndex + 1) % currencies.length];
    
    setCurrency(nextCurrency);
    
    addNotification({
      type: 'success',
      message: t('common.currencyChanged', { currency: nextCurrency })
    });
  }, [currency, setCurrency, addNotification, t, currencyConfig]);

  // ✅ Action buttons configuration - REMOVED SETTINGS (moved to user menu)
  const actionButtons = [
    {
      key: 'theme',
      icon: isDark ? Sun : Moon,
      label: isDark ? t('common.lightMode') : t('common.darkMode'),
      onClick: handleThemeToggle,
      className: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    },
    {
      key: 'language',
      icon: Globe,
      label: currentLanguage === 'en' ? 'עברית' : 'English',
      onClick: handleLanguageToggle,
      className: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    },
    {
      key: 'currency',
             icon: () => (
        <span className="font-bold text-lg leading-none w-5 h-5 flex items-center justify-center">
          {currencyConfig[currency]?.symbol || '$'}
        </span>
      ),
             label: currency,
      onClick: handleCurrencyToggle,
      className: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
      showLabel: true
    }
    // ✅ REMOVED: Settings button (available in user dropdown)
  ];

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {actionButtons.map((button) => {
        const Icon = button.icon;
        return (
          <button
            key={button.key}
            onClick={button.onClick}
            className={cn(
              "p-2 rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center",
              button.className
            )}
            title={button.label}
            aria-label={button.label}
          >
            {typeof Icon === 'function' ? <Icon /> : <Icon className="w-5 h-5" />}
            {button.showLabel && (
              <span className="ml-1 text-xs font-medium hidden sm:inline">
                {button.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default HeaderActions; 