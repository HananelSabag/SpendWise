/**
 * 🔐 GOOGLE PROFILE COMPLETION - Step for OAuth users to complete profile
 * Allows Google OAuth users to set username, upload profile picture, and go through onboarding
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Upload, Camera, Check, ArrowRight, Settings, Globe
} from 'lucide-react';

import { useTranslation, useAuth, useNotifications } from '../../../stores';
import { Button, Input, LoadingSpinner, Avatar } from '../../ui';
import { api } from '../../../api';
import { cn } from '../../../utils/helpers';

/**
 * Google Profile Completion Component
 */
const GoogleProfileCompletion = ({ 
  onComplete,
  onSkip,
  initialUserData = {},
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('auth');
  const { user, updateProfile } = useAuth();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);

  // ✅ Form state
  const [formData, setFormData] = useState({
    username: initialUserData.username || initialUserData.name?.split(' ')[0] || '',
    firstName: initialUserData.firstName || initialUserData.name?.split(' ')[0] || '',
    lastName: initialUserData.lastName || initialUserData.name?.split(' ').slice(1).join(' ') || '',
    bio: '',
    website: '',
    phone: '',
    location: ''
  });

  const [profilePicture, setProfilePicture] = useState(initialUserData.avatar || initialUserData.picture || null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // ✅ Handle profile picture upload with Live Photo support
  const handleProfilePictureChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // ✅ Import image processor
      const { validateImageFile, processImageForUpload } = await import('../../../utils/imageProcessor');
      
      // ✅ Validate file (allows up to 10MB for Live Photos)
      const validation = validateImageFile(file, { maxSizeMB: 10 });
      if (!validation.valid) {
        addNotification({
          type: 'error',
          message: validation.error
        });
        return;
      }

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
        addNotification({
          type: 'success',
          message: `Image optimized: ${originalMB}MB → ${newMB}MB`
        });
      }

      // Create preview from processed file
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
        setProfilePictureFile(processedFile); // Use processed file
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      addNotification({
        type: 'error',
        message: t('profilePictureUploadError', { fallback: 'Failed to process image' })
      });
    }
  }, [addNotification, t]);

  // ✅ Validate form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.username?.trim()) {
      newErrors.username = t('usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('usernameTooShort');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t('usernameInvalidCharacters');
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('firstNameRequired');
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('lastNameRequired');
    }

    // Optional field validations
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = t('websiteInvalidFormat');
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('phoneInvalidFormat');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare update data
      const updateData = {
        username: formData.username.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        bio: formData.bio.trim(),
        website: formData.website.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        onboarding_completed: true, // ✅ FIXED: Use consistent field name
        profile_completed: true // ✅ Keep for backward compatibility
      };

      // Upload profile picture if selected
      if (profilePictureFile) {
        const formDataPicture = new FormData();
        formDataPicture.append('profilePicture', profilePictureFile);
        
        try {
          const uploadResult = await api.users.uploadProfilePicture(formDataPicture);
          if (uploadResult.success) {
            updateData.avatar = uploadResult.data.url;
          }
        } catch (uploadError) {
          console.warn('Profile picture upload failed:', uploadError);
          // Continue with other updates even if picture upload fails
        }
      }

      // Update profile
      const result = await updateProfile(updateData);
      
      if (result.success) {
        addNotification({
          type: 'success',
          message: t('profileCompletedSuccessfully')
        });
        
        onComplete?.(result.user);
      } else {
        setErrors({ 
          general: result.error?.message || t('profileUpdateFailed')
        });
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      setErrors({ 
        general: t('profileUpdateError')
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, profilePictureFile, updateProfile, addNotification, t, onComplete]);

  // ✅ Handle skip
  const handleSkip = useCallback(() => {
    onSkip?.();
  }, [onSkip]);

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8", className)}>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <Settings className="w-8 h-8 text-white" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('completeYourProfile')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('addDetailsToPersonalizeExperience')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.general}
            </p>
          </motion.div>
        )}

        {/* Profile Picture */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {t('profilePicture')}
          </label>
          
          <div className="relative inline-block">
            <Avatar
              src={profilePicture}
              alt={formData.firstName || 'Profile'}
              size="xl"
              className="ring-4 ring-white dark:ring-gray-800 shadow-lg"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>
          
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('clickToUploadProfilePicture')}
          </p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('username')} *
          </label>
          <div className="relative">
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={t('usernamePlaceholder')}
              className={cn(
                "pl-12",
                errors.username && "border-red-300 focus:border-red-500"
              )}
              disabled={isSubmitting}
            />
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.username}
            </p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('firstName')} *
            </label>
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder={t('firstNamePlaceholder')}
              className={errors.firstName ? "border-red-300 focus:border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('lastName')} *
            </label>
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder={t('lastNamePlaceholder')}
              className={errors.lastName ? "border-red-300 focus:border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('bio')} ({t('optional')})
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder={t('bioPlaceholder')}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isSubmitting}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('phone')} ({t('optional')})
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t('phonePlaceholder')}
              className={errors.phone ? "border-red-300 focus:border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('website')} ({t('optional')})
            </label>
            <Input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder={t('websitePlaceholder')}
              className={errors.website ? "border-red-300 focus:border-red-500" : ""}
              disabled={isSubmitting}
            />
            {errors.website && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.website}
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('location')} ({t('optional')})
          </label>
          <Input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder={t('locationPlaceholder')}
            disabled={isSubmitting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            className="flex-1 min-h-[48px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className={cn("mr-2", isRTL && "ml-2 mr-0")} />
            ) : (
              <Check className={cn("w-5 h-5 mr-2", isRTL && "ml-2 mr-0")} />
            )}
            {isSubmitting ? t('completing') : t('completeProfile')}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            className="sm:w-auto"
            disabled={isSubmitting}
          >
            {t('skipForNow')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GoogleProfileCompletion; 