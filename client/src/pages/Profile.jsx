/**
 * 👤 PROFILE PAGE - SIMPLIFIED & FUNCTIONAL VERSION
 * Only essential features: Personal Info, Security, Export Data
 * @version 3.0.0 - MAJOR SIMPLIFICATION
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Download, Camera, Edit2, Save, X,
  Eye, EyeOff, Key, Mail, Calendar, MapPin, Settings,
  RefreshCw, Upload, ZoomIn, ImageIcon,
  FileSpreadsheet, Braces, FileText, ShieldCheck
} from 'lucide-react';

import { 
  useAuth, 
  useAuthStore,
  useTranslation,
  useTranslationStore, 
  useNotifications,
  useAppStore
} from '../stores';
import { useAuthToasts } from '../hooks/useAuthToasts';
import { useToast } from '../hooks/useToast';

import { Button, Card, Input, Avatar, LoadingSpinner, Badge } from '../components/ui';
import AuthStatusDetector from '../components/features/auth/AuthStatusDetector';
import PersonalInfo from '../components/features/profile/PersonalInfo';
import useExport from '../hooks/useExport';
import { api } from '../api';
import { cn, dateHelpers } from '../utils/helpers';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();
  const authToasts = useAuthToasts(); // ✅ Enhanced auth toast system
  const toast = useToast(); // ✅ General toast for non-auth operations

  // State
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Export hook for one-click downloads
  const { exportAsCSV, exportAsJSON, exportAsPDF, isExporting, triggerDownload } = useExport();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPictureModal, setShowPictureModal] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);



  const [preferencesData, setPreferencesData] = useState({
    language_preference: user?.language_preference || 'en',
    theme_preference: user?.theme_preference || 'system',
    currency_preference: user?.currency_preference || 'ILS'
  });

  // ✅ Sync preferences data when user data changes (on login/refresh)
  React.useEffect(() => {
    if (user) {
      setPreferencesData({
        language_preference: user.language_preference || 'en',
        theme_preference: user.theme_preference || 'system',
        currency_preference: user.currency_preference || 'ILS'
      });
    }
  }, [user?.language_preference, user?.theme_preference, user?.currency_preference]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ✅ Track auth status using new API
  const [authStatus, setAuthStatus] = useState(null);

  // ✅ Load auth status on mount and when user changes
  React.useEffect(() => {
    const loadAuthStatus = async () => {
      if (user) {
        try {
          const result = await api.authStatus.getAuthStatus();
          if (result.success) {
            setAuthStatus(result.data);
          }
        } catch (error) {
          console.error('Failed to load auth status:', error);
        }
      }
    };

    loadAuthStatus();
  }, [user]);

  // ENHANCED tabs - include preferences
  const tabs = [
    { id: 'personal', label: t('tabs.personal', { fallback: 'Personal Info' }), icon: User },
    { id: 'preferences', label: t('tabs.preferences', { fallback: 'Preferences' }), icon: Settings },
    { id: 'security', label: t('tabs.security', { fallback: 'Security' }), icon: Shield },
    { id: 'export', label: t('tabs.export', { fallback: 'Export Data' }), icon: Download }
  ];

  // Handle profile picture upload
  const handleAvatarUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      authToasts.avatarTooLarge();
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.users.uploadAvatar(formData);
      
      if (response.success) {
        // Get the new avatar URL from the response
        const newAvatarUrl = response.data?.data?.url || response.data?.url || response.avatar_url;
        
        // Update only the avatar in the auth store WITHOUT syncing preferences
        const currentUser = useAuthStore.getState().user;
        const updatedUser = {
          ...currentUser,
          avatar: newAvatarUrl,
          avatar_url: newAvatarUrl
        };
        
        // Force update the store with new user object
        useAuthStore.setState({
          user: updatedUser
        });
        
        // Force refresh all avatar images in the DOM immediately
        const avatarElements = document.querySelectorAll('img[src*="supabase"], img[alt="Profile"], .avatar img, [class*="avatar"] img');
        avatarElements.forEach(img => {
          if (img.src && (img.src.includes('supabase') || img.alt === 'Profile' || img.alt?.includes('profile'))) {
            // Use the new URL directly instead of adding timestamp
            img.src = newAvatarUrl + '?t=' + Date.now();
          }
        });
        
        authToasts.avatarUploaded();
        setShowPictureModal(false); // Close modal after successful upload
      } else {
        authToasts.avatarUploadFailed();
      }
    } catch (error) {
      console.error('🔍 Profile Upload Error:', error);
      authToasts.avatarUploadFailed();
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [authToasts]);

  // Handle picture view/change modal
  const handlePictureClick = useCallback(() => {
    setShowPictureModal(true);
  }, []);

  const handleClosePictureModal = useCallback(() => {
    setShowPictureModal(false);
  }, []);



  // ✅ ENHANCED: Update preferences with immediate application
  const handlePreferencesUpdate = useCallback(async () => {
    setIsLoading(true);
    try {
      // First update the database
      const result = await updateProfile({
        language_preference: preferencesData.language_preference,
        theme_preference: preferencesData.theme_preference,
        currency_preference: preferencesData.currency_preference
      });

      if (result.success) {
        // ✅ 1. Apply theme immediately
        const applyTheme = (theme) => {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
          } else if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', prefersDark);
          }
        };
        
        if (preferencesData.theme_preference !== user?.theme_preference) {
          applyTheme(preferencesData.theme_preference);
        }

        // ✅ 2. Apply language immediately  
        if (preferencesData.language_preference !== user?.language_preference) {
          const translationStore = useTranslationStore.getState();
          translationStore.actions.setLanguage(preferencesData.language_preference);
        }

        // ✅ 3. Apply currency immediately
        if (preferencesData.currency_preference !== user?.currency_preference) {
          const appStore = useAppStore.getState();
          appStore.actions.setCurrency(preferencesData.currency_preference);
        }

        // Refresh user data to sync with database
        await useAuthStore.getState().actions.getProfile();

        // Show success notification
        authToasts.preferencesUpdated();
        
      } else {
        throw new Error(result.error?.message || 'Update failed');
      }
    } catch (error) {
      authToasts.profileUpdateFailed();
    } finally {
      setIsLoading(false);
    }
  }, [preferencesData, updateProfile, authToasts, t, user]);

  // Handle password change/set
  const handlePasswordChange = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      authToasts.passwordMismatch();
      return;
    }

    if (passwordData.newPassword.length < 8) {
      authToasts.passwordTooShort();
      return;
    }

    // ✅ Enforce same policy as server (at least one letter and one number)
    if (!/[A-Za-z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword)) {
      authToasts.error?.(t('security.password.policy', { fallback: 'Password must include at least one letter and one number' }));
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Use NEW auth status API to determine user type (reliable)
      const authStatusResult = await api.authStatus.getAuthStatus();
      const isGoogleOnlyUser = authStatusResult.success && authStatusResult.data.authType === 'GOOGLE_ONLY';

      let result;
      if (isGoogleOnlyUser) {
        // OAuth user setting first password - use setPassword endpoint
        console.log('🔐 Calling setPassword API for Google-only user');
        result = await api.auth.setPassword({
          newPassword: passwordData.newPassword
        });
      } else {
        // Regular user changing password - use changePassword endpoint
        console.log('🔐 Calling changePassword API for regular user');
        result = await api.auth.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
      }

      // ✅ CRITICAL: Check if the API call actually succeeded
      if (!result.success) {
        console.error('❌ Password API call failed:', result.error);
        throw new Error(result.error?.message || 'Password operation failed');
      }
      
      console.log('✅ Password API call successful:', result.message);
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // ✅ Refresh user profile to update authentication state
      await useAuthStore.getState().actions.getProfile();
      
      // ✅ Refresh auth status for UI updates
      const updatedAuthStatus = await api.authStatus.getAuthStatus();
      if (updatedAuthStatus.success) {
        setAuthStatus(updatedAuthStatus.data);
      }
      
      authToasts.passwordChanged();
    } catch (error) {
      authToasts.passwordChangeFailed(error);
    } finally {
      setIsLoading(false);
    }
  }, [passwordData, authToasts, user, t]);

  const renderPersonalTab = () => (
    <div>
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 mb-8">
        <div className="relative group">
          {/* Profile Picture with Click to View */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative cursor-pointer"
            onClick={handlePictureClick}
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-green-100 dark:ring-green-800 group-hover:ring-green-200 dark:group-hover:ring-green-700 transition-all duration-200">
              <Avatar
                src={user?.avatar}
                alt={user?.name || user?.email}
                size="xl"
                fallback={user?.name?.charAt(0) || user?.email?.charAt(0)}
                className="w-full h-full transition-all duration-200 group-hover:brightness-110"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              
              {/* Loading Overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <LoadingSpinner size="sm" className="text-white" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Upload Button - Larger and More Prominent */}
          <motion.label 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute -bottom-2 -right-2 sm:-bottom-1 sm:-right-1 w-12 h-12 z-10 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 border-4 border-white dark:border-gray-800"
          >
            <Upload className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploadingAvatar}
            />
          </motion.label>
        </div>
        
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {t('personal.memberSince', { fallback: 'Member since' })} {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Use the new PersonalInfo component */}
      <PersonalInfo 
        user={user}
        onUpdate={updateProfile}
        isUpdating={isLoading}
      />
    </div>
  );

  // ✅ NEW: Preferences Tab
  const renderPreferencesTab = () => (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('preferences.title', { fallback: 'Application Preferences' })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('preferences.subtitle', { fallback: 'Customize your SpendWise experience with these settings.' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('preferences.language', { fallback: 'Language' })}
            </label>
            <select
              value={preferencesData.language_preference}
              onChange={(e) => setPreferencesData(prev => ({ ...prev, language_preference: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="en">English</option>
              <option value="he">עברית (Hebrew)</option>
            </select>
          </div>

          {/* Theme Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('preferences.theme', { fallback: 'Theme' })}
            </label>
            <select
              value={preferencesData.theme_preference}
              onChange={(e) => setPreferencesData(prev => ({ ...prev, theme_preference: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Currency Preference */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('preferences.currency', { fallback: 'Currency' })}
            </label>
            <select
              value={preferencesData.currency_preference}
              onChange={(e) => setPreferencesData(prev => ({ ...prev, currency_preference: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="ILS">🇮🇱 ₪ Israeli Shekel</option>
              <option value="USD">🇺🇸 USD - US Dollar</option>
              <option value="EUR">🇪🇺 EUR - Euro</option>
              <option value="GBP">🇬🇧 GBP - British Pound</option>
              <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
              <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
              <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handlePreferencesUpdate}
            loading={isLoading}
            variant="primary"
            size="lg"
            icon={<Save />}
            className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg border-0 w-full sm:w-auto"
          >
            {t('preferences.savePreferences', { fallback: 'Save Preferences' })}
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderSecurityTab = () => {
    // ✅ Use NEW auth status API data (reliable)
    const isGoogleOnlyUser = authStatus?.authType === 'GOOGLE_ONLY';
    const isHybridUser = authStatus?.authType === 'HYBRID';
    const isPasswordOnlyUser = authStatus?.authType === 'PASSWORD_ONLY';
    const hasPassword = authStatus?.hasPassword;
    
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t('security.password.title', { fallback: 'Password & Security' })}
        </h3>
        
        {/* ✅ Authentication Status Explanation */}
        <div className={`rounded-lg p-4 mb-6 ${
          isGoogleOnlyUser 
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
            : isHybridUser
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
            : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700'
        }`}>
          <div className="flex items-start space-x-3">
            <Shield className={`w-5 h-5 mt-0.5 ${
              isGoogleOnlyUser 
                ? 'text-blue-600 dark:text-blue-400'
                : isHybridUser
                ? 'text-green-600 dark:text-green-400'
                : 'text-orange-600 dark:text-orange-400'
            }`} />
            <div className="flex-1">
              <h4 className={`font-medium mb-2 ${
                isGoogleOnlyUser 
                  ? 'text-blue-900 dark:text-blue-100'
                  : isHybridUser
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-orange-900 dark:text-orange-100'
              }`}>
                {isGoogleOnlyUser 
                  ? t('security.googleOnly.title', { fallback: 'Google OAuth Account' })
                  : isHybridUser
                  ? t('security.hybrid.title', { fallback: 'Hybrid Authentication' })
                  : t('security.passwordOnly.title', { fallback: 'Email & Password Account' })
                }
              </h4>
              <p className={`text-sm mb-3 ${
                isGoogleOnlyUser 
                  ? 'text-blue-800 dark:text-blue-200'
                  : isHybridUser
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-orange-800 dark:text-orange-200'
              }`}>
                {isGoogleOnlyUser 
                  ? t('security.googleOnly.description', { fallback: 'You registered with Google OAuth. Set a password to enable email/password login alongside Google login.' })
                  : isHybridUser
                  ? t('security.hybrid.description', { fallback: 'Perfect! You can login with both Google OAuth and email/password. You have maximum flexibility and security.' })
                  : t('security.passwordOnly.description', { fallback: 'You can login with email and password. Consider linking your Google account for easier access.' })
                }
              </p>
              
              {/* Current Password Status */}
              <div className={`text-sm ${
                isGoogleOnlyUser 
                  ? 'text-blue-800 dark:text-blue-200'
                  : isHybridUser
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-orange-800 dark:text-orange-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>
                    {hasPassword 
                      ? t('security.password.status.set', { fallback: 'Password is set' })
                      : t('security.password.status.notSet', { fallback: 'No password set' })
                    }
                  </span>
                  {hasPassword && (
                    <Badge variant="success" size="sm">
                      {t('security.password.status.secure', { fallback: 'Secure' })}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 max-w-md">
          {/* Current Password Field - Show for all users with password */}
          {hasPassword && (
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('security.password.current', { fallback: 'Current Password' })}
                </label>
                <Badge variant="outline" size="sm">
                  {t('security.password.viewOnly', { fallback: 'View Only' })}
                </Badge>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Key className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white font-mono">
                    ••••••••••••••••
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Show current password in a toast or modal
                    addNotification({
                      type: 'info',
                      message: t('security.password.currentHidden', { fallback: 'Current password is hidden for security. Use the form below to change it.' }),
                      duration: 3000
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('security.password.currentNote', { fallback: 'Current password is hidden for security. Enter it below to change your password.' })}
              </p>
            </div>
          )}

          {/* Current Password Input - Required for password change */}
          {hasPassword && (
            <div className="relative">
              <Input
                label={t('security.password.currentInput', { fallback: 'Enter Current Password' })}
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                icon={<Key className="w-5 h-5" />}
                placeholder={t('security.password.currentPlaceholder', { fallback: 'Enter your current password...' })}
                autoComplete="current-password"
                showPasswordToggle
              />
            </div>
          )}

          {/* New Password Field */}
          <div className="relative">
            <Input
              label={hasPassword 
                ? t('security.password.new', { fallback: 'New Password' })
                : t('security.password.set', { fallback: 'Set Password' })
              }
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              icon={<Key className="w-5 h-5" />}
              placeholder={hasPassword 
                ? t('security.password.newPlaceholder', { fallback: 'Enter new password...' })
                : t('security.password.setPlaceholder', { fallback: 'Choose a secure password...' })
              }
              autoComplete="new-password"
              showPasswordToggle
            />
          </div>

          {/* Confirm Password Field */}
          <Input
            label={hasPassword 
              ? t('security.password.confirm', { fallback: 'Confirm New Password' })
              : t('security.password.confirmSet', { fallback: 'Confirm Password' })
            }
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            icon={<Key className="w-5 h-5" />}
            placeholder={hasPassword 
              ? t('security.password.confirmPlaceholder', { fallback: 'Confirm new password...' })
              : t('security.password.confirmSetPlaceholder', { fallback: 'Confirm your password...' })
            }
            autoComplete="new-password"
            showPasswordToggle
          />

          {/* Password Requirements */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('security.password.requirements.title', { fallback: 'Password Requirements' })}
            </h5>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• {t('security.password.requirements.length', { fallback: 'At least 8 characters' })}</li>
              <li>• {t('security.password.requirements.complexity', { fallback: 'Include letters and numbers' })}</li>
              <li>• {t('security.password.requirements.unique', { fallback: 'Different from current password' })}</li>
            </ul>
          </div>

          <Button 
            onClick={handlePasswordChange} 
            disabled={
              hasPassword 
                ? (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isLoading)
                : (!passwordData.newPassword || !passwordData.confirmPassword || isLoading)
            }
            variant="primary"
            size="lg"
            icon={<ShieldCheck />}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md hover:shadow-lg border-0"
          >
            {isLoading 
              ? t('messages.saving', { fallback: 'Saving...' })
              : hasPassword 
                ? t('security.password.change', { fallback: 'Change Password' })
                : t('security.password.set', { fallback: 'Set Password' })
            }
          </Button>
        </div>
      </Card>
    );
  };

  const renderExportTab = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('export.title', { fallback: 'Data Export' })}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('export.subtitle', { fallback: 'Download your data' })}
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CSV - Green gradient */}
          <Button 
            onClick={async () => {
              try {
                const data = await exportAsCSV();
                triggerDownload(data, null, 'csv');
              } catch (_) {}
            }}
            disabled={isExporting}
            variant="primary"
            size="lg"
            icon={<FileSpreadsheet />}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg border-0"
          >
            {t('export.actions.download', { fallback: 'Download Data' })} CSV
          </Button>

          {/* JSON - Indigo/Purple gradient */}
          <Button 
            onClick={async () => {
              try {
                const data = await exportAsJSON();
                triggerDownload(data, null, 'json');
              } catch (_) {}
            }}
            disabled={isExporting}
            variant="primary"
            size="lg"
            icon={<Braces />}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg border-0"
          >
            {t('export.actions.download', { fallback: 'Download Data' })} JSON
          </Button>

          {/* PDF - Rose/Red gradient */}
          <Button 
            onClick={async () => {
              try {
                const data = await exportAsPDF();
                triggerDownload(data, null, 'pdf');
              } catch (_) {}
            }}
            disabled={isExporting}
            variant="primary"
            size="lg"
            icon={<FileText />}
            className="bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md hover:shadow-lg border-0"
          >
            {t('export.actions.download', { fallback: 'Download Data' })} PDF
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Beautiful Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Page Title */}
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <User className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-gray-900 dark:text-white"
                >
                  {t('page.title', { fallback: 'Profile' })}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  {t('page.subtitle', { fallback: 'Manage your account and preferences' })}
                </motion.p>
              </div>
            </div>

            {/* Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Save Button */}
              {isEditing && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="primary"
                    className="flex items-center gap-2 px-4 py-2.5 h-auto rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{t('actions.save', { fallback: 'Save' })}</span>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Authentication Status Window */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <AuthStatusDetector 
            context="profile"
            onNavigateToSecurity={() => setActiveTab('security')} 
            showDebug={import.meta.env.DEV}
          />
        </motion.div>

        {/* Tab Navigation - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:space-x-1 space-y-1 sm:space-y-0 bg-white dark:bg-gray-800 rounded-lg p-1 mb-8 shadow-sm">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 justify-center sm:justify-center px-3 py-3 sm:py-2 text-sm sm:text-base"
              >
                <TabIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'export' && renderExportTab()}
          </motion.div>
        </AnimatePresence>

        {/* Picture Preview Modal */}
        <AnimatePresence>
          {showPictureModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={handleClosePictureModal}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('personal.profilePictureTitle', { fallback: 'Profile Picture' })}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClosePictureModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Large Picture Display */}
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                         alt={t('personal.profilePictureAlt', { fallback: 'Profile Picture' })}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <label className="flex-1">
                      <Button
                        variant="primary"
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <>
                             <LoadingSpinner size="sm" className="mr-2" />
                             {t('messages.loading', { fallback: 'Uploading...' })}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {t('personal.changePicture', { fallback: 'Change Picture' })}
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isUploadingAvatar}
                      />
                    </label>
                    
                    <Button
                      variant="outline"
                      onClick={handleClosePictureModal}
                      className="flex-1 sm:flex-none px-6"
                    >
                      {t('actions.cancel', { fallback: 'Cancel' })}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export modal removed: one-click CSV/JSON/PDF buttons replace preview */}

        {/* Removed legacy full-screen loading overlay to avoid blocking the page */}
      </motion.div>
    </div>
  );
};

export default Profile;