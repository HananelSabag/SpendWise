/**
 * ♿ ACCESSIBILITY MENU - MOBILE-FIRST
 * Enhanced accessibility controls with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, X, Eye, Type, Contrast, Volume2, VolumeX,
  Palette, Sun, Moon, Zap, Shield, Check, RotateCcw, Save
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { 
  useTranslation, 
  useTheme, 
  useAccessibility, 
  useNotifications 
} from '../../stores';

import { Button } from '../ui';
import { cn } from '../../utils/helpers';

const AccessibilityMenu = ({ 
  isOpen, 
  onClose,
  className = '' 
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const { accessibility, updateAccessibility } = useAccessibility();
  const { fontSize, reducedMotion, screenReader, contrast, focusVisible, announcements } = accessibility;
  const { addNotification } = useNotifications();

  // Local state
  const [hasChanges, setHasChanges] = useState(false);
  // Track changes
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    if (isOpen && !originalSettings) {
      setOriginalSettings({
        fontSize,
        reducedMotion,
        screenReader,
        announcements,
        focusVisible,
        theme,
        contrast
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, originalSettings]);

  // Font size options
  const fontSizeOptions = [
    { value: 'small', label: t('accessibility.fontSize.small'), size: '0.875x' },
    { value: 'medium', label: t('accessibility.fontSize.normal'), size: '1x' },
    { value: 'large', label: t('accessibility.fontSize.large'), size: '1.125x' },
    { value: 'xl', label: t('accessibility.fontSize.extraLarge'), size: '1.25x' }
  ];

  // Theme options
  const themeOptions = [
    { value: 'light', label: t('accessibility.theme.light'), icon: Sun },
    { value: 'dark', label: t('accessibility.theme.dark'), icon: Moon },
    { value: 'auto', label: t('accessibility.theme.auto'), icon: Settings }
  ];

  // Contrast options
  const contrastOptions = [
    { value: 'normal', label: t('accessibility.contrast.normal') },
    { value: 'high', label: t('accessibility.contrast.high') }
  ];

  // Handle setting changes
  const handleSettingChange = useCallback((setting, value) => {
    setHasChanges(true);
    if (setting === 'theme') {
      setTheme(value);
    } else if (setting === 'contrast') {
      updateAccessibility({ contrast: value });
    } else {
      updateAccessibility({ [setting]: value });
    }
  }, [setTheme, updateAccessibility]);

  // Save settings
  const handleSave = useCallback(async () => {
    try {
      // Already session-persisted by store setters
      setHasChanges(false);
      setOriginalSettings(null);
      addNotification({ type: 'success', title: t('accessibility.settings.saved'), duration: 3000 });
      onClose();
    } catch (error) {
      addNotification({ type: 'error', title: t('accessibility.settings.saveFailed'), description: error.message, duration: 5000 });
    }
  }, [addNotification, t, onClose]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    updateAccessibility({
      fontSize: 'medium',
      reducedMotion: false,
      screenReader: false,
      announcements: true,
      focusVisible: true,
      contrast: 'normal'
    });
    setTheme('auto');
    setHasChanges(false);
    setOriginalSettings(null);
    addNotification({ type: 'info', title: t('accessibility.settings.reset'), duration: 3000 });
  }, [updateAccessibility, setTheme, addNotification, t]);

  // Cancel changes
  const handleCancel = useCallback(() => {
    if (originalSettings) {
      updateAccessibility({
        fontSize: originalSettings.fontSize,
        reducedMotion: originalSettings.reducedMotion,
        screenReader: originalSettings.screenReader,
        announcements: originalSettings.announcements,
        focusVisible: originalSettings.focusVisible,
        contrast: originalSettings.contrast
      });
      setTheme(originalSettings.theme);
    }
    
    setHasChanges(false);
    setOriginalSettings(null);
    onClose();
  }, [originalSettings, updateAccessibility, setTheme, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm"
          />

          {/* A layout wrapper owns centering so Framer Motion transforms cannot
              override the responsive positioning. It also sits above the mobile nav. */}
          <div className="pointer-events-none fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 24 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="accessibility-menu-title"
              className={cn(
                "pointer-events-auto flex w-full max-h-[calc(100dvh-0.5rem)] flex-col overflow-hidden",
                "rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800",
                "sm:max-w-[800px] sm:max-h-[85vh] sm:rounded-2xl",
                "lg:max-w-[900px]",
                className
              )}
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 id="accessibility-menu-title" className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                    {t('accessibility.title')}
                  </h2>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {t('accessibility.subtitle')}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="shrink-0 p-2"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:space-y-6 sm:p-6">
              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Type className="w-4 h-4 mr-2" />
                    {t('accessibility.fontSize.title')}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {fontSizeOptions.find(opt => opt.value === fontSize)?.size}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {fontSizeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={fontSize === option.value ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleSettingChange('fontSize', option.value)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  {t('accessibility.theme.title')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={theme === option.value ? "primary" : "outline"}
                        size="sm"
                        onClick={() => handleSettingChange('theme', option.value)}
                        className="flex items-center justify-center"
                      >
                        <Icon className="w-4 h-4 mr-1" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Contrast */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Contrast className="w-4 h-4 mr-2" />
                  {t('accessibility.contrast.title')}
                </label>
                <div className="space-y-2">
                  {contrastOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={contrast === option.value ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleSettingChange('contrast', option.value)}
                      className="w-full justify-start"
                    >
                      {contrast === option.value && <Check className="w-4 h-4 mr-2" />}
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                {/* Motion Reduced */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('accessibility.motionReduced.title')}
                    </span>
                  </div>
                  <Button
                    variant={reducedMotion ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('reducedMotion', !reducedMotion)}
                  >
                    {reducedMotion ? t('enabled') : t('disabled')}
                  </Button>
                </div>

                {/* Screen Reader Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Volume2 className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('accessibility.screenReader.title')}
                    </span>
                  </div>
                  <Button
                    variant={screenReader ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('screenReader', !screenReader)}
                  >
                    {screenReader ? t('enabled') : t('disabled')}
                  </Button>
                </div>

                {/* Announcements (instead of soundEnabled) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {announcements ? 
                      <Volume2 className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" /> :
                      <VolumeX className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    }
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('accessibility.sound.title')}
                    </span>
                  </div>
                  <Button
                    variant={announcements ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('announcements', !announcements)}
                  >
                    {announcements ? t('enabled') : t('disabled')}
                  </Button>
                </div>

                {/* Focus Visible */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('accessibility.focusVisible.title')}
                    </span>
                  </div>
                  <Button
                    variant={focusVisible ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleSettingChange('focusVisible', !focusVisible)}
                  >
                    {focusVisible ? t('enabled') : t('disabled')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 space-y-3 border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
              {hasChanges && (
                <div className="flex items-center justify-center text-xs text-orange-600 dark:text-orange-400 mb-3">
                  <Shield className="w-4 h-4 mr-1" />
                  {t('accessibility.settings.unsavedChanges')}
                </div>
              )}

              {/* Reset to Defaults Button - Prominent placement */}
              <Button
                variant="secondary"
                onClick={handleReset}
                className="w-full mb-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-md"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('accessibility.settings.reset')}
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('accessibility.settings.save')}
                </Button>
              </div>

            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccessibilityMenu;
