/**
 * ⚙️ PREFERENCES STEP - CLEAN ORCHESTRATOR
 * COMPLETELY REFACTORED from 513-line monster to clean orchestrator
 * Features: Component-based architecture, Multi-step navigation, Live preview
 * @version 4.0.0 - COMPLETE REDESIGN SUCCESS! 🎉
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronLeft, ChevronRight, Check } from 'lucide-react';

// ✅ Import our NEW clean components
import LanguageSelector from './preferences/LanguageSelector';
import ThemeSelector from './preferences/ThemeSelector';
import CurrencySelector from './preferences/CurrencySelector';
import NotificationSettings from './preferences/NotificationSettings';

// ✅ Import stores
import {
  useTranslation,
  useTheme, 
  useCurrency,
  useAuth,
  useNotifications
} from '../../../../stores';

import { Button, Badge, Card } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * ⚙️ Preferences Step - Clean Orchestrator
 */
const PreferencesStep = ({
  data = {},
  onDataUpdate,
  onNext,
  onBack,
  onComplete,
  isFirstStep = false,
  isLastStep = false,
  isCompleting = false,
  className = ''
}) => {
  const { 
    currentLanguage,
    setLanguage,
    t, 
    isRTL
  } = useTranslation('onboarding');
  const {
    theme,
    setTheme
  } = useTheme();
  const {
    currency,
    setCurrency
  } = useCurrency();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // ✅ Local preferences state
  const [preferences, setPreferences] = useState({
    language: currentLanguage,
    theme: theme,
    currency: currency,
    notifications: {
      push: true,
      email: true,
      sms: false,
      budgetAlerts: true,
      transactionAlerts: true,
      weeklyReports: true,
      monthlyReports: true,
      recurringReminders: true,
      securityAlerts: true,
      marketingEmails: false
    },
    ...data
  });

  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());

  // ✅ Preference sections configuration
  const preferenceSections = [
    {
      id: 'language',
      title: t('preferences.language.title'),
      description: t('preferences.language.sectionDesc'),
      component: LanguageSelector,
      required: true,
      props: {
        selectedLanguage: preferences.language,
        onLanguageChange: (lang) => updatePreference('language', lang),
        layout: 'grid'
      }
    },
    {
      id: 'theme',
      title: t('preferences.theme.title'),
      description: t('preferences.theme.sectionDesc'),
      component: ThemeSelector,
      required: true,
      props: {
        selectedTheme: preferences.theme,
        onThemeChange: (theme) => updatePreference('theme', theme),
        layout: 'grid'
      }
    },
    {
      id: 'currency',
      title: t('preferences.currency.title'),
      description: t('preferences.currency.sectionDesc'),
      component: CurrencySelector,
      required: true,
      props: {
        selectedCurrency: preferences.currency,
        onCurrencyChange: (currency) => updatePreference('currency', currency),
        layout: 'grid'
      }
    },
    {
      id: 'notifications',
      title: t('preferences.notifications.title'),
      description: t('preferences.notifications.sectionDesc'),
      component: NotificationSettings,
      required: false,
      props: {
        settings: preferences.notifications,
        onSettingsChange: (settings) => updatePreference('notifications', settings),
        layout: 'list'
      }
    }
  ];

  // ✅ Update preference
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      
      // Update parent data
      onDataUpdate?.(newPreferences, false);
      
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
        default:
          break;
      }
      
      return newPreferences;
    });

    // Mark section as completed
    const currentSectionId = preferenceSections[currentSection]?.id;
    if (currentSectionId === key) {
      setCompletedSections(prev => new Set([...prev, currentSectionId]));
    }
  }, [currentSection, preferenceSections, onDataUpdate, setLanguage, setTheme, setCurrency]);

  // ✅ Check if current section is complete
  const isCurrentSectionComplete = useCallback(() => {
    const section = preferenceSections[currentSection];
    if (!section) return false;
    
    const value = preferences[section.id];
    return Boolean(value);
  }, [currentSection, preferenceSections, preferences]);

  // ✅ Check if all required sections are complete
  const areRequiredSectionsComplete = useCallback(() => {
    return preferenceSections
      .filter(section => section.required)
      .every(section => Boolean(preferences[section.id]));
  }, [preferenceSections, preferences]);

  // ✅ Handle section navigation
  const goToSection = useCallback((sectionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < preferenceSections.length) {
      setCurrentSection(sectionIndex);
    }
  }, [preferenceSections.length]);

  const goNextSection = useCallback(() => {
    if (currentSection < preferenceSections.length - 1) {
      // Mark current section as completed if valid
      if (isCurrentSectionComplete()) {
        const currentSectionId = preferenceSections[currentSection].id;
        setCompletedSections(prev => new Set([...prev, currentSectionId]));
      }
      
      setCurrentSection(prev => prev + 1);
    } else {
      // Final section - complete preferences
      handleComplete();
    }
  }, [currentSection, preferenceSections.length, isCurrentSectionComplete, preferenceSections]);

  const goPrevSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  }, [currentSection]);

  // ✅ Handle completion
  const handleComplete = useCallback(async () => {
    try {
      if (onComplete) {
        await onComplete(preferences);
      }

      addNotification({
        type: 'success',
        message: t('preferences.saved'),
        duration: 3000
      });

      onNext?.();
    } catch (error) {
      console.error('Preferences completion failed:', error);
      addNotification({
        type: 'error',
        message: t('preferences.saveFailed'),
        duration: 5000
      });
    }
  }, [preferences, onComplete, addNotification, t, onNext]);

  // ✅ Animation variants
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
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, x: isRTL ? -30 : 30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      x: isRTL ? 30 : -30,
      transition: { duration: 0.2 }
    }
  };

  const currentSectionData = preferenceSections[currentSection];
  const SectionComponent = currentSectionData?.component;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6 h-full flex flex-col", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 flex-shrink-0">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <Settings className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('preferences.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('preferences.subtitle')}
          </p>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center space-x-2">
          {preferenceSections.map((section, index) => (
            <div
              key={section.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all cursor-pointer",
                index === currentSection 
                  ? "bg-blue-500 scale-125" 
                  : completedSections.has(section.id)
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
              )}
              onClick={() => goToSection(index)}
            />
          ))}
        </div>
      </motion.div>

      {/* Section Header */}
      {currentSectionData && (
        <motion.div variants={itemVariants} className="text-center flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentSectionData.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentSectionData.description}
          </p>
          
          {/* Section progress */}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('preferences.stepProgress', { 
              current: currentSection + 1, 
              total: preferenceSections.length 
            })}
          </div>
        </motion.div>
      )}

      {/* Section Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {SectionComponent && (
            <motion.div
              key={currentSection}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-full overflow-y-auto"
            >
              <SectionComponent {...currentSectionData.props} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <motion.div variants={itemVariants} className="flex-shrink-0">
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={currentSection === 0 ? onBack : goPrevSection}
            disabled={isCompleting}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {currentSection === 0 ? t('common.back') : t('preferences.previousSection')}
            </span>
          </Button>

          {/* Section Status */}
          <div className="flex items-center space-x-2">
            {completedSections.size > 0 && (
              <Badge variant="success" size="sm">
                {t('preferences.completed', { count: completedSections.size })}
              </Badge>
            )}
            
            {currentSectionData?.required && !isCurrentSectionComplete() && (
              <Badge variant="warning" size="sm">
                {t('preferences.required')}
              </Badge>
            )}
          </div>

          {/* Next Button */}
          <Button
            variant="primary"
            onClick={goNextSection}
            disabled={
              isCompleting || 
              (currentSectionData?.required && !isCurrentSectionComplete())
            }
            loading={isCompleting}
            className="flex items-center space-x-2"
          >
            <span>
              {currentSection === preferenceSections.length - 1 
                ? (isCompleting ? t('preferences.saving') : t('preferences.complete'))
                : t('preferences.nextSection')
              }
            </span>
            {currentSection === preferenceSections.length - 1 ? (
              <Check className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Complete */}
        {areRequiredSectionsComplete() && currentSection < preferenceSections.length - 1 && (
          <div className="text-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComplete}
              className="text-blue-600 hover:text-blue-700"
            >
              {t('preferences.quickComplete')}
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PreferencesStep; 