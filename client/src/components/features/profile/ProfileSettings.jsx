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
  Shield,
  Database,
  AlertCircle,
  Save,
  Info
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
  
  // Custom Preferences
  const [customPreferences, setCustomPreferences] = useState(() => {
    const prefs = user?.preferences || {};
    const { phone, location, website, profilePicture, ...custom } = prefs;
    return custom;
  });
  
  const [newPrefKey, setNewPrefKey] = useState('');
  const [newPrefValue, setNewPrefValue] = useState('');
  const [newPrefType, setNewPrefType] = useState('string');

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

  // Custom Preferences functions
  const saveCustomPreferences = async () => {
    setSavingSettings(true);
    
    try {
      await updateProfile({
        preferences: {
          ...user?.preferences,
          ...customPreferences
        }
      });
      
      toast.success(t('profile.customPreferencesSaved'));
    } catch (error) {
      toast.error(t('profile.saveError'));
    } finally {
      setSavingSettings(false);
    }
  };

  const addCustomPreference = () => {
    if (!newPrefKey.trim()) {
      toast.error(t('profile.errors.keyRequired'));
      return;
    }
    
    if (customPreferences.hasOwnProperty(newPrefKey)) {
      toast.error(t('profile.errors.keyExists'));
      return;
    }
    
    let value = newPrefValue;
    if (newPrefType === 'number') value = Number(value);
    if (newPrefType === 'boolean') value = value === 'true';
    if (newPrefType === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        toast.error(t('profile.errors.invalidJson'));
        return;
      }
    }
    
    setCustomPreferences(prev => ({
      ...prev,
      [newPrefKey]: value
    }));
    
    setNewPrefKey('');
    setNewPrefValue('');
    toast.success(t('profile.preferenceAdded'));
  };

  const removeCustomPreference = (key) => {
    setCustomPreferences(prev => {
      const newPrefs = { ...prev };
      delete newPrefs[key];
      return newPrefs;
    });
    toast.success(t('profile.preferenceRemoved'));
  };

  const updateCustomPreference = (key, value, type = 'string') => {
    let processedValue = value;
    if (type === 'number') processedValue = Number(value);
    if (type === 'boolean') processedValue = value === 'true';
    if (type === 'json') {
      try {
        processedValue = JSON.parse(value);
      } catch {
        toast.error(t('profile.errors.invalidJson'));
        return;
      }
    }
    
    setCustomPreferences(prev => ({
      ...prev,
      [key]: processedValue
    }));
  };

  // Section tabs - simplified to only include actually implemented features
  const sections = [
    { id: 'preferences', label: t('profile.preferences'), icon: Globe },
    { id: 'security', label: t('profile.security'), icon: Shield },
    { id: 'custom', label: t('profile.customPreferences'), icon: Database }
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

            {/* Feature Notice */}
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

      {/* Custom Preferences Section */}
      {activeSection === 'custom' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('profile.customPreferencesTitle')}
          </h3>
          
          {/* Add New Preference */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              {t('profile.addNewPreference')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label={t('profile.preferenceKey')}
                value={newPrefKey}
                onChange={(e) => setNewPrefKey(e.target.value)}
                placeholder="myCustomSetting"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.preferenceType')}
                </label>
                <select
                  value={newPrefType}
                  onChange={(e) => setNewPrefType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="string">{t('profile.typeString')}</option>
                  <option value="number">{t('profile.typeNumber')}</option>
                  <option value="boolean">{t('profile.typeBoolean')}</option>
                  <option value="json">{t('profile.typeJson')}</option>
                </select>
              </div>
              
              <Input
                label={t('profile.preferenceValue')}
                value={newPrefValue}
                onChange={(e) => setNewPrefValue(e.target.value)}
                placeholder={
                  newPrefType === 'boolean' ? 'true/false' :
                  newPrefType === 'number' ? '123' :
                  newPrefType === 'json' ? '{"key": "value"}' :
                  'My value'
                }
              />
              
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={addCustomPreference}
                  className="w-full"
                >
                  {t('profile.addPreference')}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Existing Custom Preferences */}
          <div className="space-y-4">
            {Object.entries(customPreferences).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('profile.noCustomPreferences')}
              </div>
            ) : (
              Object.entries(customPreferences).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{key}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {typeof value} = {JSON.stringify(value)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      size="small"
                      value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      onChange={(e) => updateCustomPreference(key, e.target.value, typeof value)}
                      className="w-48"
                    />
                    
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => removeCustomPreference(key)}
                    >
                      <AlertCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {Object.entries(customPreferences).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                onClick={saveCustomPreferences}
                loading={savingSettings}
              >
                <Save className="w-4 h-4 mr-2" />
                {t('profile.saveCustomPreferences')}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ProfileSettings;