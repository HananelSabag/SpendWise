/**
 * 🌍 LANGUAGE SELECTOR - Language Preference Component
 * Extracted from massive PreferencesStep.jsx for better organization
 * Features: Language preview, Flag icons, RTL support, Live switching
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation } from '../../../../../stores';
import { Card, Badge } from '../../../../ui';
import { cn } from '../../../../../utils/helpers';

/**
 * 🌍 Language Selector Component
 */
const LanguageSelector = ({
  selectedLanguage,
  onLanguageChange,
  showPreview = true,
  layout = 'grid', // grid, list
  className = ''
}) => {
  const { t, availableLanguages, isRTL } = useTranslation('onboarding');

  // ✅ Language options with metadata
  const languageOptions = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr',
      completion: 100
    },
    {
      code: 'he',
      name: 'Hebrew',
      nativeName: 'עברית',
      flag: '🇮🇱',
      direction: 'rtl',
      completion: 100
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      direction: 'ltr',
      completion: 85
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      direction: 'ltr',
      completion: 80
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      direction: 'ltr',
      completion: 75
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      direction: 'rtl',
      completion: 70
    }
  ].filter(lang => availableLanguages && availableLanguages.includes && availableLanguages.includes(lang.code));

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {languageOptions.map((language) => {
        const isSelected = selectedLanguage === language.code;
        
        return (
          <motion.div
            key={language.code}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => onLanguageChange?.(language.code)}
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

              {/* Language Info */}
              <div className="text-center space-y-2">
                {/* Flag */}
                <div className="text-2xl">{language.flag}</div>
                
                {/* Names */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {language.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400" dir={language.direction}>
                    {language.nativeName}
                  </p>
                </div>

                {/* Completion Badge */}
                <div className="flex justify-center">
                  <Badge 
                    variant={language.completion === 100 ? "success" : "warning"} 
                    size="sm"
                  >
                    {language.completion}%
                  </Badge>
                </div>

                {/* Direction Indicator */}
                {language.direction === 'rtl' && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('preferences.language.rtl')}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  // ✅ Render list layout
  const renderList = () => (
    <div className="space-y-2">
      {languageOptions.map((language) => {
        const isSelected = selectedLanguage === language.code;
        
        return (
          <motion.div
            key={language.code}
            variants={itemVariants}
            whileHover={{ x: isRTL ? -4 : 4 }}
          >
            <Card
              onClick={() => onLanguageChange?.(language.code)}
              className={cn(
                "relative p-4 cursor-pointer transition-all border",
                isSelected 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              )}
            >
              <div className="flex items-center space-x-4">
                {/* Flag and Selection */}
                <div className="relative">
                  <div className="text-2xl">{language.flag}</div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Language Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {language.name}
                    </h3>
                    <Badge 
                      variant={language.completion === 100 ? "success" : "warning"} 
                      size="sm"
                    >
                      {language.completion}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400" dir={language.direction}>
                    {language.nativeName}
                  </p>
                  {language.direction === 'rtl' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('preferences.language.rtl')}
                    </p>
                  )}
                </div>

                {/* Current Indicator */}
                {isSelected && (
                  <Badge variant="primary" size="sm">
                    {t('preferences.language.current')}
                  </Badge>
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
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('preferences.language.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('preferences.language.description')}
          </p>
        </div>
      </div>

      {/* Language Options */}
      {layout === 'grid' ? renderGrid() : renderList()}

      {/* Preview */}
      {showPreview && selectedLanguage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('preferences.language.preview')}:
          </h4>
          <div className="text-sm text-gray-900 dark:text-white">
            {t('preferences.language.sampleText')}
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {t('preferences.language.help')}
      </div>
    </motion.div>
  );
};

export default LanguageSelector; 