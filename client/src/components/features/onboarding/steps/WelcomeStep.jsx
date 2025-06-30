/**
 * WelcomeStep Component - Enhanced First step of onboarding with preferences & avatar
 * 
 * ✅ ENHANCED FEATURES:
 * - Beautiful welcome message with profile picture upload
 * - Clean preferences setup (language, currency, theme) - NO SYSTEM THEME
 * - Simplified feature overview
 * - Avatar upload integration from Profile page
 * - Beautiful responsive design with no scrolling
 * - Better visual hierarchy and spacing
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, RefreshCw, BarChart3, Shield, 
  Zap, Target, ArrowRight, Heart,
  Globe, DollarSign, Palette, Sun, Moon, Camera, Upload, User,
  CheckCircle, Crown, Star
} from 'lucide-react';

import { useLanguage } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useTheme } from '../../../../context/ThemeContext';
import { useToast } from '../../../../hooks/useToast';
import { cn } from '../../../../utils/helpers';
import { Button } from '../../../ui';

/**
 * WelcomeStep - Enhanced Introduction to SpendWise with Profile Setup
 */
const WelcomeStep = ({ onNext, stepData, updateStepData }) => {
  const { t, language, changeLanguagePermanent } = useLanguage();
  const { user, updateProfile, uploadProfilePicture } = useAuth();
  const { currency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const toastService = useToast();
  const isRTL = language === 'he';
  const fileInputRef = useRef(null);

  const [preferences, setPreferences] = useState({
    language: language || 'en',
    currency: currency || 'USD',
    theme: theme === 'system' ? 'light' : theme || 'light', // ✅ FIXED: No system theme
    ...stepData.preferences
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', nameLocal: 'English' },
    { code: 'he', name: 'עברית', flag: '🇮🇱', nameLocal: 'עברית' }
  ];

  // Currency options
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', nameLocal: 'Dollar' },
    { code: 'EUR', name: 'Euro', symbol: '€', nameLocal: 'Euro' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', nameLocal: isRTL ? 'שקל' : 'Shekel' }
  ];

  // ✅ FIXED: Only light and dark themes - NO SYSTEM
  const themes = [
    { code: 'light', name: isRTL ? 'בהיר' : 'Light', icon: Sun },
    { code: 'dark', name: isRTL ? 'כהה' : 'Dark', icon: Moon }
  ];

  // ✅ SIMPLIFIED: Core features only (no overwhelming details about recurring)
  const features = [
    {
      icon: Zap,
      title: t('onboarding.welcome.features.analytics.title'),
      description: t('onboarding.welcome.features.analytics.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: BarChart3,
      title: t('onboarding.welcome.features.recurring.title'),
      description: t('onboarding.welcome.features.recurring.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      icon: Shield,
      title: t('onboarding.welcome.features.security.title'),
      description: t('onboarding.welcome.features.security.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  // ✅ ENHANCED: Profile picture upload from Profile.jsx
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastService.error('Please select a valid image file.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toastService.error('File too large. Please use an image under 10MB.');
      return;
    }

    setIsUploadingPicture(true);
    try {
      await uploadProfilePicture(file);
      setAvatarKey(Date.now());
      toastService.success('Profile picture updated! 🎉');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toastService.error('Upload failed. Please try again.');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handle preference changes
  const handleChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updateStepData({ preferences: newPreferences });
  };

  // Handle continue with preferences save
  const handleContinue = async () => {
    setIsLoading(true);
    try {
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

      // Save to database if there are changes
      if (hasChanges) {
        console.log('💾 [ONBOARDING] Saving profile changes:', profileUpdates);
        await updateProfile(profileUpdates);
        console.log('🎉 [ONBOARDING] Preferences saved successfully');
      } else {
        console.log('✅ [ONBOARDING] No changes to save, proceeding to next step');
      }
      
      console.log('🚀 [ONBOARDING] Calling onNext() to proceed to next step');
      onNext();
    } catch (error) {
      console.error('❌ [ONBOARDING] Failed to save preferences:', error);
      
      // Still allow user to continue but show warning
      if (window.confirm(isRTL
        ? `שגיאה בשמירת ההעדפות: ${error?.message || t('common.unknownError')}\n\nהאם להמשיך בכל זאת?`
        : `Failed to save preferences: ${error?.message || t('common.unknownError')}\n\nDo you want to continue anyway?`)) {
        onNext();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col justify-between py-2 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10">
      {/* ✅ COMPACT: Header with user greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3"
      >
                  <div className="flex items-center justify-center gap-2 mb-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('onboarding.welcome.greeting', { name: user?.username ? user.username.split(' ')[0] : '' })}
          </h1>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="w-5 h-5 text-red-500" />
          </motion.div>
        </div>
        <p className={cn(
          "text-gray-600 dark:text-gray-300 max-w-xl mx-auto text-xs",
          isRTL && "text-right"
        )}>
          {t('onboarding.welcome.description')}
        </p>
      </motion.div>

      {/* ✅ ENHANCED: Two-column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-start">
        
        {/* Left Column: Profile & Preferences */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3"
        >
          {/* Profile Section */}
          <div className="card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('onboarding.welcome.profileTitle')}
              </h3>
            </div>
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div 
                  className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                >
                  {user?.profile_picture ? (
                    <img
                      key={avatarKey}
                      src={`${user.profile_picture}?t=${avatarKey}`}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                  {!user?.profile_picture && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPicture}
                  className="absolute -bottom-0.5 -right-0.5 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                  title={t('onboarding.welcome.profile.addPhoto')}
                >
                  {isUploadingPicture ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                {t('onboarding.welcome.profile.uploadPrompt')}
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>

          {/* Preferences Section - COMPACT */}
          <div className="card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Preferences
              </h3>
            </div>
            
            <div className="space-y-2">
              {/* Language Selection - COMPACT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('onboarding.preferences.language')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleChange('language', lang.code)}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-sm',
                        preferences.language === lang.code
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'border-gray-200 hover:border-blue-300 dark:border-gray-600'
                      )}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span className="font-medium text-xs">{lang.nameLocal}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selection - COMPACT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('onboarding.preferences.currency')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleChange('currency', curr.code)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition-all',
                        preferences.currency === curr.code
                          ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'border-gray-200 hover:border-green-300 dark:border-gray-600'
                      )}
                    >
                      <span className="text-base font-bold">{curr.symbol}</span>
                      <span className="text-xs font-medium">{curr.nameLocal}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection - COMPACT */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('onboarding.preferences.theme')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {themes.map((thm) => {
                    const Icon = thm.icon;
                    return (
                      <button
                        key={thm.code}
                        onClick={() => handleChange('theme', thm.code)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-sm',
                          preferences.theme === thm.code
                            ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'border-gray-200 hover:border-purple-300 dark:border-gray-600'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="font-medium text-xs">{thm.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: SpendWise Features - COMPACT */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          {/* SpendWise Overview */}
          <div className="card p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                SpendWise
                <Sparkles className="w-3 h-3 text-yellow-500" />
              </h3>
            </div>
            
            <div className="space-y-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-lg",
                      feature.bgColor,
                      isRTL && "flex-row-reverse text-right"
                    )}
                  >
                    <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      <Icon className={cn("w-3 h-3", feature.color)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Next Step Preview - COMPACT */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.3 }}
              className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800"
            >
              <div className={cn(
                "flex items-center gap-1.5 mb-1",
                isRTL && "flex-row-reverse"
              )}>
                <Star className="w-3 h-3 text-yellow-600" />
                <h4 className="font-bold text-yellow-700 dark:text-yellow-300 text-xs">
                  {t('onboarding.welcome.nextPrompt.title')}
                </h4>
              </div>
              <p className={cn(
                "text-xs text-yellow-600 dark:text-yellow-300",
                isRTL && "text-right"
              )}>
                {t('onboarding.welcome.nextPrompt.description')}
              </p>
            </motion.div>
          </div>

          {/* Extra card to balance height */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.3 }}
            className="card p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('templates.quickSetup')}
              </h3>
            </div>
            <p className={cn(
              "text-xs text-gray-600 dark:text-gray-300 mb-3",
              isRTL && "text-right"
            )}>
              {t('onboarding.welcome.quickSetup.description')}
            </p>
                         <div className="flex items-center gap-2">
               {[Shield, Target, Heart].map((Icon, i) => (
                 <motion.div
                   key={i}
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                   className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
                 >
                   <Icon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                 </motion.div>
               ))}
             </div>
           </motion.div>
        </motion.div>
      </div>

      {/* ✅ IMPROVED: Fixed bottom buttons with proper alignment and equal spacing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex items-center justify-center mt-2"
      >
        <Button
          onClick={handleContinue}
          disabled={isLoading}
          size="lg"
          className={cn(
            "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-12 py-2 flex items-center gap-2 whitespace-nowrap",
            "transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl",
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
              <span>{t('onboarding.welcome.cta.button')}</span>
              <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default WelcomeStep; 