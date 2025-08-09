/**
 * 👤 PROFILE SETUP STEP - New Onboarding Page 1
 * Complete profile setup with picture, hybrid auth password, and preferences
 * @version 3.0.0 - REDESIGNED ONBOARDING
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Camera, Upload, X, Eye, EyeOff, Globe,
  DollarSign, Palette, Shield, Check, AlertCircle
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation, 
  useTheme, 
  useCurrency,
  useNotifications 
} from '../../../../stores';

import { Button, Input, Card, Avatar, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 👤 Profile Setup Step Component
 */
const ProfileSetupStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  // ✅ Zustand stores
  const { user, updateProfile } = useAuth();
  const { t, isRTL, currentLanguage, setLanguage } = useTranslation('onboarding');
  const { isDark, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  // ✅ Local state
  const [profileData, setProfileData] = useState({
    profilePicture: data.profilePicture || user?.profilePicture || user?.profile_picture_url || user?.avatar || null,
    firstName: data.firstName || user?.firstName || user?.first_name || '',
    lastName: data.lastName || user?.lastName || user?.last_name || '',
    password: data.password || '',
    confirmPassword: data.confirmPassword || '',
    language: data.language || currentLanguage || 'en',
    theme: data.theme || (isDark ? 'dark' : 'light'),
    currency: data.currency || currency || 'USD',
    ...data
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // ✅ Check if user needs password - FIXED LOGIC
  // Google users without passwords need to set one for hybrid auth
  const isGoogleUser = !!(user?.oauth_provider === 'google' || user?.google_id);
  const hasPassword = !!(user?.hasPassword || user?.has_password);
  const needsPassword = isGoogleUser && !hasPassword;
  const isHybridAuth = isGoogleUser && hasPassword;

  // ✅ Handle profile picture upload
  const handleProfilePictureUpload = useCallback(async (file) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addNotification({
        type: 'error',
        message: 'Profile picture must be smaller than 5MB'
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      const newData = {
        ...profileData,
        profilePicture: previewUrl,
        profilePictureFile: file
      };
      
      setProfileData(newData);
      onDataUpdate(newData);
      
      addNotification({
        type: 'success',
        message: 'Profile picture uploaded successfully!'
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      addNotification({
        type: 'error',
        message: 'Failed to upload profile picture'
      });
    } finally {
      setIsUploading(false);
    }
  }, [profileData, onDataUpdate, addNotification]);

  // ✅ Handle input changes
  const handleInputChange = useCallback((field, value) => {
    const newData = { ...profileData, [field]: value };
    setProfileData(newData);
    onDataUpdate(newData);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [profileData, onDataUpdate, errors]);

  // ✅ Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (needsPassword) {
      if (!profileData.password) {
        newErrors.password = 'Password is required for hybrid authentication';
      } else if (profileData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (profileData.password !== profileData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profileData, needsPassword]);

  // ✅ Handle next step
  const handleNext = useCallback(() => {
    if (validateForm()) {
      onNext();
    }
  }, [validateForm, onNext]);

  // ✅ Language options
  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'he', label: 'עברית', flag: '🇮🇱' }
  ];

  // ✅ Currency options
  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'ILS', label: 'Israeli Shekel (₪)', symbol: '₪' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' }
  ];

  // ✅ Theme options
  const themeOptions = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🔄' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
        >
          <User className="w-8 h-8 text-white" />
        </motion.div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          Welcome to SpendWise! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Let's set up your profile and preferences
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will help us personalize your experience
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-500" />
            Profile Information
          </h2>

          {/* Profile Picture Upload */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <Avatar
                src={profileData.profilePicture}
                alt="Profile"
                size="xl"
                fallback={profileData.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                className="w-24 h-24 border-4 border-white shadow-lg"
              />
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white transition-colors"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </motion.button>
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Click to upload profile picture
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Name Fields */}
          {!isGoogleUser && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <Input
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  error={errors.firstName}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <Input
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  error={errors.lastName}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Hybrid Authentication Setup */}
          {needsPassword && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                    Set Up Hybrid Authentication
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    You're signed in with Google. Create a password to also sign in with email when needed.
                  </p>
                  
                  <div className="space-y-3">
                    <Input
                      label="Set Password"
                      type={showPassword ? 'text' : 'password'}
                      value={profileData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password"
                      error={errors.password}
                      className="w-full"
                      autoComplete="new-password"
                    />
                    
                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={profileData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm password"
                      error={errors.confirmPassword}
                      className="w-full"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isHybridAuth && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Hybrid Authentication Active
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You can sign in with both Google and email/password
              </p>
            </div>
          )}
        </Card>

        {/* Preferences */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-purple-500" />
            Preferences
          </h2>

          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Globe className="w-4 h-4 inline mr-1" />
              Language
            </label>
            <div className="grid grid-cols-2 gap-3">
              {languageOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInputChange('language', option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left",
                    profileData.language === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{option.flag}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Currency
            </label>
            <div className="grid grid-cols-1 gap-2">
              {currencyOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleInputChange('currency', option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left",
                    profileData.currency === option.value
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      {option.symbol}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Palette className="w-4 h-4 inline mr-1" />
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInputChange('theme', option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-center",
                    profileData.theme === option.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation */}
      {/* Navigation buttons are handled by the modal footer; keep a single source of controls */}
    </motion.div>
  );
};

export default ProfileSetupStep;