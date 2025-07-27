/**
 * ⚙️ ONBOARDING PREFERENCES STEP - MOBILE-FIRST
 * Enhanced preference setup for new users
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Palette, DollarSign, Type, Sun, Moon, Settings,
  Check, ChevronRight, Sparkles, Target, Zap, Shield
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useTheme, 
  useCurrency,
  useAccessibility,
  useAuth,
  useNotifications
} from '../../../../stores';

import { Button, Card } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const PreferencesStep = ({
  onNext,
  onPrevious,
  onComplete,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { 
    currentLanguage,
    setLanguage,
    t, 
    isRTL,
    availableLanguages 
  } = useTranslation('onboarding');
  const {
    theme,
    setTheme,
    isDark
  } = useTheme();
  const {
    currency,
    setCurrency,
    availableCurrencies
  } = useCurrency();
  const {
    fontSize,
    setFontSize
  } = useAccessibility();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Local state for onboarding preferences
  const [preferences, setPreferences] = useState({
    language: currentLanguage,
    theme: theme,
    currency: currency,
    fontSize: fontSize,
    notifications: true,
    analytics: true,
    tips: true
  });

  const [currentSection, setCurrentSection] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Update preferences
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    // Apply immediately for preview
    switch (key) {
      case 'language':
        setLanguage(value);
        break;
      case 'theme':
        setTheme(value);
        break;
      case 'currency':
        setCurrency(value);
        break;
      case 'fontSize':
        setFontSize(value);
        break;
      default:
        break;
    }
  }, [setLanguage, setTheme, setCurrency, setFontSize]);

  // Check if all essential preferences are set
  useEffect(() => {
    const essential = ['language', 'theme', 'currency'];
    const completed = essential.every(key => preferences[key]);
    setIsComplete(completed);
  }, [preferences]);

  // Preference sections configuration
  const preferenceSections = [
    {
      id: 'language',
      title: t('preferences.language.title'),
      description: t('preferences.language.description'),
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      options: availableLanguages.map(lang => ({
        value: lang.code,
        label: lang.name,
        flag: lang.flag,
        description: lang.nativeName
      }))
    },
    {
      id: 'theme',
      title: t('preferences.theme.title'),
      description: t('preferences.theme.description'),
      icon: Palette,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      options: [
        { 
          value: 'light', 
          label: t('preferences.theme.light'), 
          icon: Sun,
          description: t('preferences.theme.lightDesc')
        },
        { 
          value: 'dark', 
          label: t('preferences.theme.dark'), 
          icon: Moon,
          description: t('preferences.theme.darkDesc')
        },
        { 
          value: 'auto', 
          label: t('preferences.theme.auto'), 
          icon: Settings,
          description: t('preferences.theme.autoDesc')
        }
      ]
    },
    {
      id: 'currency',
      title: t('preferences.currency.title'),
      description: t('preferences.currency.description'),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      options: availableCurrencies.slice(0, 8).map(curr => ({
        value: curr.code,
        label: `${curr.symbol} ${curr.code}`,
        description: curr.name,
        flag: curr.flag
      }))
    },
    {
      id: 'fontSize',
      title: t('preferences.fontSize.title'),
      description: t('preferences.fontSize.description'),
      icon: Type,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      options: [
        { 
          value: 'sm', 
          label: t('preferences.fontSize.small'), 
          description: '14px',
          preview: 'text-sm'
        },
        { 
          value: 'base', 
          label: t('preferences.fontSize.normal'), 
          description: '16px',
          preview: 'text-base'
        },
        { 
          value: 'lg', 
          label: t('preferences.fontSize.large'), 
          description: '18px',
          preview: 'text-lg'
        },
        { 
          value: 'xl', 
          label: t('preferences.fontSize.extraLarge'), 
          description: '20px',
          preview: 'text-xl'
        }
      ]
    }
  ];

  // Additional preferences
  const additionalPreferences = [
    {
      key: 'notifications',
      title: t('preferences.notifications.title'),
      description: t('preferences.notifications.description'),
      icon: Shield,
      enabled: preferences.notifications
    },
    {
      key: 'analytics',
      title: t('preferences.analytics.title'),
      description: t('preferences.analytics.description'),
      icon: Target,
      enabled: preferences.analytics
    },
    {
      key: 'tips',
      title: t('preferences.tips.title'),
      description: t('preferences.tips.description'),
      icon: Sparkles,
      enabled: preferences.tips
    }
  ];

  // Handle next section
  const handleNext = useCallback(() => {
    if (currentSection < preferenceSections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      // Complete preferences setup
      handleComplete();
    }
  }, [currentSection, preferenceSections.length]);

  // Handle complete
  const handleComplete = useCallback(async () => {
    try {
      // Save preferences to user profile
      if (onComplete) {
        await onComplete(preferences);
      }

      addNotification({
        type: 'success',
        title: t('preferences.saved'),
        description: t('preferences.savedDescription'),
        duration: 3000
      });

      onNext?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('preferences.saveFailed'),
        description: error.message,
        duration: 5000
      });
    }
  }, [preferences, onComplete, addNotification, t, onNext]);

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
    hidden: { opacity: 0, x: isRTL ? -20 : 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  const currentSectionData = preferenceSections[currentSection];
  const SectionIcon = currentSectionData.icon;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          variants={itemVariants}
          className={cn(
            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center",
            currentSectionData.bgColor
          )}
        >
          <SectionIcon className={cn("w-8 h-8", currentSectionData.color)} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentSectionData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {currentSectionData.description}
          </p>
        </motion.div>

        {/* Progress indicator */}
        <motion.div variants={itemVariants} className="flex justify-center space-x-2">
          {preferenceSections.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index <= currentSection
                  ? "bg-primary-500"
                  : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          ))}
        </motion.div>
      </div>

      {/* Current section options */}
      <motion.div variants={itemVariants} className="space-y-3">
        {currentSectionData.options.map((option) => {
          const isSelected = preferences[currentSectionData.id] === option.value;
          const OptionIcon = option.icon;

          return (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "p-4 cursor-pointer transition-all border-2",
                  isSelected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                onClick={() => updatePreference(currentSectionData.id, option.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Option icon or flag */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isSelected 
                        ? "bg-primary-500 text-white" 
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {option.flag ? (
                        <span className="text-lg">{option.flag}</span>
                      ) : OptionIcon ? (
                        <OptionIcon className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">
                          {option.label.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Option details */}
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-medium",
                        option.preview && option.preview,
                        isSelected 
                          ? "text-primary-900 dark:text-primary-100" 
                          : "text-gray-900 dark:text-white"
                      )}>
                        {option.label}
                      </h3>
                      {option.description && (
                        <p className={cn(
                          "text-sm mt-1",
                          isSelected 
                            ? "text-primary-700 dark:text-primary-300" 
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected
                      ? "border-primary-500 bg-primary-500"
                      : "border-gray-300 dark:border-gray-600"
                  )}>
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Additional preferences (shown on last step) */}
      {currentSection === preferenceSections.length - 1 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
            {t('preferences.additional.title')}
          </h3>
          
          <div className="space-y-3">
            {additionalPreferences.map((pref) => {
              const PrefIcon = pref.icon;
              return (
                <Card
                  key={pref.key}
                  className="p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <PrefIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {pref.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pref.description}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant={pref.enabled ? "primary" : "outline"}
                      size="sm"
                      onClick={() => updatePreference(pref.key, !pref.enabled)}
                    >
                      {pref.enabled ? t('common.enabled') : t('common.disabled')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-center pt-6"
      >
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentSection === 0}
        >
          {t('navigation.previous')}
        </Button>

        <div className="flex items-center space-x-4">
          {currentSection < preferenceSections.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!preferences[currentSectionData.id]}
              className="min-w-[120px]"
            >
              {t('navigation.next')}
              <ChevronRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={!isComplete}
              className="min-w-[120px]"
            >
              <Zap className="w-4 h-4 mr-2" />
              {t('preferences.complete')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Skip option */}
      <motion.div variants={itemVariants} className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNext?.()}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t('preferences.skipForNow')}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PreferencesStep; 