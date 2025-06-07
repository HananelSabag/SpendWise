// components/features/profile/ProfileSettings.jsx
import React, { useState } from 'react';
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
import { useAccessibility } from '../../../context/AccessibilityContext';
import { cn } from '../../../utils/helpers';
import { Card, Input, Button, Alert } from '../../ui';
import toast from 'react-hot-toast';

const ProfileSettings = ({ user }) => {
  const { updateProfile, updatePreferences, isUpdatingProfile, isUpdatingPreferences } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { darkMode, setDarkMode } = useAccessibility();
  const isRTL = language === 'he';
  
  const [activeSection, setActiveSection] = useState('preferences');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Handle theme change
  const handleThemeChange = async (theme) => {
    setDarkMode(theme === 'dark');
    
    // Update user preferences in database
    try {
      await updatePreferences({ theme_preference: theme });
      toast.success(t('profile.themeChanged'));
    } catch (error) {
      console.error('Failed to update theme preference:', error);
    }
  };

  // Handle language change
  const handleLanguageChange = async (lang) => {
    if (!['en', 'he'].includes(lang)) return;
    
    setLanguage(lang);
    
    // Update user preferences in database
    try {
      await updatePreferences({ language_preference: lang });
      toast.success(t('profile.languageChanged'));
    } catch (error) {
      console.error('Failed to update language preference:', error);
    }
  };

  // Handle currency change
  const handleCurrencyChange = async (curr) => {
    if (!['ILS', 'USD', 'EUR', 'GBP'].includes(curr)) return;
    
    setCurrency(curr);
    
    // Update user preferences in database
    try {
      await updatePreferences({ currency_preference: curr });
      toast.success(t('profile.currencyChanged'));
    } catch (error) {
      console.error('Failed to update currency preference:', error);
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

  const isLoading = isUpdatingProfile || isUpdatingPreferences;

  return (
    <div className="space-y-6">
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
                      language === lang.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      isLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                    {language === lang.code && (
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
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                    !darkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{t('profile.lightTheme')}</span>
                  {!darkMode && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
                
                <button
                  onClick={() => handleThemeChange('dark')}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-all',
                    darkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Moon className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">{t('profile.darkTheme')}</span>
                  {darkMode && (
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