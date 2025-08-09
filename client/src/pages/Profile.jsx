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
  RefreshCw, Upload, ZoomIn, ImageIcon
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

import { Button, Card, Input, Avatar, LoadingSpinner } from '../components/ui';
import ExportModal from '../components/features/profile/ExportModal';
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPictureModal, setShowPictureModal] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form data
  const [personalData, setPersonalData] = useState({
    firstName: user?.first_name || user?.firstName || '',
    lastName: user?.last_name || user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    website: user?.website || '',
    birthday: user?.birthday || ''
  });

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

  // ENHANCED tabs - include preferences
  const tabs = [
    { id: 'personal', label: t('tabs.personal', 'Personal Info'), icon: User },
    { id: 'preferences', label: t('tabs.preferences', 'Preferences'), icon: Settings },
    { id: 'security', label: t('tabs.security', 'Security'), icon: Shield },
    { id: 'export', label: t('tabs.export', 'Export Data'), icon: Download }
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

  // ✅ ENHANCED: Update personal info with all fields
  const handlePersonalUpdate = useCallback(async () => {
    if (!personalData.firstName?.trim() || !personalData.lastName?.trim()) {
      authToasts.requiredFieldsMissing();
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile({
        firstName: personalData.firstName.trim(),
        lastName: personalData.lastName.trim(),
        phone: personalData.phone?.trim() || '',
        location: personalData.location?.trim() || '',
        bio: personalData.bio?.trim() || '',
        website: personalData.website?.trim() || '',
        birthday: personalData.birthday || null
      });

      if (result.success) {
        setIsEditing(false);
        authToasts.profileUpdated();
      } else {
        throw new Error(result.error?.message || 'Update failed');
      }
    } catch (error) {
      authToasts.profileUpdateFailed();
    } finally {
      setIsLoading(false);
    }
  }, [personalData, updateProfile, authToasts, t]);

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

        // ✅ 4. Refresh user data to sync with database
        const refreshResult = await useAuthStore.getState().actions.getProfile();
        if (refreshResult.success) {
          console.log('✅ Profile preferences updated and applied:', {
            theme: preferencesData.theme_preference,
            language: preferencesData.language_preference,
            currency: preferencesData.currency_preference
          });
        }

        // ✅ 5. Show success notification
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

    const isGoogleOnlyUser = user?.oauth_provider === 'google' && !user?.hasPassword;

    setIsLoading(true);
    try {
      if (isGoogleOnlyUser) {
        // OAuth user setting first password - use setPassword endpoint
        await api.auth.setPassword({
          newPassword: passwordData.newPassword
        });
      } else {
        // Regular user changing password - use changePassword endpoint
        await api.auth.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
      }
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      authToasts.passwordChanged();
    } catch (error) {
      authToasts.passwordChangeFailed(error);
    } finally {
      setIsLoading(false);
    }
  }, [passwordData, authToasts, user]);

  const renderPersonalTab = () => (
    <Card className="p-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="relative group">
          {/* Profile Picture with Click to View */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative cursor-pointer"
            onClick={handlePictureClick}
          >
            <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-green-100 dark:ring-green-800 group-hover:ring-green-200 dark:group-hover:ring-green-700 transition-all duration-200">
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
            className="absolute -bottom-1 -right-1 w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 border-4 border-white dark:border-gray-800"
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
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Member since {user?.createdAt ? dateHelpers.format(user.createdAt, 'MMM yyyy') : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
          <div className="flex items-center space-x-2">
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to original user data
                  setPersonalData({
                    firstName: user?.first_name || user?.firstName || '',
                    lastName: user?.last_name || user?.lastName || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    location: user?.location || '',
                    bio: user?.bio || '',
                    website: user?.website || '',
                    birthday: user?.birthday || ''
                  });
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              variant={isEditing ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                if (isEditing) {
                  handlePersonalUpdate();
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isLoading}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={personalData.firstName}
            onChange={(e) => setPersonalData(prev => ({ ...prev, firstName: e.target.value }))}
            disabled={!isEditing}
            required
          />
          <Input
            label="Last Name"
            value={personalData.lastName}
            onChange={(e) => setPersonalData(prev => ({ ...prev, lastName: e.target.value }))}
            disabled={!isEditing}
            required
          />
          <Input
            label="Email"
            type="email"
            value={personalData.email}
            disabled={true}
            className="opacity-50 cursor-not-allowed"
          />
          <Input
            label="Phone"
            type="tel"
            value={personalData.phone}
            onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={!isEditing}
            placeholder="+1234567890"
          />
          <Input
            label="Location"
            value={personalData.location}
            onChange={(e) => setPersonalData(prev => ({ ...prev, location: e.target.value }))}
            disabled={!isEditing}
            placeholder="City, Country"
          />
          <Input
            label="Website"
            type="url"
            value={personalData.website}
            onChange={(e) => setPersonalData(prev => ({ ...prev, website: e.target.value }))}
            disabled={!isEditing}
            placeholder="https://..."
          />
          <Input
            label="Birthday"
            type="date"
            value={personalData.birthday}
            onChange={(e) => setPersonalData(prev => ({ ...prev, birthday: e.target.value }))}
            disabled={!isEditing}
          />
        </div>
        
        {/* Bio field - full width */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={personalData.bio}
            onChange={(e) => setPersonalData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            rows={3}
            placeholder="Tell us about yourself..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>


      </div>
    </Card>
  );

  // ✅ NEW: Preferences Tab
  const renderPreferencesTab = () => (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Application Preferences
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Customize your SpendWise experience with these settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
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
              Theme
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
              Currency
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
            className="px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderSecurityTab = () => {
    // ✅ Check if user is Google-only (no password set)
    const isGoogleOnlyUser = user?.oauth_provider === 'google' && !user?.hasPassword;
    
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h3>
        
        {/* ✅ Google OAuth User Notice */}
        {isGoogleOnlyUser ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Google Account Security
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Your account uses Google sign-in for authentication. To add password login as an option:
                </p>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                  <li>Set a password below to enable hybrid login</li>
                  <li>You can then use either Google or password to sign in</li>
                  <li>Your Google sign-in will continue to work normally</li>
                </ol>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">
                  ✨ This gives you more login flexibility without removing Google authentication
                </p>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="space-y-4 max-w-md">
        {/* Current password field removed per request */}

        <div className="relative">
          <Input
            label={isGoogleOnlyUser ? "Set Password" : "New Password"}
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            icon={<Key className="w-5 h-5" />}
            placeholder={isGoogleOnlyUser ? "Choose a secure password..." : "Enter new password..."}
            autoComplete="new-password"
            showPasswordToggle
          />
        </div>

        <Input
          label={isGoogleOnlyUser ? "Confirm Password" : "Confirm New Password"}
          type="password"
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          icon={<Key className="w-5 h-5" />}
          placeholder={isGoogleOnlyUser ? "Confirm your password..." : "Confirm new password..."}
          autoComplete="new-password"
          showPasswordToggle
        />

        <Button 
          onClick={handlePasswordChange} 
          disabled={
            // ✅ For Google-only users: only need new password & confirm
            // ✅ For regular users: need current password + new password + confirm
            isGoogleOnlyUser 
              ? (!passwordData.newPassword || !passwordData.confirmPassword || isLoading)
              : (!passwordData.newPassword || !passwordData.confirmPassword || isLoading)
          }
          className="w-full"
        >
          {isLoading 
            ? (isGoogleOnlyUser ? 'Setting Password...' : 'Changing Password...') 
            : (isGoogleOnlyUser ? 'Set Password' : 'Change Password')
          }
        </Button>
        </div>
      </Card>
    );
  };

  const renderExportTab = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Your Data</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Download all your financial data in various formats.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={async () => {
              setIsLoading(true);
              try {
                const result = await api.export.exportAsCSV();
                if (result.success) {
                  // Using general toast for export operations (not auth-specific)
                  toast.success('CSV export started - download will begin shortly');
                } else {
                  throw new Error(result.error?.message || 'Export failed');
                }
              } catch (error) {
                toast.error(error.message || 'Failed to export CSV');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export as CSV
          </Button>
          
          <Button 
            onClick={async () => {
              setIsLoading(true);
              try {
                const result = await api.export.exportAsJSON();
                if (result.success) {
                  // Using general toast for export operations (not auth-specific)
                  toast.success('JSON export started - download will begin shortly');
                } else {
                  throw new Error(result.error?.message || 'Export failed');
                }
              } catch (error) {
                toast.error(error.message || 'Failed to export JSON');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export as JSON
          </Button>
        </div>
        
        <Button onClick={() => setShowExportModal(true)} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Advanced Export Options
        </Button>
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
                  Profile
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                >
                  Manage your account and preferences
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
                    <span className="hidden sm:inline font-medium">Save</span>
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Picture</h3>
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
                        alt="Profile Picture"
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
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Change Picture
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
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Modal */}
        {showExportModal && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;