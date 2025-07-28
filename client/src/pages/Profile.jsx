/**
 * 👤 PROFILE PAGE - SIMPLIFIED & FUNCTIONAL VERSION
 * Only essential features: Personal Info, Security, Export Data
 * @version 3.0.0 - MAJOR SIMPLIFICATION
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Download, Camera, Edit2, Save, X,
  Eye, EyeOff, Key, Mail, Calendar, MapPin
} from 'lucide-react';

import { 
  useAuth, 
  useAuthStore,
  useTranslation, 
  useNotifications 
} from '../stores';

import { Button, Card, Input, Avatar, LoadingSpinner } from '../components/ui';
import ExportModal from '../components/features/profile/ExportModal';
import { api } from '../api';
import { cn, dateHelpers } from '../utils/helpers';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  // State
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form data
  const [personalData, setPersonalData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Simple tabs - only essentials
  const tabs = [
    { id: 'personal', label: t('tabs.personal', 'Personal Info'), icon: User },
    { id: 'security', label: t('tabs.security', 'Security'), icon: Shield },
    { id: 'export', label: t('tabs.export', 'Export Data'), icon: Download }
  ];

  // Handle profile picture upload
  const handleAvatarUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        message: 'Profile picture must be less than 5MB'
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);  // ✅ FIXED: Use correct field name expected by server
      
      const response = await api.users.uploadAvatar(formData);
      console.log('🔍 Profile Upload Response:', response);
      console.log('🔍 Profile Upload - Avatar URL from server:', response.data?.url);
      
      // ✅ FIXED: The upload endpoint already updates the user's avatar in database
      // No need to call updateProfile again - it causes validation errors
      // The upload-profile-picture endpoint handles both upload AND database update
      
      // Refresh user data in auth store to get updated avatar
      console.log('🔍 Profile Upload - About to refresh user profile...');
      const refreshResult = await useAuthStore.getState().actions.getProfile();
      console.log('🔍 Profile Upload - Profile refresh result:', refreshResult);
      
      // Force browser to refresh any cached images by updating avatar URLs
      const avatarElements = document.querySelectorAll('img[src*="supabase"]');
      avatarElements.forEach(img => {
        if (img.src.includes('supabase')) {
          const url = new URL(img.src);
          url.searchParams.set('t', Date.now());
          img.src = url.toString();
        }
      });
      
      addNotification({
        type: 'success',
        message: 'Profile picture updated!'
      });
    } catch (error) {
      console.error('🔍 Profile Upload Error:', error);
      addNotification({
        type: 'error',
        message: 'Failed to upload profile picture'
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, updateProfile]);

  // Handle personal info update
  const handlePersonalUpdate = useCallback(async () => {
    setIsLoading(true);
    try {
      await updateProfile(personalData);
      setIsEditing(false);
      addNotification({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to update profile'
      });
    } finally {
      setIsLoading(false);
    }
  }, [personalData, updateProfile, addNotification]);

  // Handle password change
  const handlePasswordChange = useCallback(async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        message: 'Passwords do not match'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addNotification({
        type: 'error',
        message: 'Password must be at least 8 characters'
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addNotification({
        type: 'success',
        message: 'Password changed successfully!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to change password'
      });
    } finally {
      setIsLoading(false);
    }
  }, [passwordData, addNotification]);

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
          <Button
            variant={isEditing ? "outline" : "primary"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={personalData.firstName}
            onChange={(e) => setPersonalData(prev => ({ ...prev, firstName: e.target.value }))}
            disabled={!isEditing}
            icon={<User className="w-5 h-5" />}
          />
          <Input
            label="Last Name"
            value={personalData.lastName}
            onChange={(e) => setPersonalData(prev => ({ ...prev, lastName: e.target.value }))}
            disabled={!isEditing}
            icon={<User className="w-5 h-5" />}
          />
          <Input
            label="Email"
            value={personalData.email}
            onChange={(e) => setPersonalData(prev => ({ ...prev, email: e.target.value }))}
            disabled={!isEditing}
            icon={<Mail className="w-5 h-5" />}
            type="email"
          />
          <Input
            label="Phone"
            value={personalData.phone}
            onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={!isEditing}
            placeholder="Optional"
          />
          <Input
            label="Location"
            value={personalData.location}
            onChange={(e) => setPersonalData(prev => ({ ...prev, location: e.target.value }))}
            disabled={!isEditing}
            icon={<MapPin className="w-5 h-5" />}
            placeholder="Optional"
            className="md:col-span-2"
          />
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handlePersonalUpdate} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
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
      
      <Button onClick={() => setShowExportModal(true)}>
        <Download className="w-4 h-4 mr-2" />
        Export Data
      </Button>
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