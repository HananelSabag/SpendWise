/**
 * 👤 PROFILE PAGE - SIMPLIFIED & FUNCTIONAL VERSION
 * Only essential features: Personal Info, Security, Export Data
 * @version 3.0.0 - MAJOR SIMPLIFICATION
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Download, Camera, Edit2, Save, X,
  Eye, EyeOff, Key, Mail, Calendar, MapPin, Settings
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

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);  // ✅ FIXED: Use correct field name expected by server
      
      const response = await api.users.uploadAvatar(formData);
      console.log('🔍 Profile Upload Response:', response);
      console.log('🔍 Profile Upload - Avatar URL from server:', response.data?.data?.url || response.data?.url);
      
      // ✅ FIXED: The upload endpoint already updates the user's avatar in database
      // No need to call updateProfile again - it causes validation errors
      // The upload-profile-picture endpoint handles both upload AND database update
      
      // Only refresh user data if upload was successful
      if (response.success) {
        console.log('🔍 Profile Upload - About to refresh user profile...');
        const refreshResult = await useAuthStore.getState().actions.getProfile();
        console.log('🔍 Profile Upload - Profile refresh result:', refreshResult);
      }
      
      // Only show success and refresh cache if upload was successful
      if (response.success) {
        // Force browser to refresh any cached images by updating avatar URLs
        const avatarElements = document.querySelectorAll('img[src*="supabase"]');
        avatarElements.forEach(img => {
          if (img.src.includes('supabase')) {
            const url = new URL(img.src);
            url.searchParams.set('t', Date.now());
            img.src = url.toString();
          }
        });
        
        authToasts.avatarUploaded();
      } else {
        // Upload failed, show error
        authToasts.avatarUploadFailed();
      }
    } catch (error) {
      console.error('🔍 Profile Upload Error:', error);
      authToasts.avatarUploadFailed();
    } finally {
      setIsLoading(false);
    }
  }, [authToasts, updateProfile]);

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

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      authToasts.passwordMismatch();
      return;
    }

    if (passwordData.newPassword.length < 8) {
      authToasts.passwordTooShort();
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      authToasts.passwordChanged();
    } catch (error) {
      authToasts.passwordChangeFailed(error);
    } finally {
      setIsLoading(false);
    }
  }, [passwordData, authToasts]);

  const renderPersonalTab = () => (
    <Card className="p-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="relative">
          <Avatar
            src={user?.avatar}
            alt={user?.name || user?.email}
            size="xl"
            fallback={user?.name?.charAt(0) || user?.email?.charAt(0)}
          />
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
            <Camera className="w-4 h-4 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
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

  const renderSecurityTab = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Change Password</h3>
      
      <div className="space-y-4 max-w-md">
        <div className="relative">
          <Input
            label="Current Password"
            type={showCurrentPassword ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            icon={<Key className="w-5 h-5" />}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            icon={<Key className="w-5 h-5" />}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          icon={<Key className="w-5 h-5" />}
        />

        <Button 
          onClick={handlePasswordChange} 
          disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isLoading}
          className="w-full"
        >
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </div>
    </Card>
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 mb-8 shadow-sm">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "primary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 justify-center"
              >
                <TabIcon className="w-4 h-4 mr-2" />
                {tab.label}
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
      </div>
    </div>
  );
};

export default Profile;