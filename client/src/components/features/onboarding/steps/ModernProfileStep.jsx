/**
 * 👤 MODERN PROFILE STEP - Enhanced Step 1
 * Complete profile setup + preferences in one streamlined step
 * Features: Profile info, Hybrid auth, Language, Currency, Theme, Notifications
 * @version 4.0.0 - MODERN REDESIGN
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Camera, Upload, X, Eye, EyeOff, Globe,
  DollarSign, Palette, Shield, Check, AlertCircle,
  Sun, Moon, Monitor
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation, 
  useTheme, 
  useCurrency
} from '../../../../stores';

import { Button, Input, Card, Avatar, Badge, Switch } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 👤 Modern Profile Step Component
 */
const ModernProfileStep = ({ 
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

  // ✅ Auto-populate names from email for new users
  const getNameFromEmail = (email) => {
    if (!email) return { firstName: '', lastName: '' };
    const username = email.split('@')[0];
    const parts = username.split(/[._-]/);
    if (parts.length >= 2) {
      return {
        firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
        lastName: parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
      };
    }
    return {
      firstName: username.charAt(0).toUpperCase() + username.slice(1),
      lastName: ''
    };
  };

  const emailNames = getNameFromEmail(user?.email);

  // ✅ Local state - Simplified without notifications
  const [profileData, setProfileData] = useState({
    profilePicture: data.profilePicture || user?.profilePicture || user?.profile_picture_url || user?.avatar || null,
    firstName: data.firstName || user?.firstName || user?.first_name || emailNames.firstName,
    lastName: data.lastName || user?.lastName || user?.last_name || emailNames.lastName,
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

  // ✅ Check if user needs password - ENHANCED LOGIC
  const isGoogleUser = !!(user?.oauth_provider === 'google' || user?.google_id);
  const hasPassword = !!(user?.hasPassword || user?.has_password);
  const needsPassword = isGoogleUser && !hasPassword;
  const isHybridAuth = isGoogleUser && hasPassword;

  // ✅ Handle profile picture upload - ENHANCED
  const handleProfilePictureUpload = useCallback(async (file) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('Profile picture must be smaller than 5MB');
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
    } catch (error) {
      console.error('Profile picture upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [profileData, onDataUpdate]);

  // ✅ Handle input changes - ENHANCED
  const handleInputChange = useCallback((field, value) => {
    const newData = { ...profileData, [field]: value };
    setProfileData(newData);
    onDataUpdate(newData);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Apply changes immediately for better UX
    if (field === 'language' && value !== currentLanguage) {
      setLanguage(value);
    }
    if (field === 'theme') {
      setTheme(value);
    }
    if (field === 'currency' && value !== currency) {
      setCurrency(value);
    }
  }, [profileData, onDataUpdate, errors, currentLanguage, setLanguage, setTheme, currency, setCurrency]);



  // ✅ Enhanced validation - Optional fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // First and last name are optional now
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

  // ✅ Language options
  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸', nativeName: 'English' },
    { value: 'he', label: 'עברית', flag: '🇮🇱', nativeName: 'עברית' }
  ];

  // ✅ Currency options - ENHANCED
  const currencyOptions = [
    { value: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { value: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
    { value: 'ILS', label: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
    { value: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' }
  ];

  // ✅ Theme options - ENHANCED
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Bright interface for day use' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark interface for low-light' },
    { value: 'auto', label: 'Auto', icon: Monitor, description: 'Matches system preference' }
  ];



  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-full"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Enhanced Header */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <User className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
          Welcome to SpendWise! 👋
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Let's set up your profile and preferences
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will personalize your experience and ensure everything works perfectly
        </p>
      </motion.div>

      {/* Single Page Content - No tabs */}
      <motion.div
        variants={itemVariants}
        className="max-w-6xl mx-auto"
      >
        <div className="grid gap-8">
          {/* Profile Section */}
          <Card className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Profile Picture Section */}
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-blue-500" />
                  Profile Picture
                </h2>

                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar
                      src={profileData.profilePicture}
                      alt="Profile"
                      size="2xl"
                      fallback={profileData.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      className="w-32 h-32 border-4 border-white shadow-xl"
                    />
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white transition-colors"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Click the camera icon to upload your profile picture
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Profile Information */}
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-green-500" />
                  Personal Information
                </h2>

                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
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
                        Last Name
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

                  {/* Hybrid Authentication Setup */}
                  {needsPassword && (
                    <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">
                            Set Up Hybrid Authentication
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                            You're signed in with Google. Create a password to also sign in with email when needed.
                          </p>
                          
                          <div className="space-y-4">
                            <div className="relative">
                              <Input
                                label="Set Password"
                                type={showPassword ? 'text' : 'password'}
                                value={profileData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="Create a password"
                                error={errors.password}
                                className="w-full pr-10"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            
                            <div className="relative">
                              <Input
                                label="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={profileData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                placeholder="Confirm password"
                                error={errors.confirmPassword}
                                className="w-full pr-10"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isHybridAuth && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Language & Currency */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-500" />
                Language & Currency
              </h2>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Language
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {languageOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('language', option.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        profileData.language === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{option.flag}</span>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.nativeName}</div>
                          </div>
                        </div>
                        {profileData.language === option.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{option.flag}</span>
                          <div className="font-medium">{option.label}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                            {option.symbol}
                          </span>
                          {profileData.currency === option.value && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Theme Selection */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-500" />
                Theme Preference
              </h2>

              <div className="space-y-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('theme', option.value)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all text-left",
                        profileData.theme === option.value
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          profileData.theme === option.value
                            ? "bg-indigo-100 dark:bg-indigo-800"
                            : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          <Icon className={cn(
                            "w-6 h-6",
                            profileData.theme === option.value
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-gray-600 dark:text-gray-400"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {option.description}
                          </div>
                        </div>
                        {profileData.theme === option.value && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Navigation handled by modal footer */}
    </motion.div>
  );
};

export default ModernProfileStep;
