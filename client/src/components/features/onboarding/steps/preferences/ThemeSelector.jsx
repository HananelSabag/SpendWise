/**
 * 🎨 THEME SELECTOR - Theme Preference Component
 * Extracted from massive PreferencesStep.jsx for better organization
 * Features: Live preview, System detection, Dark/Light modes, Auto mode
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useTheme } from '../../../../../stores';
import { Card, Badge } from '../../../../ui';
import { cn } from '../../../../../utils/helpers';

/**
 * 🎨 Theme Selector Component
 */
const ThemeSelector = ({
  selectedTheme,
  onThemeChange,
  showPreview = true,
  layout = 'grid', // grid, list
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const { isDark, systemTheme } = useTheme();

  // ✅ Theme options
  const themeOptions = [
    {
      value: 'light',
      label: t('preferences.theme.light'),
      description: t('preferences.theme.lightDescription'),
      icon: Sun,
      colors: {
        primary: '#3B82F6',
        secondary: '#F3F4F6',
        text: '#111827',
        background: '#FFFFFF'
      },
      preview: 'Light theme with bright colors'
    },
    {
      value: 'dark',
      label: t('preferences.theme.dark'),
      description: t('preferences.theme.darkDescription'),
      icon: Moon,
      colors: {
        primary: '#3B82F6',
        secondary: '#374151',
        text: '#F9FAFB',
        background: '#111827'
      },
      preview: 'Dark theme for low-light environments'
    },
    {
      value: 'auto',
      label: t('preferences.theme.auto'),
      description: t('preferences.theme.autoDescription'),
      icon: Monitor,
      colors: {
        primary: '#3B82F6',
        secondary: systemTheme === 'dark' ? '#374151' : '#F3F4F6',
        text: systemTheme === 'dark' ? '#F9FAFB' : '#111827',
        background: systemTheme === 'dark' ? '#111827' : '#FFFFFF'
      },
      preview: 'Matches your system preference'
    }
  ];

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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

  // ✅ Render grid layout
  const renderGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {themeOptions.map((theme) => {
        const isSelected = selectedTheme === theme.value;
        const IconComponent = theme.icon;
        
        return (
          <motion.div
            key={theme.value}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => onThemeChange?.(theme.value)}
              className={cn(
                "relative p-4 cursor-pointer transition-all border-2",
                isSelected 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              )}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* Theme Preview */}
              <div className="space-y-3">
                {/* Icon */}
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* Preview Window */}
                <div 
                  className="w-full h-20 rounded-lg border overflow-hidden"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  <div 
                    className="h-6 border-b flex items-center px-2"
                    style={{ 
                      backgroundColor: theme.colors.secondary,
                      borderColor: theme.colors.primary + '20'
                    }}
                  >
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <div 
                      className="h-2 rounded"
                      style={{ backgroundColor: theme.colors.primary, width: '60%' }}
                    ></div>
                    <div 
                      className="h-2 rounded"
                      style={{ backgroundColor: theme.colors.text + '40', width: '80%' }}
                    ></div>
                    <div 
                      className="h-2 rounded"
                      style={{ backgroundColor: theme.colors.text + '20', width: '40%' }}
                    ></div>
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {theme.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {theme.description}
                  </p>
                </div>
              </div>

              {/* Current Badge */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 left-2"
                >
                  <Badge variant="primary" size="sm">
                    {t('preferences.theme.current')}
                  </Badge>
                </motion.div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  // ✅ Render list layout
  const renderList = () => (
    <div className="space-y-3">
      {themeOptions.map((theme) => {
        const isSelected = selectedTheme === theme.value;
        const IconComponent = theme.icon;
        
        return (
          <motion.div
            key={theme.value}
            variants={itemVariants}
            whileHover={{ x: isRTL ? -4 : 4 }}
          >
            <Card
              onClick={() => onThemeChange?.(theme.value)}
              className={cn(
                "relative p-4 cursor-pointer transition-all border",
                isSelected 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              )}
            >
              <div className="flex items-center space-x-4">
                {/* Icon and Preview */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* Theme Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {theme.label}
                    </h3>
                    {isSelected && (
                      <Badge variant="primary" size="sm">
                        {t('preferences.theme.current')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {theme.description}
                  </p>
                </div>

                {/* Color Preview */}
                <div className="flex-shrink-0 flex space-x-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.colors.primary }}
                  ></div>
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.colors.background }}
                  ></div>
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.colors.secondary }}
                  ></div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <Check className="w-5 h-5 text-blue-600" />
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
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
          <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('preferences.theme.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('preferences.theme.description')}
          </p>
        </div>
      </div>

      {/* Theme Options */}
      {layout === 'grid' ? renderGrid() : renderList()}

      {/* Current System Theme Info */}
      {selectedTheme === 'auto' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center space-x-2 text-sm">
            <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-100">
              {t('preferences.theme.systemDetected', { 
                theme: systemTheme === 'dark' 
                  ? t('preferences.theme.dark')
                  : t('preferences.theme.light')
              })}
            </span>
          </div>
        </motion.div>
      )}

      {/* Preview */}
      {showPreview && selectedTheme && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('preferences.theme.preview')}:
          </h4>
          <div className="text-sm text-gray-900 dark:text-white">
            {t('preferences.theme.currentlyUsing', {
              theme: themeOptions.find(t => t.value === selectedTheme)?.label
            })}
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('preferences.theme.help')}
      </div>
    </motion.div>
  );
};

export default ThemeSelector; 