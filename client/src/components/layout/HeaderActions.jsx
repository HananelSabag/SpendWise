/**
 * ⚙️ HEADER ACTIONS - Theme & Language Controls
 * Extracted from Header.jsx for better performance and maintainability
 * Features: Theme toggle, Language switcher (SESSION-ONLY changes)
 * @version 2.1.0 - SIMPLIFIED (removed currency control - use Profile page for persistent changes)
 */

import React, { useCallback } from 'react';
import {
  Sun,
  Moon,
  Globe
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useTranslation, 
  useTheme,
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
  const { addNotification } = useNotifications();

  // ✅ Handle theme toggle (SESSION-ONLY: Does not save to database)
  const handleThemeToggle = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    
    // ✅ Save guest preferences for non-authenticated users
    if (window.spendWiseStores?.auth?.getState?.()?.isAuthenticated === false) {
      window.spendWiseStores?.app?.getState?.()?.actions?.saveGuestPreferences?.();
    }
    
    addNotification({
      type: 'success',
      message: t('common.themeChanged', { theme: t(`common.${newTheme}Theme`) })
    });
  }, [isDark, setTheme, addNotification, t]);

  // ✅ Handle language toggle (SESSION-ONLY: Does not save to database)
  const handleLanguageToggle = useCallback(() => {
    const newLanguage = currentLanguage === 'en' ? 'he' : 'en';
    setLanguage(newLanguage);
    
    // ✅ Save guest preferences for non-authenticated users
    if (window.spendWiseStores?.auth?.getState?.()?.isAuthenticated === false) {
      // For guests, save language preference to sessionStorage
      try {
        const guestPrefs = JSON.parse(sessionStorage.getItem('spendwise-guest-preferences') || '{}');
        guestPrefs.language = newLanguage;
        guestPrefs.timestamp = Date.now();
        sessionStorage.setItem('spendwise-guest-preferences', JSON.stringify(guestPrefs));
      } catch (error) {
        console.warn('Failed to save guest language preference:', error);
      }
    }
    
    addNotification({
      type: 'success',
      message: t('common.languageChanged')
    });
  }, [currentLanguage, setLanguage, addNotification, t]);

  // ✅ Action buttons configuration - Theme & Language only (SESSION changes)
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
    }
    // ✅ REMOVED: Currency button (use Profile page for persistent currency changes)
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