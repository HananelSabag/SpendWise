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
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { cn } from '../../../utils/helpers';
import { Card, Input, Button, Alert } from '../../ui';
import toast from 'react-hot-toast';

/**
 * ProfileSettings Component
 * User preferences and settings management
 */
const ProfileSettings = ({ user }) => {
  const { updateProfile, isUpdatingProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { darkMode, setDarkMode } = useAccessibility();
  const isRTL = language === 'he';
  
  const [activeSection, setActiveSection] = useState('preferences');
  const [savingSettings, setSavingSettings] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Handle language change
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
    toast.success(t('profile.languageChanged'));
  };

  // Handle currency change
  const handleCurrencyChange = (curr) => {
    setCurrency(curr);
    localStorage.setItem('preferredCurrency', curr);
    toast.success(t('profile.currencyChanged'));
  };

  // Handle theme change
  const handleThemeChange = (isDark) => {
    setDarkMode(isDark);
    toast.success(t('profile.themeChanged'));
  };

  // Validate password
  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = typeof t('validation.required') === 'string' ? t('validation.required') : 'Required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = typeof t('validation.required') === 'string' ? t('validation.required') : 'Required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = typeof t('validation.passwordTooShort') === 'string' ? t('validation.passwordTooShort') : 'Password too short';
    } else if (!/\d/.test(passwordData.newPassword)) {
      errors.newPassword = typeof t('validation.passwordNeedsNumber') === 'string' ? t('validation.passwordNeedsNumber') : 'Password needs number';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = typeof t('validation.passwordsDontMatch') === 'string' ? t('validation.passwordsDontMatch') : "Passwords don't match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!validatePassword()) return;
    
    setSavingSettings(true);
    
    try {
      await updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      const successMsg = typeof t('profile.passwordChanged') === 'string' ? t('profile.passwordChanged') : 'Password changed successfully';
      toast.success(successMsg);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('incorrect')) {
        const errorMsg = typeof t('profile.incorrectPassword') === 'string' ? t('profile.incorrectPassword') : 'Incorrect password';
        setPasswordErrors({ currentPassword: errorMsg });
      } else {
        const errorMsg = typeof t('profile.passwordChangeError') === 'string' ? t('profile.passwordChangeError') : 'Password change failed';
        toast.error(errorMsg);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  // Helper function to safely get translation
  const safeT = (key, fallback) => {
    try {
      const translation = t(key);
      // If translation is an object, return the fallback
      if (typeof translation === 'object' && translation !== null) {
        console.warn(`Translation key "${key}" returned an object, using fallback:`, translation);
        return fallback;
      }
      return typeof translation === 'string' ? translation : fallback;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback;
    }
  };

  // Section tabs - Simplified to only implemented features
  const sections = [
    { id: 'preferences', label: safeT('profile.preferences', 'Preferences'), icon: Globe },
    { id: 'security', label: safeT('profile.security', 'Security'), icon: Shield }
  ];

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
            {safeT('profile.appPreferences', 'App Preferences')}
          </h3>
          
          <div className="space-y-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {safeT('profile.language', 'Language')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { code: 'en', label: 'English', flag: '🇺🇸' },
                  { code: 'he', label: 'עברית', flag: '🇮🇱' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      language === lang.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                {safeT('profile.currency', 'Currency')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: 'ILS', symbol: '₪', label: 'Shekel' },
                  { code: 'USD', symbol: '$', label: 'Dollar' },
                  { code: 'EUR', symbol: '€', label: 'Euro' }
                ].map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencyChange(curr.code)}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                      currency === curr.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">{curr.code}</span>
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
                {safeT('profile.theme', 'Theme')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleThemeChange(false)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                    !darkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{safeT('profile.lightTheme', 'Light')}</span>
                  {!darkMode && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
                
                <button
                  onClick={() => handleThemeChange(true)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                    darkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <Moon className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{safeT('profile.darkTheme', 'Dark')}</span>
                  {darkMode && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Future Features Notice */}
          <Alert variant="info" className="mt-6">
            <Info className="w-5 h-5 mr-3 text-blue-500" />
            <div>
              <h4 className="font-medium">{safeT('profile.comingSoon', 'Coming Soon')}</h4>
              <p className="text-sm">
                Future features: Notification preferences, data export, custom categories, and more advanced settings.
              </p>
            </div>
          </Alert>
        </Card>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {safeT('profile.securitySettings', 'Security Settings')}
          </h3>
          
          <div className="space-y-6">
            {/* Change Password */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                {safeT('profile.changePassword', 'Change Password')}
              </h4>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label={safeT('profile.currentPassword', 'Current Password')}
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                      setPasswordErrors(prev => ({ ...prev, currentPassword: null }));
                    }}
                    error={passwordErrors.currentPassword}
                    icon={Lock}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      'absolute top-9 text-gray-400 hover:text-gray-600',
                      isRTL ? 'left-3' : 'right-3'
                    )}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label={safeT('profile.newPassword', 'New Password')}
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
                      'absolute top-9 text-gray-400 hover:text-gray-600',
                      isRTL ? 'left-3' : 'right-3'
                    )}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <Input
                  label={safeT('profile.confirmPassword', 'Confirm Password')}
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
                  loading={savingSettings || isUpdatingProfile}
                  className="w-full sm:w-auto"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {safeT('profile.updatePassword', 'Update Password')}
                </Button>
              </div>
            </div>

            {/* Future Security Features Notice */}
            <Alert variant="info" className="mt-6">
              <div className="flex">
                <Info className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <h4 className="font-medium">{safeT('profile.additionalSecurity', 'Additional Security')}</h4>
                  <p className="text-sm">
                    {safeT('profile.additionalSecurityDesc', 'Two-factor authentication, login sessions management, security logs, and account recovery options coming soon.')}
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