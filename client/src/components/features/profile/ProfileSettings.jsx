// components/features/profile/ProfileSettings.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  DollarSign,
  Moon,
  Sun,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Smartphone,
  Mail,
  MessageSquare,
  Shield,
  Database,
  Trash2,
  Download,
  AlertCircle,
  Save
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { cn } from '../../../utils/helpers';
import { Card, Input, Button, Alert, Badge } from '../../ui';
import toast from 'react-hot-toast';

/**
 * ProfileSettings Component
 * User preferences and settings management
 */
const ProfileSettings = ({ user }) => {
  const { updateProfile } = useAuth();
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
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: user?.preferences?.notifications?.email ?? true,
    push: user?.preferences?.notifications?.push ?? true,
    sms: user?.preferences?.notifications?.sms ?? false,
    marketing: user?.preferences?.notifications?.marketing ?? false,
    updates: user?.preferences?.notifications?.updates ?? true,
    reminders: user?.preferences?.notifications?.reminders ?? true
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showProfile: user?.preferences?.privacy?.showProfile ?? true,
    showStats: user?.preferences?.privacy?.showStats ?? false,
    allowAnalytics: user?.preferences?.privacy?.allowAnalytics ?? true
  });

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
      errors.currentPassword = t('validation.required');
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = t('validation.required');
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = t('validation.passwordTooShort');
    } else if (!/\d/.test(passwordData.newPassword)) {
      errors.newPassword = t('validation.passwordNeedsNumber');
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('validation.passwordsDontMatch');
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
      
      toast.success(t('profile.passwordChanged'));
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('incorrect')) {
        setPasswordErrors({ currentPassword: t('profile.incorrectPassword') });
      } else {
        toast.error(t('profile.passwordChangeError'));
      }
    } finally {
      setSavingSettings(false);
    }
  };

  // Save notification preferences
  const saveNotifications = async () => {
    setSavingSettings(true);
    
    try {
      await updateProfile({
        preferences: {
          notifications
        }
      });
      
      toast.success(t('profile.notificationsSaved'));
    } catch (error) {
      toast.error(t('profile.saveError'));
    } finally {
      setSavingSettings(false);
    }
  };

  // Save privacy settings
  const savePrivacy = async () => {
    setSavingSettings(true);
    
    try {
      await updateProfile({
        preferences: {
          privacy
        }
      });
      
      toast.success(t('profile.privacySaved'));
    } catch (error) {
      toast.error(t('profile.saveError'));
    } finally {
      setSavingSettings(false);
    }
  };

  // Section tabs
  const sections = [
    { id: 'preferences', label: t('profile.preferences'), icon: Globe },
    { id: 'security', label: t('profile.security'), icon: Shield },
    { id: 'notifications', label: t('profile.notifications'), icon: Bell },
    { id: 'privacy', label: t('profile.privacy'), icon: Lock },
    { id: 'data', label: t('profile.dataManagement'), icon: Database }
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
                {t('profile.currency')}
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
                {t('profile.theme')}
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
                  <span className="font-medium">{t('profile.lightTheme')}</span>
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
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                {t('profile.changePassword')}
              </h4>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label={t('profile.currentPassword')}
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
                      'absolute top-9 text-gray-400 hover:text-gray-600',
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
                  loading={savingSettings}
                  className="w-full sm:w-auto"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {t('profile.updatePassword')}
                </Button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t('profile.twoFactor')}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('profile.twoFactorDesc')}
                  </p>
                </div>
                <Badge variant="warning">
                  {t('profile.comingSoon')}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('profile.notificationPreferences')}
          </h3>
          
          <div className="space-y-4">
            {[
              { key: 'email', icon: Mail, label: t('profile.emailNotifications'), desc: t('profile.emailNotificationsDesc') },
              { key: 'push', icon: Smartphone, label: t('profile.pushNotifications'), desc: t('profile.pushNotificationsDesc') },
              { key: 'sms', icon: MessageSquare, label: t('profile.smsNotifications'), desc: t('profile.smsNotificationsDesc') },
              { key: 'reminders', icon: Bell, label: t('profile.reminders'), desc: t('profile.remindersDesc') },
              { key: 'updates', icon: Bell, label: t('profile.productUpdates'), desc: t('profile.productUpdatesDesc') },
              { key: 'marketing', icon: Mail, label: t('profile.marketingEmails'), desc: t('profile.marketingEmailsDesc') }
            ].map(item => (
              <label
                key={item.key}
                className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              onClick={saveNotifications}
              loading={savingSettings}
            >
              <Save className="w-4 h-4 mr-2" />
              {t('profile.saveNotifications')}
            </Button>
          </div>
        </Card>
      )}

      {/* Privacy Section */}
      {activeSection === 'privacy' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('profile.privacySettings')}
          </h3>
          
          <div className="space-y-4">
            {[
              { key: 'showProfile', label: t('profile.publicProfile'), desc: t('profile.publicProfileDesc') },
              { key: 'showStats', label: t('profile.shareStats'), desc: t('profile.shareStatsDesc') },
              { key: 'allowAnalytics', label: t('profile.analytics'), desc: t('profile.analyticsDesc') }
            ].map(item => (
              <label
                key={item.key}
                className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={privacy[item.key]}
                  onChange={(e) => setPrivacy(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              onClick={savePrivacy}
              loading={savingSettings}
            >
              <Save className="w-4 h-4 mr-2" />
              {t('profile.savePrivacy')}
            </Button>
          </div>
        </Card>
      )}

      {/* Data Management Section */}
      {activeSection === 'data' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('profile.dataManagement')}
          </h3>
          
          <div className="space-y-6">
            {/* Export Data */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    {t('profile.exportData')}
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {t('profile.exportDataDesc')}
                  </p>
                  <Button
                    variant="outline"
                    size="small"
                    className="mt-3"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('profile.downloadData')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    {t('profile.deleteAccount')}
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {t('profile.deleteAccountDesc')}
                  </p>
                  <Button
                    variant="danger"
                    size="small"
                    className="mt-3"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('profile.deleteAccountButton')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProfileSettings;