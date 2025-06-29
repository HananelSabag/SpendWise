/**
 * GuestPreferences Component - Language & Theme toggles for unauthenticated users
 * 
 * ✅ FEATURES:
 * - Session-only preferences for guests (saved to localStorage)
 * - Language toggle (English/Hebrew)
 * - Theme toggle (Light/Dark)
 * - Auto-cleanup on login
 * - RTL support
 * - Beautiful minimal UI
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Sun, Moon, Languages, Palette } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/helpers';

const GuestPreferences = ({ className = '' }) => {
  const { isRTL, toggleLanguage, language, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();

  // Language display names
  const languageDisplay = {
    en: { name: 'English', flag: '🇺🇸' },
    he: { name: 'עברית', flag: '🇮🇱' }
  };

  const currentLanguage = languageDisplay[language] || languageDisplay.en;
  const nextLanguage = languageDisplay[language === 'he' ? 'en' : 'he'];

  return (
    <div className={cn(
      'flex items-center gap-2',
      className
    )}>
      {/* Language Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleLanguage}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200',
          'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
          'border border-gray-200 dark:border-gray-700',
          'hover:bg-white dark:hover:bg-gray-800',
          'hover:border-gray-300 dark:hover:border-gray-600',
          'shadow-sm hover:shadow-md',
          'text-gray-700 dark:text-gray-300'
        )}
        title={`Switch to ${nextLanguage.name}`}
        aria-label={`Current language: ${currentLanguage.name}. Click to switch to ${nextLanguage.name}`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <span className="text-sm font-medium sm:hidden">
          {currentLanguage.flag}
        </span>
      </motion.button>

      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200',
          'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
          'border border-gray-200 dark:border-gray-700',
          'hover:bg-white dark:hover:bg-gray-800',
          'hover:border-gray-300 dark:hover:border-gray-600',
          'shadow-sm hover:shadow-md',
          'text-gray-700 dark:text-gray-300'
        )}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-label={`Current theme: ${isDark ? 'dark' : 'light'} mode. Click to switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {isDark ? t('theme.light') : t('theme.dark')}
        </span>
      </motion.button>
    </div>
  );
};

export default GuestPreferences; 