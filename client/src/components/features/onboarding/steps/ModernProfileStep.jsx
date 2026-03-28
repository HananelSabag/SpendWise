/**
 * 👤 MODERN PROFILE STEP - Enhanced Step 1
 * Complete profile setup + preferences in one streamlined step
 * Features: Profile info, Hybrid auth, Language, Currency, Theme, Notifications
 * @version 4.0.0 - MODERN REDESIGN
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import AuthStatusDetector from '../../auth/AuthStatusDetector';
import { toast } from 'react-hot-toast';
import { api } from '../../../../api';
import { authAPI } from '../../../../api/auth.js';
import { simpleGoogleAuth } from '../../../../services/simpleGoogleAuth.js';
import { useAuthStore } from '../../../../stores/authStore.js';

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
  const { t: tAuth } = useTranslation('auth');
  const { t: tProfile } = useTranslation('profile');
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
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // ✅ SIMPLIFIED: Use ACTUAL database values - no guesswork!
  const isGoogleUser = !!(user?.oauth_provider === 'google' || user?.google_id);
  const hasPassword = !!(user?.hasPassword || user?.has_password);
  
  // Simple, clear user types based on database reality
  const isHybridUser = isGoogleUser && hasPassword;    // Has both Google + Password
  const isEmailOnlyUser = hasPassword && !isGoogleUser; // Has only password
  const isGoogleOnlyUser = isGoogleUser && !hasPassword; // Has only Google
  
  // Authentication setup requirements
  const needsPassword = isGoogleOnlyUser;  // Only pure Google users need password setup
  const canLinkGoogle = isEmailOnlyUser;   // Only email-only users can link Google
  

  const isHybridAuth = isHybridUser;

  // ✅ Handle profile picture upload - ENHANCED with Live Photo support
  const handleProfilePictureUpload = useCallback(async (file) => {
    if (!file) return;

    // ✅ Import image processor
    const { validateImageFile, processImageForUpload } = await import('../../../../utils/imageProcessor');
    
    // ✅ Validate file (allows up to 10MB for Live Photos)
    const validation = validateImageFile(file, { maxSizeMB: 10 });
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      
      // ✅ Process image (handles Live Photos, HEIC, and compression)
      const { file: processedFile, wasProcessed, originalSize, newSize } = await processImageForUpload(file, {
        maxSizeMB: 5, // Target 5MB after processing
        maxWidthOrHeight: 2048,
        quality: 0.85
      });
      
      // Show processing info if image was processed
      if (wasProcessed) {
        const originalMB = (originalSize / 1024 / 1024).toFixed(2);
        const newMB = (newSize / 1024 / 1024).toFixed(2);
        console.log(`✅ Image processed: ${originalMB}MB → ${newMB}MB`);
        toast.success(`Image optimized: ${originalMB}MB → ${newMB}MB`, { duration: 2000 });
      }
      
      // ✅ Upload to server immediately during onboarding
      const formData = new FormData();
      formData.append('profilePicture', processedFile);
      
      const response = await api.users.uploadAvatar(formData);
      
      if (response.success) {
        // Get the uploaded URL from server response
        const uploadedUrl = response.avatar_url || response.data?.data?.publicUrl || response.data?.data?.url;
        
        const newData = {
          ...profileData,
          profilePicture: uploadedUrl,
          profilePictureFile: null, // Clear file since it's uploaded
          uploadedProfilePicture: uploadedUrl
        };
        
        setProfileData(newData);
        onDataUpdate(newData);
        
        // Show success message
        toast.success('Profile picture uploaded successfully!');
      } else {
        throw new Error(response.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      
      toast.error(error.message || 'Failed to upload profile picture. Please try again.');
      
      // Keep local preview only
      const previewUrl = URL.createObjectURL(file);
      const newData = {
        ...profileData,
        profilePicture: previewUrl,
        profilePictureFile: file
      };
      
      setProfileData(newData);
      onDataUpdate(newData);
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
    
    if (needsPassword) {
      const pwd = profileData.password || '';
      if (!pwd) {
        newErrors.password = tAuth('passwordRequiredForSetup') || 'Password is required for setup';
      } else if (pwd.length < 8) {
        newErrors.password = tAuth('passwordTooShort') || 'Password must be at least 8 characters';
      } else if (!/[A-Za-z]/.test(pwd) || !/[0-9]/.test(pwd)) {
        newErrors.password = tAuth('passwordComplexity') || 'Password must include at least one letter and one number';
      }

      if (profileData.password !== profileData.confirmPassword) {
        newErrors.confirmPassword = tAuth('passwordsDontMatch') || 'Passwords do not match';
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
    { value: 'light', label: t('preferences.theme.light') || 'Light', icon: Sun, description: t('preferences.theme.lightDescription') || 'Bright interface for day use' },
    { value: 'dark', label: t('preferences.theme.dark') || 'Dark', icon: Moon, description: t('preferences.theme.darkDescription') || 'Dark interface for low-light' },
    { value: 'auto', label: t('preferences.theme.auto') || 'Auto', icon: Monitor, description: t('preferences.theme.autoDescription') || 'Matches system preference' }
  ];



  return (
    <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <div className="space-y-4">
          {/* Profile Section */}
          <Card className="p-4">
            {/* Profile Picture + Name — horizontal row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={profileData.profilePicture}
                  alt={tProfile('personal.profilePictureAlt')}
                  size="xl"
                  fallback={profileData.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  className="w-16 h-16 border-2 border-white shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow border-2 border-white transition-colors"
                >
                  {isUploading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Name fields inline */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tAuth('firstName') || 'First Name'}
                  </label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder={tAuth('firstNamePlaceholder') || 'First name'}
                    error={errors.firstName}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tAuth('lastName') || 'Last Name'}
                  </label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder={tAuth('lastNamePlaceholder') || 'Last name'}
                    error={errors.lastName}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Auth status + password setup */}
            <div className="space-y-3">
                  {/* ✅ New Bulletproof Authentication Status Detector */}
                  <AuthStatusDetector
                    context="onboarding"
                    className="mt-4"
                    onPasswordSetup={() => {
                      // Enable password setup mode in this step
                      setShowPasswordSetup(true);
                    }}
                    onGoogleLink={async () => {
                      try {
                        // Initialize Google auth and get credential
                        await simpleGoogleAuth.initializeGoogle();
                        const credential = await simpleGoogleAuth.signIn();
                        
                        if (credential) {
                          // Process Google credential to link account
                          const result = await authAPI.googleLogin(credential);
                          
                          if (result.success) {
                            // Update auth store with new user data
                            useAuthStore.getState().actions.setUser(result.user);
                            
                            // Also refresh profile to get latest data
                            await useAuthStore.getState().actions.getProfile();
                            
                            // Show success message
                            toast.success('Google account linked successfully! You can now use both login methods.');
                          }
                        }
                      } catch (error) {
                        console.error('Google linking failed:', error);
                        toast.error('Failed to link Google account. Please try again.');
                      }
                    }}
                    showDebug={import.meta.env.DEV}
                  />

                  {/* ✅ Password Setup Form - Show when triggered by AuthStatusWindow */}
                  {showPasswordSetup && needsPassword && (
                    <div className="mt-6 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
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
                                placeholder={tAuth('createPasswordPlaceholder') || 'Create a password'}
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
                                placeholder={tAuth('confirmPasswordPlaceholder') || 'Confirm password'}
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

                            <div className="flex justify-end space-x-3">
                              <Button
                                variant="outline"
                                onClick={() => setShowPasswordSetup(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  // Validate and save password via API
                                  if (validateForm()) {
                                    try {
                                      setIsLoading(true);
                                      
                                      // Call setPassword API for Google-only users
                                      const result = await authAPI.setPassword({
                                        newPassword: profileData.password
                                      });
                                      
                                      if (result.success) {
                                        // Success - refresh user data and close form
                                        await useAuthStore.getState().actions.getProfile();
                                        
                                        setShowPasswordSetup(false);
                                        
                                        // Show success message
                                        toast.success('Password set successfully! You can now use both login methods.');
                                        
                                        // Clear password fields
                                        handleInputChange('password', '');
                                        handleInputChange('confirmPassword', '');
                                      } else {
                                        throw new Error(result.error?.message || 'Failed to set password');
                                      }
                                    } catch (error) {
                                      console.error('Password setup failed:', error);
                                      toast.error(error.message || 'Failed to set password. Please try again.');
                                    } finally {
                                      setIsLoading(false);
                                    }
                                  }
                                }}
                                className="bg-amber-600 hover:bg-amber-700"
                                disabled={isLoading}
                              >
                                {isLoading ? 'Setting Password...' : 'Save Password'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
          </Card>

          {/* Preferences Section — compact, single column */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Language &amp; Currency
            </h2>

            {/* Language — compact horizontal buttons */}
            <div className="flex gap-2 mb-4">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('language', option.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 text-sm transition-all",
                    profileData.language === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 font-medium"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <span>{option.flag}</span>
                  <span>{option.label}</span>
                  {profileData.language === option.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>

            {/* Currency — compact grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {currencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('currency', option.value)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm transition-all",
                    profileData.currency === option.value
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 font-medium"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  )}
                >
                  <span>{option.flag}</span>
                  <span className="font-bold text-gray-600 dark:text-gray-400">{option.symbol}</span>
                  <span className="flex-1 truncate">{option.label}</span>
                  {profileData.currency === option.value && <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Theme — compact inline buttons */}
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-500" />
              Theme
            </h2>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('theme', option.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 text-sm transition-all",
                      profileData.theme === option.value
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 font-medium"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      profileData.theme === option.value ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500"
                    )} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
  );
};

export default ModernProfileStep;


