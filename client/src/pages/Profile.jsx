/**
 * Profile Page - UNIFIED & CLEAN DESIGN
 * 
 * ✅ UNIFIED INTERFACE: All profile functions in one clean page
 * ✅ COMPACT LAYOUT: Streamlined, mobile-perfect design
 * ✅ VISUAL SIMPLICITY: Clean UI without unnecessary complexity
 * ✅ MOBILE OPTIMIZED: Perfect responsive design
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Globe,
  DollarSign,
  Moon,
  Sun,
  Camera,
  Edit2,
  Save,
  X,
  Lock,
  Check,
  CheckCircle,
  Info,
  Settings,
  Palette,
  Eye,
  EyeOff,
  Upload,
  Award,
  Clock,
  Languages,
  Coins,
  KeyRound,
  LogOut,
  Download
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';

// Layout
import PageContainer from '../components/layout/PageContainer';

// Features
import ExportModal from '../components/features/profile/ExportModal';

// UI
import { Card, Input, Button, Alert, Avatar, Modal } from '../components/ui';
import { dateHelpers, cn } from '../utils/helpers';

const Profile = () => {
  const { user, updateProfile, uploadProfilePicture, isUpdatingProfile, isUploadingPicture, logout } = useAuth();
  const toastService = useToast();
  
  const { t, language, setLanguage } = useLanguage();
  const { currency, changeCurrency } = useCurrency();
  const { theme, setTheme, isDark, isSessionOverride } = useTheme();
  const isRTL = language === 'he';

  // Enhanced state management
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [avatarKey, setAvatarKey] = useState(() => Date.now());
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    username: user?.username || ''
  });
  
  // Password data with strength tracking
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // ✅ UPDATED: Compact tab configuration (2 tabs only)
  const tabs = [
    {
      id: 'profile',
      label: t('profile.tabs.security') || 'Profile & Security',
      icon: User,
      gradient: 'from-blue-500 to-purple-600',
      description: t('profile.personalInformation') || 'Personal info & password'
    },
    {
      id: 'preferences',
      label: t('profile.preferences') || 'Preferences',
      icon: Settings,
      gradient: 'from-green-500 to-teal-600',
      description: t('profile.appPreferences') || 'App settings'
    }
  ];

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'gray' };
    
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    if (score < 30) return { score, label: t('common.weak') || 'Weak', color: 'red' };
    if (score < 60) return { score, label: t('common.fair') || 'Fair', color: 'orange' };
    if (score < 80) return { score, label: t('common.good') || 'Good', color: 'yellow' };
    return { score, label: t('common.strong') || 'Strong', color: 'green' };
  };

  const passwordStrength = calculatePasswordStrength(passwordData.newPassword);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
  };

  // Enhanced profile picture handler
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toastService.error(t('profile.invalidImageType') || 'Invalid file type. Please use JPEG, PNG, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastService.error(t('profile.imageTooLarge') || 'File too large. Please use an image under 5MB.');
      return;
    }

    try {
      await uploadProfilePicture(file);
      setAvatarKey(Date.now());
      toastService.success(t('profile.photoUploaded') || 'Profile picture updated successfully! 🎉');
      
      const fileInput = document.getElementById('profile-picture-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      toastService.error(t('common.uploadFailed') || 'Upload failed. Please try again.');
    }
  };

  // Enhanced profile save
  const handleProfileSave = async () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = t('common.usernameRequired') || 'Username is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateProfile(formData);
      setIsEditingProfile(false);
      setErrors({});
      toastService.success(t('profile.updateSuccess') || 'Profile updated successfully! ✨');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toastService.error(t('profile.updateError') || 'Failed to update profile. Please try again.');
    }
  };

  // Enhanced password change
  const handlePasswordChange = async () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = t('profile.currentPassword') || 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = t('profile.newPassword') || 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = t('common.passwordMinLength') || 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t('common.passwordsDoNotMatch') || 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

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
      setPasswordErrors({});
      setShowPasswords({ current: false, new: false, confirm: false });
      setIsEditingPassword(false);
      toastService.success(t('profile.passwordChanged') || 'Password changed successfully! 🔒');
    } catch (error) {
      console.error('Password change failed:', error);
      toastService.error(t('profile.passwordChangeError') || 'Password change failed. Please check your current password.');
    }
  };

  // Enhanced theme change
  const handleThemeChange = async (newTheme) => {
    // ✅ OPTIMIZATION: Only save if theme actually changed
    if (newTheme === theme) {
      console.log('🎨 [THEME] No change needed, theme already set to:', newTheme);
      return;
    }

    try {
      console.log('🎨 [THEME] Profile permanent change:', theme, '→', newTheme);
      
      // ✅ FIX: Use setTheme for permanent changes (this calls changeThemePermanent)
      setTheme(newTheme);
      
      // Save to database
      await updateProfile({
        theme_preference: newTheme
      });
      
      console.log('🎨 [THEME] Permanent change saved to database');
      toastService.success(`Theme saved to ${newTheme} mode! 🎨`);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      toastService.error('Failed to save theme preference. Please try again.');
    }
  };

  // Enhanced currency change handler
  const handleCurrencyChange = async (newCurrency) => {
    // ✅ OPTIMIZATION: Only save if currency actually changed
    if (newCurrency === currency) {
      console.log('💰 [CURRENCY] No change needed, currency already set to:', newCurrency);
      return;
    }

    try {
      await changeCurrency(newCurrency, { suppressToast: true });
      console.log('💰 [CURRENCY] Permanent change saved:', currency, '→', newCurrency);
      toastService.success(`Currency saved to ${newCurrency}! 💰`);
    } catch (error) {
      console.error('Failed to save currency preference:', error);
      toastService.error('Failed to save currency preference. Please try again.');
    }
  };

  // Enhanced language change handler
  const handleLanguageChange = async (newLanguage) => {
    // ✅ OPTIMIZATION: Only save if language actually changed
    if (newLanguage === language) {
      console.log('🌐 [LANGUAGE] No change needed, language already set to:', newLanguage);
      return;
    }

    try {
      setLanguage(newLanguage);
      await updateProfile({
        language_preference: newLanguage
      });
      console.log('🌐 [LANGUAGE] Permanent change saved:', language, '→', newLanguage);
      toastService.success(`Language saved to ${newLanguage === 'he' ? 'Hebrew' : 'English'}! 🌐`);
    } catch (error) {
      console.error('Failed to save language preference:', error);
      toastService.error('Failed to save language preference. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || ''
    });
    setErrors({});
    setIsEditingProfile(false);
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowPasswords({ current: false, new: false, confirm: false });
    setIsEditingPassword(false);
  };

  return (
    <PageContainer className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* ✅ COMPACT: Optimized Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>
          </div>

          <div className="relative p-4">
            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Enhanced Profile Picture - Smaller */}
              <motion.div 
                className="relative group cursor-pointer flex-shrink-0"
                onClick={() => !isUploadingPicture && document.getElementById('profile-picture-upload').click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white via-yellow-200 to-white rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity p-1"></div>
                
                <Avatar
                  key={`avatar-${user?.id}-${avatarKey}-${user?.preferences?.profilePicture || 'default'}`}
                  size="lg"
                  name={user?.username}
                  src={user?.preferences?.profilePicture}
                  className="relative z-10 w-16 h-16 transition-all duration-300"
                />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <Upload className="w-3 h-3 text-white mb-0.5" />
                  <span className="text-[8px] text-white font-medium">Edit</span>
                </div>
                
                {isUploadingPicture && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-30">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </motion.div>

              {/* Compact Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <motion.h1 
                      className="text-2xl font-bold text-white mb-1 truncate"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {user?.username}
                    </motion.h1>
                    
                    <motion.div 
                      className="flex items-center gap-2 mb-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{user?.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/30 backdrop-blur-sm rounded-full text-xs">
                        <CheckCircle className="w-3 h-3" />
                        <span>{t('profile.verified') || 'Verified'}</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Action Buttons - Right Side */}
                  <motion.div 
                    className="flex items-center gap-2 ml-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportModal(true)}
                      icon={Download}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-xs px-2 py-1.5"
                    >
                      {t('profile.exportData') || 'Export'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      icon={LogOut}
                      className="bg-red-500/20 backdrop-blur-sm border-red-300/30 text-red-100 hover:bg-red-500/30 text-xs px-2 py-1.5"
                    >
                      {t('common.logout') || 'Logout'}
                    </Button>
                  </motion.div>
                </div>

                {/* Compact Stats Grid */}
                <motion.div 
                  className="grid grid-cols-4 gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-white">{currency}</div>
                    <div className="text-[10px] text-white/70">{t('profile.currency') || 'Currency'}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-white">{language.toUpperCase()}</div>
                    <div className="text-[10px] text-white/70">{t('profile.language') || 'Language'}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-white capitalize">{theme}</div>
                    <div className="text-[10px] text-white/70">{t('profile.theme') || 'Theme'}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-white">
                      {user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-[10px] text-white/70">{t('profile.stats.days') || 'Days'}</div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile Layout - Super Compact */}
            <div className="lg:hidden space-y-3">
              <div className="flex items-center justify-between">
                {/* Profile Picture & Basic Info */}
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative group cursor-pointer flex-shrink-0"
                    onClick={() => !isUploadingPicture && document.getElementById('profile-picture-upload').click()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-yellow-200 to-white rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity p-1"></div>
                    
                    <Avatar
                      key={`avatar-${user?.id}-${avatarKey}-mobile`}
                      size="md"
                      name={user?.username}
                      src={user?.preferences?.profilePicture}
                      className="relative z-10 w-14 h-14 transition-all duration-300"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                      <Upload className="w-2.5 h-2.5 text-white" />
                    </div>
                    
                    {isUploadingPicture && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-30">
                        <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <motion.h1 
                      className="text-lg font-bold text-white truncate"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {user?.username}
                    </motion.h1>
                    
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/30 backdrop-blur-sm rounded-full text-xs">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>{t('profile.verified') || 'Verified'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                <motion.div 
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                    icon={Download}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-xs px-2 py-1.5"
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    icon={LogOut}
                    className="bg-red-500/20 backdrop-blur-sm border-red-300/30 text-red-100 hover:bg-red-500/30 text-xs px-2 py-1.5"
                  />
                </motion.div>
              </div>

              {/* Email Badge */}
              <motion.div 
                className="flex items-center gap-1.5 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs w-fit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[250px]">{user?.email}</span>
              </motion.div>

              {/* Mobile Stats Grid - Super Compact */}
              <motion.div 
                className="grid grid-cols-4 gap-1.5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-white">{currency}</div>
                  <div className="text-[8px] text-white/70">Currency</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-white">{language.toUpperCase()}</div>
                  <div className="text-[8px] text-white/70">Language</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-white capitalize">{theme}</div>
                  <div className="text-[8px] text-white/70">Theme</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 text-center">
                  <div className="text-xs font-bold text-white">
                    {user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="text-[8px] text-white/70">Days</div>
                </div>
              </motion.div>
            </div>
          </div>

          <input
            type="file"
            id="profile-picture-upload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleProfilePictureChange}
            className="hidden"
            disabled={isUploadingPicture}
          />
        </motion.div>

        {/* ✅ COMPACT: Smaller Tabbed Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {/* Tab Navigation */}
          <div className="flex justify-center lg:justify-start gap-3 mb-5">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300',
                  activeTab === tab.id
                    ? 'text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 hover:scale-105'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl`}
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <div className="relative flex items-center gap-3">
                  <tab.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-bold text-sm">{tab.label}</div>
                    <div className={cn(
                      'text-xs',
                      activeTab === tab.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {tab.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <ProfileSecurityTab 
                  user={user}
                  isEditingProfile={isEditingProfile}
                  setIsEditingProfile={setIsEditingProfile}
                  isEditingPassword={isEditingPassword}
                  setIsEditingPassword={setIsEditingPassword}
                  formData={formData}
                  setFormData={setFormData}
                  passwordData={passwordData}
                  setPasswordData={setPasswordData}
                  errors={errors}
                  passwordErrors={passwordErrors}
                  showPasswords={showPasswords}
                  setShowPasswords={setShowPasswords}
                  passwordStrength={passwordStrength}
                  handleProfileSave={handleProfileSave}
                  handlePasswordChange={handlePasswordChange}
                  handleCancel={handleCancel}
                  handlePasswordCancel={handlePasswordCancel}
                  isUpdating={isUpdatingProfile}
                  t={t}
                />
              )}
              
              {activeTab === 'preferences' && (
                <PreferencesTab 
                  language={language}
                  currency={currency}
                  theme={theme}
                  isDark={isDark}
                  isSessionOverride={isSessionOverride}
                  handleThemeChange={handleThemeChange}
                  handleCurrencyChange={handleCurrencyChange}
                  handleLanguageChange={handleLanguageChange}
                  t={t}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('profile.logoutConfirm')}
        size="small"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('profile.logoutConfirmDesc')}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowLogoutConfirm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={confirmLogout}
              icon={LogOut}
            >
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

// Profile Security Tab Component
const ProfileSecurityTab = ({ 
  user, 
  isEditingProfile, 
  setIsEditingProfile, 
  isEditingPassword, 
  setIsEditingPassword, 
  formData, 
  setFormData, 
  passwordData, 
  setPasswordData, 
  errors, 
  passwordErrors, 
  showPasswords, 
  setShowPasswords, 
  passwordStrength,
  handleProfileSave,
  handlePasswordChange,
  handleCancel,
  handlePasswordCancel,
  isUpdating,
  t
}) => (
  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg rounded-2xl">
    <div className="space-y-6">
      {/* Profile Information Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.personalInformation') || 'Personal Information'}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('profile.subtitle') || 'Manage your account details'}</p>
            </div>
          </div>
          
          {!isEditingProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              icon={Edit2}
              className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-xs px-2 py-1"
            >
              {t('profile.edit') || 'Edit'}
            </Button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="space-y-3">
            <Input
              label={t('profile.username') || "Username"}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
              icon={User}
              required
              className="bg-white/80 dark:bg-gray-800/80 text-sm"
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Mail className="w-3 h-3" />
                {t('profile.email') || 'Email Address'}
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <Lock className="w-2.5 h-2.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500 font-medium">{t('common.protected') || 'Protected'}</span>
                </div>
              </label>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3" />
                  {user?.email}
                  <span className="text-[10px] text-gray-500 ml-auto">{t('profile.emailNotEditable') || 'Cannot be changed'}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
                icon={X}
                className="text-xs px-2 py-1"
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProfileSave}
                loading={isUpdating}
                disabled={isUpdating}
                icon={Save}
                className="text-xs px-2 py-1"
              >
                {t('common.save') || 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('profile.username') || 'Username'}</span>
              </div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{user?.username}</p>
            </div>
            
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">{t('profile.email') || 'Email'}</span>
              </div>
              <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{user?.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Password Security Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-md">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.changePassword') || 'Password & Security'}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('profile.security') || 'Keep your account secure'}</p>
            </div>
          </div>
          
          {!isEditingPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingPassword(true)}
              icon={Edit2}
              className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-xs px-2 py-1"
            >
              {t('common.change') || 'Change'}
            </Button>
          )}
        </div>

        {isEditingPassword ? (
          <div className="max-w-md space-y-3">
            <div className="relative">
              <Input
                label="Current Password"
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                error={passwordErrors.currentPassword}
                icon={Lock}
                required
                className="bg-white/80 dark:bg-gray-800/80 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.current ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            <div className="relative">
              <Input
                label="New Password"
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                error={passwordErrors.newPassword}
                icon={Lock}
                required
                className="bg-white/80 dark:bg-gray-800/80 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.new ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-600 dark:text-gray-400">Password Strength</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      passwordStrength.color === 'red' && "text-red-600",
                      passwordStrength.color === 'orange' && "text-orange-600", 
                      passwordStrength.color === 'yellow' && "text-yellow-600",
                      passwordStrength.color === 'green' && "text-green-600"
                    )}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        passwordStrength.color === 'red' && "bg-red-500",
                        passwordStrength.color === 'orange' && "bg-orange-500",
                        passwordStrength.color === 'yellow' && "bg-yellow-500", 
                        passwordStrength.color === 'green' && "bg-green-500"
                      )}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                error={passwordErrors.confirmPassword}
                icon={Lock}
                required
                className="bg-white/80 dark:bg-gray-800/80 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-2 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.confirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordCancel}
                disabled={isUpdating}
                icon={X}
                className="text-xs px-2 py-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePasswordChange}
                loading={isUpdating}
                disabled={isUpdating || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                icon={Check}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-xs px-2 py-1"
              >
                Update
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Password Security</span>
              </div>
              <p className="text-xs text-green-800 dark:text-green-200">Your password is secure and up to date</p>
            </div>
            
            <Alert type="info" className="text-[10px]">
              <Lock className="w-3 h-3" />
              <div>
                <strong>Security Tips:</strong> Use a strong password with mixed case letters, numbers, and special characters. Consider using a password manager.
              </div>
            </Alert>
          </div>
        )}
      </div>
    </div>
  </Card>
);

// Preferences Tab Component
const PreferencesTab = ({ 
  language, 
  currency, 
  theme, 
  isDark, 
  isSessionOverride, 
  handleThemeChange,
  handleCurrencyChange,
  handleLanguageChange,
  t
}) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-0 shadow-lg rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg shadow-md">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.appPreferences') || 'App Preferences'}</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('profile.subtitle') || 'Customize your experience (saved to database)'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Language Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('profile.language') || 'Language'}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'en', label: 'English', flag: '🇺🇸', description: 'English (US)' },
              { value: 'he', label: 'עברית', flag: '🇮🇱', description: 'Hebrew (Israel)' }
            ].map((langOption) => (
              <motion.button
                key={langOption.value}
                onClick={() => handleLanguageChange(langOption.value)}
                className={cn(
                  'relative p-3 rounded-lg text-left transition-all duration-300 hover:scale-105',
                  language === langOption.value
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{langOption.flag}</span>
                  <div>
                    <div className="font-bold text-xs">{langOption.label}</div>
                    <div className={cn(
                      'text-[10px]',
                      language === langOption.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {langOption.description}
                    </div>
                  </div>
                </div>
                {language === langOption.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('profile.currency') || 'Currency'}</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {[
              { value: 'ILS', label: '₪ Shekel', flag: '🇮🇱', description: 'Israeli Shekel' },
              { value: 'USD', label: '$ Dollar', flag: '🇺🇸', description: 'US Dollar' },
              { value: 'EUR', label: '€ Euro', flag: '🇪🇺', description: 'European Euro' }
            ].map((currencyOption) => (
              <motion.button
                key={currencyOption.value}
                onClick={() => handleCurrencyChange(currencyOption.value)}
                className={cn(
                  'relative p-3 rounded-lg text-left transition-all duration-300 hover:scale-105',
                  currency === currencyOption.value
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currencyOption.flag}</span>
                  <div>
                    <div className="font-bold text-xs">{currencyOption.label}</div>
                    <div className={cn(
                      'text-[10px]',
                      currency === currencyOption.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {currencyOption.description}
                    </div>
                  </div>
                </div>
                {currency === currencyOption.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('profile.theme') || 'Theme'}</h3>
            {isSessionOverride && (
              <motion.div
                className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/20 rounded-full"
                whileHover={{ scale: 1.05 }}
                title="Theme has been temporarily changed. Save changes to make it permanent."
              >
                <Clock className="w-2.5 h-2.5 text-orange-500" />
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Session</span>
              </motion.div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'light', label: 'Light Mode', icon: Sun, gradient: 'from-yellow-400 to-orange-500', description: 'Clean and bright' },
              { value: 'dark', label: 'Dark Mode', icon: Moon, gradient: 'from-purple-600 to-indigo-700', description: 'Easy on the eyes' }
            ].map((themeOption) => (
              <motion.button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={cn(
                  'relative p-3 rounded-lg text-left transition-all duration-300 hover:scale-105 overflow-hidden',
                  theme === themeOption.value
                    ? 'text-white shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {theme === themeOption.value && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${themeOption.gradient}`}></div>
                )}
                <div className="relative flex items-center gap-2">
                  <themeOption.icon className="w-4 h-4" />
                  <div>
                    <div className="font-bold text-xs">{themeOption.label}</div>
                    <div className={cn(
                      'text-[10px]',
                      theme === themeOption.value ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {themeOption.description}
                    </div>
                  </div>
                </div>
                {theme === themeOption.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <Alert type="info" className="mt-4 text-[10px]">
        <Info className="w-3 h-3" />
        <div>
          <strong>💡 Pro Tip:</strong> Changes made here are permanent and sync across all your devices. Use the header toggles for quick temporary changes during your session.
        </div>
      </Alert>
    </Card>
  );
};

export default Profile;