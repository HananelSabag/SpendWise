/**
 * 👥 GUEST PREFERENCES - MOBILE-FIRST
 * Enhanced guest preference settings with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Globe, Palette, Eye, Volume2, VolumeX,
  Sun, Moon, Type, Contrast, Zap, Save, RotateCcw,
  X, Check, ChevronDown, Info
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useTheme,
  useCurrency,
  useAccessibility,
  useNotifications
} from '../../stores';

import { Button, Card, Select, Tooltip } from '../ui';
import { cn } from '../../utils/helpers';

const GuestPreferences = ({
  isOpen,
  onClose,
  onSave,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { 
    currentLanguage, 
    setLanguage, 
    t, 
    isRTL,
    availableLanguages 
  } = useTranslation();
  const {
    theme,
    setTheme,
    isDark,
    contrast,
    setContrast
  } = useTheme();
  const {
    currency,
    setCurrency,
    availableCurrencies
  } = useCurrency();
  const {
    fontSize,
    setFontSize,
    motionReduced,
    setMotionReduced,
    soundEnabled,
    setSoundEnabled
  } = useAccessibility();
  const { addNotification } = useNotifications();

  // Local state for guest preferences
  const [guestPrefs, setGuestPrefs] = useState({
    language: currentLanguage,
    theme: theme,
    currency: currency,
    fontSize: fontSize,
    contrast: contrast,
    motionReduced: motionReduced,
    soundEnabled: soundEnabled,
    rememberPrefs: false
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track changes
  useEffect(() => {
    const changed = 
      guestPrefs.language !== currentLanguage ||
      guestPrefs.theme !== theme ||
      guestPrefs.currency !== currency ||
      guestPrefs.fontSize !== fontSize ||
      guestPrefs.contrast !== contrast ||
      guestPrefs.motionReduced !== motionReduced ||
      guestPrefs.soundEnabled !== soundEnabled;
    
    setHasChanges(changed);
  }, [guestPrefs, currentLanguage, theme, currency, fontSize, contrast, motionReduced, soundEnabled]);

  // Update guest preferences
  const updateGuestPrefs = useCallback((updates) => {
    setGuestPrefs(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply preferences immediately for preview
  const applyPreview = useCallback((key, value) => {
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
      case 'contrast':
        setContrast(value);
        break;
      case 'motionReduced':
        setMotionReduced(value);
        break;
      case 'soundEnabled':
        setSoundEnabled(value);
        break;
      default:
        break;
    }
    
    updateGuestPrefs({ [key]: value });
  }, [setLanguage, setTheme, setCurrency, setFontSize, setContrast, setMotionReduced, setSoundEnabled, updateGuestPrefs]);

  // Save preferences
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save to localStorage for guests
      if (guestPrefs.rememberPrefs) {
        localStorage.setItem('guestPreferences', JSON.stringify(guestPrefs));
      }

      // Call parent save handler if provided
      if (onSave) {
        await onSave(guestPrefs);
      }

      addNotification({
        type: 'success',
        title: t('preferences.saved'),
        description: t('preferences.savedDescription'),
        duration: 3000
      });

      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('preferences.saveFailed'),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  }, [guestPrefs, onSave, addNotification, t, onClose]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaults = {
      language: 'en',
      theme: 'auto',
      currency: 'USD',
      fontSize: 'base',
      contrast: 'normal',
      motionReduced: false,
      soundEnabled: true,
      rememberPrefs: false
    };

    setGuestPrefs(defaults);
    
    // Apply defaults immediately
    Object.entries(defaults).forEach(([key, value]) => {
      if (key !== 'rememberPrefs') {
        applyPreview(key, value);
      }
    });

    addNotification({
      type: 'info',
      title: t('preferences.reset'),
      duration: 2000
    });
  }, [applyPreview, addNotification, t]);

  // Load saved guest preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('guestPreferences');
      if (saved) {
        const savedPrefs = JSON.parse(saved);
        setGuestPrefs(savedPrefs);
        
        // Apply saved preferences
        Object.entries(savedPrefs).forEach(([key, value]) => {
          if (key !== 'rememberPrefs') {
            applyPreview(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load guest preferences:', error);
    }
  }, [applyPreview]);

  // Option configurations
  const themeOptions = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'auto', label: t('theme.auto'), icon: Settings }
  ];

  const fontSizeOptions = [
    { value: 'sm', label: t('fontSize.small'), preview: '14px' },
    { value: 'base', label: t('fontSize.normal'), preview: '16px' },
    { value: 'lg', label: t('fontSize.large'), preview: '18px' },
    { value: 'xl', label: t('fontSize.extraLarge'), preview: '20px' }
  ];

  const contrastOptions = [
    { value: 'normal', label: t('contrast.normal') },
    { value: 'high', label: t('contrast.high') },
    { value: 'maximum', label: t('contrast.maximum') }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl",
            "w-full max-w-md max-h-[90vh] overflow-hidden",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('preferences.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('preferences.subtitle')}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
              aria-label={t('actions.close')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Language */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('preferences.language')}
                </label>
              </div>
              
              <Select
                value={guestPrefs.language}
                onChange={(value) => applyPreview('language', value)}
                className="w-full"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Theme */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('preferences.theme')}
                </label>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={guestPrefs.theme === option.value ? "primary" : "outline"}
                      size="sm"
                      onClick={() => applyPreview('theme', option.value)}
                      className="flex items-center justify-center h-12"
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 dark:text-gray-400">💰</span>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('preferences.currency')}
                </label>
              </div>
              
              <Select
                value={guestPrefs.currency}
                onChange={(value) => applyPreview('currency', value)}
                className="w-full"
              >
                {availableCurrencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('preferences.fontSize')}
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {fontSizeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={guestPrefs.fontSize === option.value ? "primary" : "outline"}
                    size="sm"
                    onClick={() => applyPreview('fontSize', option.value)}
                    className="flex flex-col items-center justify-center h-16 text-xs"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs opacity-70">{option.preview}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Contrast */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Contrast className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('preferences.contrast')}
                </label>
              </div>
              
              <div className="space-y-2">
                {contrastOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={guestPrefs.contrast === option.value ? "primary" : "outline"}
                    size="sm"
                    onClick={() => applyPreview('contrast', option.value)}
                    className="w-full justify-start"
                  >
                    {guestPrefs.contrast === option.value && <Check className="w-4 h-4 mr-2" />}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Accessibility Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                {t('preferences.accessibility')}
              </h3>
              
              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('preferences.reduceMotion')}
                  </span>
                </div>
                <Button
                  variant={guestPrefs.motionReduced ? "primary" : "outline"}
                  size="sm"
                  onClick={() => applyPreview('motionReduced', !guestPrefs.motionReduced)}
                >
                  {guestPrefs.motionReduced ? t('common.enabled') : t('common.disabled')}
                </Button>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {guestPrefs.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('preferences.soundEnabled')}
                  </span>
                </div>
                <Button
                  variant={guestPrefs.soundEnabled ? "primary" : "outline"}
                  size="sm"
                  onClick={() => applyPreview('soundEnabled', !guestPrefs.soundEnabled)}
                >
                  {guestPrefs.soundEnabled ? t('common.enabled') : t('common.disabled')}
                </Button>
              </div>
            </div>

            {/* Remember Preferences */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start space-x-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {t('preferences.rememberPrefs')}
                    </span>
                    <Button
                      variant={guestPrefs.rememberPrefs ? "primary" : "outline"}
                      size="sm"
                      onClick={() => updateGuestPrefs({ rememberPrefs: !guestPrefs.rememberPrefs })}
                    >
                      {guestPrefs.rememberPrefs ? t('common.enabled') : t('common.disabled')}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('preferences.rememberPrefsDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {hasChanges && (
              <div className="flex items-center justify-center text-xs text-orange-600 dark:text-orange-400 mb-3">
                <Info className="w-4 h-4 mr-1" />
                {t('preferences.unsavedChanges')}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('preferences.reset')}
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                loading={isSaving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('preferences.save')}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="w-full"
            >
              {t('actions.cancel')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuestPreferences; 