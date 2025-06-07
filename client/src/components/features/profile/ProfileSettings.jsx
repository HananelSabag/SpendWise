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
  
  // ✅ ADD: Password confirmation for preferences
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingPreferenceChange, setPendingPreferenceChange] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [loading, setLoading] = useState(false);

  // ✅ NEW: Handle preference change with password confirmation
  const requestPreferenceChange = (type, value) => {
    setPendingPreferenceChange({ type, value });
    setShowPasswordModal(true);
    setConfirmPassword('');
    setPasswordError('');
  };

  // ✅ NEW: Confirm preference change with password
  const confirmPreferenceChange = async () => {
    if (!confirmPassword.trim()) {
      setPasswordError(t('validation.passwordRequired'));
      return;
    }

    if (!pendingPreferenceChange) return;

    try {
      setLoading(true);
      setPasswordError('');

      const { type, value } = pendingPreferenceChange;

      // Apply change locally first for immediate feedback
      if (type === 'theme') {
        setDarkMode(value === 'dark');
      } else if (type === 'language') {
        setLanguage(value);
      } else if (type === 'currency') {
        setCurrency(value);
      }

      // Send to server with password
      await updateProfile({
        email: user.email,
        username: user.username,
        password: confirmPassword, // User's actual password
        [`${type}_preference`]: value
      });

      // Success
      setShowPasswordModal(false);
      setPendingPreferenceChange(null);
      setConfirmPassword('');
      
      toast.success(t(`profile.${type}Changed`));
    } catch (error) {
      console.error(`Failed to update ${type} preference:`, error);
      
      // Revert local changes on error
      if (type === 'theme') {
        setDarkMode(darkMode);
      } else if (type === 'language') {
        setLanguage(language);
      } else if (type === 'currency') {
        setCurrency(currency);
      }

      // Show specific error
      if (error.response?.data?.error?.message?.includes('incorrect') || 
          error.response?.data?.error?.message?.includes('Password')) {
        setPasswordError(t('profile.incorrectPassword'));
      } else {
        toast.error(t(`profile.${type}ChangeError`));
        setShowPasswordModal(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Cancel preference change
  const cancelPreferenceChange = () => {
    setShowPasswordModal(false);
    setPendingPreferenceChange(null);
    setConfirmPassword('');
    setPasswordError('');
  };

  // Handle theme change - קוד פשוט בלי סיסמה
  const handleThemeChange = async (newTheme) => {
    try {
      setLoading(true);
      setDarkMode(newTheme === 'dark');
      
      // ✅ רק העדפת נושא, בלי סיסמה
      await updateProfile({
        theme_preference: newTheme
      });
      
      console.log('Theme updated successfully:', newTheme);
      toast.success(t('profile.themeChanged'));
    } catch (error) {
      console.error('Failed to update theme preference:', error);
      setDarkMode(darkMode);
      toast.error(t('profile.themeChangeError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle language change - קוד פשוט בלי סיסמה  
  const handleLanguageChange = async (newLanguage) => {
    try {
      setLoading(true);
      setLanguage(newLanguage);
      
      // ✅ רק העדפת שפה, בלי סיסמה
      await updateProfile({
        language_preference: newLanguage
      });
      
      console.log('Language updated successfully:', newLanguage);
      toast.success(t('profile.languageChanged'));
    } catch (error) {
      console.error('Failed to update language preference:', error);
      setLanguage(language);
      toast.error(t('profile.languageChangeError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle currency change - ✅ FIX: השתמש ב-updateProfile במקום updatePreferences
  const handleCurrencyChange = async (newCurrency) => {
    try {
      setLoading(true);
      
      // Update currency locally first
      setCurrency(newCurrency);
      
      // ✅ FIX: השתמש ב-updateProfile במקום updatePreferences
      await updateProfile({
        currency_preference: newCurrency
      });
      
      console.log('Currency updated successfully:', newCurrency);
      toast.success(t('profile.currencyChanged'));
    } catch (error) {
      console.error('Failed to update currency preference:', error);
      // Revert currency on error
      setCurrency(currency);
      toast.error(t('profile.currencyChangeError'));
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

  const isLoading = isUpdatingProfile || isUpdatingPreferences || loading;

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

      {/* ✅ ADD: Password Confirmation Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('profile.confirmPassword')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('profile.confirmPasswordDesc')}
            </p>
            
            <Input
              type="password"
              label={t('profile.currentPassword')}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              error={passwordError}
              icon={Lock}
              autoFocus
            />
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={cancelPreferenceChange}
                disabled={loading}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={confirmPreferenceChange}
                loading={loading}
                disabled={loading || !confirmPassword.trim()}
                className="flex-1"
              >
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;