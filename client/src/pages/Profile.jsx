/**
 * 👤 PROFILE PAGE - CLEAN ORCHESTRATOR VERSION!
 * 🚀 Split into focused components for better performance and maintainability
 * Features: Component-based architecture, Clean tab navigation, Mobile-first
 * @version 2.0.0 - MEGA REFACTOR COMPLETE
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Edit3, Settings, Shield, Brain,
  Activity, Download, AlertTriangle
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation, 
  useNotifications 
} from '../stores';

// ✅ Import our new split components
import ProfileHeader from '../components/features/profile/ProfileHeader';
import PersonalInfo from '../components/features/profile/PersonalInfo';
import SecuritySettings from '../components/features/profile/SecuritySettings';
import SmartPreferences from '../components/features/profile/SmartPreferences';
import ProfileOverview from '../components/features/profile/ProfileOverview';
import AccountSettings from '../components/features/profile/AccountSettings';

// ✅ Import UI components
import { Button, Card, LoadingSpinner } from '../components/ui';
import { api } from '../api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../utils/helpers';

/**
 * 👤 Profile Main Component - Orchestrator
 */
const Profile = () => {
  // ✅ Zustand stores
  const { user, updateProfile, logout } = useAuth();
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  // ✅ State management
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ Fetch user analytics
  const { 
    data: userAnalytics, 
    isLoading: analyticsLoading 
  } = useQuery({
    queryKey: ['userAnalytics', user?.id],
    queryFn: async () => {
      const response = await api.users.getAnalytics();
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // ✅ Tab configuration
  const tabs = [
    { 
      id: 'overview', 
      label: t('tabs.overview'), 
      icon: User,
      color: 'text-blue-600'
    },
    { 
      id: 'personal', 
      label: t('tabs.personal'), 
      icon: Edit3,
      color: 'text-green-600'
    },
    { 
      id: 'security', 
      label: t('tabs.security'), 
      icon: Shield,
      color: 'text-red-600'
    },
    { 
      id: 'smart', 
      label: t('tabs.smart'), 
      icon: Brain,
      color: 'text-purple-600'
    },
    { 
      id: 'account', 
      label: t('tabs.account'), 
      icon: Settings,
      color: 'text-gray-600'
    }
  ];

  // ✅ Handle avatar upload
  const handleAvatarUpload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.users.uploadAvatar(formData);
    await updateProfile({ avatar: response.data.url });
    
    return response.data;
  }, [updateProfile]);

  // ✅ Handle profile update
  const handleProfileUpdate = useCallback(async (profileData) => {
    setIsUpdating(true);
    try {
      await updateProfile(profileData);
      addNotification({
        type: 'success',
        message: t('updateSuccess'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('updateFailed'),
        duration: 3000
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [updateProfile, addNotification, t]);

  // ✅ Handle password change
  const handlePasswordChange = useCallback(async (currentPassword, newPassword) => {
    await api.auth.changePassword({ currentPassword, newPassword });
  }, []);

  // ✅ Handle security feature toggle
  const handleSecurityFeatureToggle = useCallback(async (featureId, enabled) => {
    await api.users.updateSecuritySettings({ [featureId]: enabled });
  }, []);

  // ✅ Handle smart feature toggle
  const handleSmartFeatureToggle = useCallback(async (featureId, enabled) => {
    await api.users.updateSmartSettings({ [featureId]: enabled });
  }, []);

  // ✅ Handle export
  const handleExport = useCallback(async (type, options = {}) => {
    const response = await api.export.exportData(type, options);
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendwise-${type}-${new Date().toISOString().split('T')[0]}.${options.format || 'json'}`;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }, []);

  // ✅ Handle account deletion
  const handleAccountDelete = useCallback(async () => {
    await api.users.deleteAccount();
    await logout();
    
    // Redirect handled by auth store
  }, [logout]);

  // ✅ Handle quick actions
  const handleQuickAction = useCallback((action) => {
    switch (action.id) {
      case 'export':
        setActiveTab('account');
        break;
      case 'preferences':
        setActiveTab('personal');
        break;
      case 'security':
        setActiveTab('security');
        break;
      case 'smart':
        setActiveTab('smart');
        break;
      default:
        console.log('Quick action:', action);
    }
  }, []);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  // ✅ Loading state
  if (analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <ProfileHeader
            userAnalytics={userAnalytics}
            onAvatarUpload={handleAvatarUpload}
          />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex space-x-1 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-3 rounded-xl"
                  >
                    <TabIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            {activeTab === 'overview' && (
              <ProfileOverview
                recentActivity={userAnalytics?.recentActivity || []}
                achievements={userAnalytics?.achievements || []}
                onQuickAction={handleQuickAction}
              />
            )}

            {activeTab === 'personal' && (
              <PersonalInfo
                user={user}
                onUpdate={handleProfileUpdate}
                isUpdating={isUpdating}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySettings
                onPasswordChange={handlePasswordChange}
                onSecurityFeatureToggle={handleSecurityFeatureToggle}
                sessionTimeout={userAnalytics?.sessionTimeout || 30}
                onSessionTimeoutChange={(timeout) => 
                  api.users.updateSettings({ sessionTimeout: timeout })
                }
              />
            )}

            {activeTab === 'smart' && (
              <SmartPreferences
                onFeatureToggle={handleSmartFeatureToggle}
                onAISettingsChange={(settings) => 
                  api.users.updateAISettings(settings)
                }
                aiSettings={userAnalytics?.aiSettings || {}}
              />
            )}

            {activeTab === 'account' && (
              <AccountSettings
                onExport={handleExport}
                onPrivacyChange={(setting, value) => 
                  api.users.updatePrivacySettings({ [setting]: value })
                }
                onAccountDelete={handleAccountDelete}
                privacySettings={userAnalytics?.privacySettings || {}}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Mobile Tab Navigation */}
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50">
          <Card className="p-2">
            <div className="grid grid-cols-5 gap-1">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="flex flex-col items-center space-y-1 p-3"
                  >
                    <TabIcon className="w-5 h-5" />
                    <span className="text-xs">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;