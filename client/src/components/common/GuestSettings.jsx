/**
 * ⚙️ GUEST SETTINGS - Mobile-First Theme & Language Controls
 * Extracted from Login.jsx for better reusability and performance
 * Features: Zustand stores, RTL support, Mobile-responsive
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sun, Moon, Globe } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useTheme } from '../../stores';
import { cn } from '../../utils/helpers';

/**
 * 🎛️ Guest Settings Component - Theme & Language Controls
 */
const GuestSettings = ({ className = '', position = 'top-right' }) => {
  const { t, currentLanguage, setLanguage, isRTL } = useTranslation();
  const { theme, isDark, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  // ✅ Toggle handlers
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'en' ? 'he' : 'en');
  };

  // ✅ Position classes
  const positionClasses = {
    'top-right': 'absolute top-4 right-4 z-20',
    'top-left': 'absolute top-4 left-4 z-20',
    'bottom-right': 'absolute bottom-4 right-4 z-20',
    'bottom-left': 'absolute bottom-4 left-4 z-20',
    'relative': 'relative'
  };

  return (
    <div className={cn(positionClasses[position], className)}>
      <div className="relative">
        {/* Settings Button */}
        <motion.button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "p-3 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
            "border border-gray-200 dark:border-gray-700",
            "shadow-lg hover:shadow-xl transition-all duration-200",
            "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
            "min-h-[44px] min-w-[44px] flex items-center justify-center" // Mobile touch target
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t('common.settings', { fallback: 'Settings' })}
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={cn(
                "absolute top-full mt-2 right-0 min-w-[200px]",
                "bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700",
                "backdrop-blur-sm bg-white/95 dark:bg-gray-800/95",
                "overflow-hidden z-50"
              )}
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {t('common.settings', { fallback: 'Settings' })}
                </h3>
              </div>

              {/* Settings Options */}
              <div className="p-2 space-y-1">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-lg",
                    "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    "transition-colors duration-150 text-sm",
                    "min-h-[40px] touch-manipulation" // Mobile optimization
                  )}
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 mr-3" />
                      {t('common.lightMode', { fallback: 'Light Mode' })}
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-3" />
                      {t('common.darkMode', { fallback: 'Dark Mode' })}
                    </>
                  )}
                </button>

                {/* Language Toggle */}
                <button
                  onClick={toggleLanguage}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-lg",
                    "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    "transition-colors duration-150 text-sm",
                    "min-h-[40px] touch-manipulation" // Mobile optimization
                  )}
                >
                  <Globe className="w-4 h-4 mr-3" />
                  {currentLanguage === 'en' 
                    ? t('common.hebrew', { fallback: 'עברית' })
                    : t('common.english', { fallback: 'English' })
                  }
                </button>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('common.guestMode', { fallback: 'Guest Mode' })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GuestSettings; 