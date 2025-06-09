// components/features/profile/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  DollarSign,
  Moon,
  Sun,
  Check,
  Shield,
  AlertCircle,
  Info,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useTheme } from '../../../context/ThemeContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { cn } from '../../../utils/helpers';
import { Card, Input, Button, Alert } from '../../ui';
import toast from 'react-hot-toast';

const ProfileSettings = ({ user }) => {
  const { updateProfile, isUpdatingProfile } = useAuth();
  
  // ✅ FIX: Use proper context functions
  const { t, language, setLanguage, savedLanguage, sessionLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme, isDark, savedTheme, sessionTheme } = useTheme();
  const isRTL = language === 'he';
  
  const [activeSection, setActiveSection] = useState('preferences');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // ✅ FIX: Enhanced theme change - permanent update
  const handleThemeChange = async (newTheme) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      console.log(`🎨 [PROFILE] Permanent theme change: ${savedTheme} → ${newTheme}`);
      
      // 1. Update context permanently (this also updates localStorage)
      setTheme(newTheme);
      
      // 2. Update in database
      await updateProfile({
        theme_preference: newTheme
      });
      
      console.log('✅ [PROFILE] Theme updated successfully in database');
      toast.success(t('profile.themeChanged'));
      
    } catch (error) {
      console.error('❌ [PROFILE] Failed to update theme preference:', error);
      
      // Revert to saved theme on error
      setTheme(savedTheme);
      toast.error('Failed to update theme preference');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Enhanced language change - permanent update
  const handleLanguageChange = async (newLanguage) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      console.log(`🌐 [PROFILE] Permanent language change: ${savedLanguage} → ${newLanguage}`);
      
      // 1. Update context permanently (this also updates localStorage)
      setLanguage(newLanguage);
      
      // 2. Update in database
      await updateProfile({
        language_preference: newLanguage
      });
      
      console.log('✅ [PROFILE] Language updated successfully in database');
      toast.success(t('profile.languageChanged'));
      
    } catch (error) {
      console.error('❌ [PROFILE] Failed to update language preference:', error);
      
      // Revert to saved language on error
      setLanguage(savedLanguage);
      toast.error('Failed to update language preference');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Enhanced currency change - permanent update
  const handleCurrencyChange = async (newCurrency) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      console.log(`💰 [PROFILE] Permanent currency change: ${currency} → ${newCurrency}`);
      
      // 1. Update currency context
      setCurrency(newCurrency);
      
      // 2. Update in database
      await updateProfile({
        currency_preference: newCurrency
      });
      
      console.log('✅ [PROFILE] Currency updated successfully in database');
      toast.success(t('profile.currencyChanged'));
      
    } catch (error) {
      console.error('❌ [PROFILE] Failed to update currency preference:', error);
      
      // Revert currency on error (assuming there's a saved currency)
      toast.error('Failed to update currency preference');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = t('validation.required');
    }
    if (!passwordData.newPassword) {
      errors.newPassword = t('validation.required');
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = t('validation.passwordTooShort');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('validation.passwordsDontMatch');
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    try {
      await updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      
      toast.success(t('profile.passwordChanged'));
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('incorrect')) {
        setPasswordErrors({ currentPassword: t('profile.incorrectPassword') });
      } else {
        toast.error(t('profile.passwordChangeError'));
      }
    }
  };

  // Section tabs
  const sections = [
    { id: 'preferences', label: t('profile.preferences'), icon: Globe },
    { id: 'security', label: t('profile.security'), icon: Shield }
  ];

  const isLoading = isUpdatingProfile || loading;

  // ✅ ADD: Show session override indicators
  const hasSessionOverrides = sessionLanguage || sessionTheme;

  return (
    <div className="space-y-6">
      {/* ✅ ADD: Session Override Warning */}
      {hasSessionOverrides && (
        <Alert variant="info" className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <Info className="w-4 h-4" />
          <div>
            <p className="font-medium">Session Overrides Active</p>
            <p className="text-sm mt-1">
              You have temporary {sessionTheme ? 'theme' : ''} {sessionTheme && sessionLanguage ? 'and' : ''} {sessionLanguage ? 'language' : ''} changes. 
              These will reset when you logout. Changes here will be permanent.
            </p>
            <div className="flex gap-2 mt-2 text-xs">
              {sessionTheme && (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Session Theme: {sessionTheme}
                </span>
              )}
              {sessionLanguage && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  Session Language: {sessionLanguage === 'he' ? 'עברית' : 'English'}
                </span>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              activeSection === section.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <section.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Preferences Section */}
      {activeSection === 'preferences' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('profile.appPreferences')}
          </h3>
          
          <div className="space-y-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('profile.language')}
                {sessionLanguage && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    (Currently overridden in session)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { code: 'en', label: 'English', flag: '🇺🇸' },
                  { code: 'he', label: 'עברית', flag: '🇮🇱' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      // ✅ FIX: Show saved language, not effective language
                      savedLanguage === lang.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      isLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                    {savedLanguage === lang.code && (
                      <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('profile.currency')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { code: 'ILS', symbol: '₪', label: 'Shekel' },
                  { code: 'USD', symbol: '$', label: 'Dollar' },
                  { code: 'EUR', symbol: '€', label: 'Euro' },
                  { code: 'GBP', symbol: '£', label: 'Pound' }
                ].map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    disabled={isLoading}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      currency === curr.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      isLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-xl font-bold">{curr.symbol}</span>
                    <span className="font-medium">{curr.label}</span>
                    {currency === curr.code && (
                      <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('profile.theme')}
                {sessionTheme && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    (Currently overridden in session)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                    // ✅ FIX: Show saved theme, not effective theme
                    savedTheme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{t('profile.lightTheme')}</span>
                  {savedTheme === 'light' && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
                
                <button
                  onClick={() => handleThemeChange('dark')}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                    savedTheme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">{t('profile.darkTheme')}</span>
                  {savedTheme === 'dark' && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('profile.securitySettings')}
          </h3>
          
          <div className="space-y-6">
            {/* Change Password */}
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">
                {t('profile.changePassword')}
              </h4>
              
              <div className="space-y-4">
                <Input
                  label={t('profile.currentPassword')}
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                    setPasswordErrors(prev => ({ ...prev, currentPassword: null }));
                  }}
                  error={passwordErrors.currentPassword}
                  icon={Lock}
                />
                
                <div className="relative">
                  <Input
                    label={t('profile.newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                      setPasswordErrors(prev => ({ ...prev, newPassword: null }));
                    }}
                    error={passwordErrors.newPassword}
                    icon={Lock}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={cn(
                      "absolute top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                      isRTL ? 'left-3' : 'right-3'
                    )}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <Input
                  label={t('profile.confirmPassword')}
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                    setPasswordErrors(prev => ({ ...prev, confirmPassword: null }));
                  }}
                  error={passwordErrors.confirmPassword}
                  icon={Lock}
                />
                
                <Button
                  variant="primary"
                  onClick={handlePasswordChange}
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {t('profile.updatePassword')}
                </Button>
              </div>
            </div>

            {/* Future Security Features Notice */}
            <Alert variant="info" className="mt-6">
              <div className="flex">
                <Info className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <h4 className="font-medium">{t('profile.additionalSecurity')}</h4>
                  <p className="text-sm">
                    {t('profile.additionalSecurityDesc')}
                  </p>
                </div>
              </div>
            </Alert>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProfileSettings;