/**
 * ✏️ PERSONAL INFO - Complete Personal Details Component
 * Built from scratch to match server exactly
 * Features: All personal fields, optional updates, server-aligned
 * @version 3.1.0 - Single Edit Mode
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Calendar, Globe, Edit3, Save, X, 
  CheckCircle, AlertCircle, Camera, Link, FileText
} from 'lucide-react';

import { useTranslation, useNotifications } from '../../../stores';
import { Button, Input, Card, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 📝 Editable Field Component - Single Edit Mode
 */
const EditableField = ({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  maxLength = null,
  isEditing = false
}) => {
  const [editValue, setEditValue] = useState(value || '');

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleChange = useCallback((e) => {
    setEditValue(e.target.value);
    onChange?.(e.target.value);
  }, [onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex items-center space-x-3">
        <div className="flex-1">
          {isEditing ? (
            <Input
              type={type}
              value={editValue}
              onChange={handleChange}
              placeholder={placeholder}
              className="flex-1"
              maxLength={maxLength}
              disabled={disabled}
            />
          ) : (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {Icon && (
                <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white">
                  {value || <span className="text-gray-400 italic">{placeholder}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * ✏️ Personal Info Main Component - Server-Aligned with Single Edit Mode
 */
const PersonalInfo = ({
  user = {},
  onUpdate,
  isUpdating = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  // Debug: Log user data
  console.log('🔍 PersonalInfo - User object:', user);
  console.log('🔍 PersonalInfo - User fields:', {
    first_name: user.first_name,
    firstName: user.firstName,
    last_name: user.last_name,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    location: user.location,
    address: user.address,
    website: user.website,
    birthday: user.birthday,
    dateOfBirth: user.dateOfBirth,
    last_login_at: user.last_login_at,
    last_login: user.last_login,
    lastLoginAt: user.lastLoginAt,
    lastLogin: user.lastLogin
  });

  // ✅ Server-aligned state - matches database exactly
  const [personalData, setPersonalData] = useState({
    first_name: user.first_name || user.firstName || '',
    last_name: user.last_name || user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || user.address || '',
    website: user.website || '',
    birthday: user.birthday || user.dateOfBirth || ''
  });

  // Original data for comparison and reset
  const [originalData, setOriginalData] = useState({
    first_name: user.first_name || user.firstName || '',
    last_name: user.last_name || user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || user.address || '',
    website: user.website || '',
    birthday: user.birthday || user.dateOfBirth || ''
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  // Sync with user data changes
  useEffect(() => {
    console.log('🔍 PersonalInfo - User data received:', user);
    const newData = {
      first_name: user.first_name || user.firstName || '',
      last_name: user.last_name || user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || user.address || '',
      website: user.website || '',
      birthday: user.birthday || user.dateOfBirth || ''
    };
    
    setPersonalData(newData);
    setOriginalData(newData);
  }, [user]);

  // ✅ Handle field update during editing
  const handleFieldUpdate = useCallback((field, value) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Handle save all changes
  const handleSaveAll = useCallback(async () => {
    // Find changed fields
    const changedFields = {};
    Object.keys(personalData).forEach(key => {
      if (personalData[key] !== originalData[key]) {
        changedFields[key] = personalData[key];
      }
    });

    // If no changes, just exit edit mode
    if (Object.keys(changedFields).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      // Send all changed fields to server
      await onUpdate?.(changedFields);
      
      // Update original data
      setOriginalData(personalData);
      setIsEditing(false);
      
      // Success notification
      addNotification({
        type: 'success',
        message: t('personal.profileUpdated', { fallback: 'Profile updated successfully!' }),
        duration: 3000
      });
    } catch (error) {
      // Revert on error
      setPersonalData(originalData);
      addNotification({
        type: 'error',
        message: t('personal.updateFailed', { fallback: 'Failed to update profile. Please try again.' }),
        duration: 4000
      });
    }
  }, [personalData, originalData, onUpdate, addNotification, t]);

  // ✅ Handle cancel editing
  const handleCancel = useCallback(() => {
    setPersonalData(originalData);
    setIsEditing(false);
    addNotification({
      type: 'info',
      message: t('personal.changesCancelled', { fallback: 'Changes cancelled' }),
      duration: 2000
    });
  }, [originalData, addNotification, t]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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

  // Show loading if user data is not available
  if (!user || Object.keys(user).length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('personal.loading', { fallback: 'Loading personal information...' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-8", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Personal Details */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('personal.title', { fallback: 'Personal Information' })}
            </h3>
            
            <div className="flex items-center space-x-3">
              <Badge variant={user.email_verified ? "success" : "secondary"} size="sm">
                {user.email_verified ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('personal.verified', { fallback: 'Verified' })}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {t('personal.unverified', { fallback: 'Unverified' })}
                  </>
                )}
              </Badge>

              {/* Edit/Save/Cancel Buttons */}
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={isUpdating}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdating ? t('personal.saving', { fallback: 'Saving...' }) : t('personal.save', { fallback: 'Save' })}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>{t('personal.cancel', { fallback: 'Cancel' })}</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('personal.edit', { fallback: 'Edit' })}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* First Name */}
            <EditableField
              label={t('personal.firstName', { fallback: 'First Name' })}
              value={personalData.first_name}
              onChange={(value) => handleFieldUpdate('first_name', value)}
              icon={User}
              placeholder={t('personal.firstNamePlaceholder', { fallback: 'Enter your first name' })}
              maxLength={100}
              isEditing={isEditing}
            />

            {/* Last Name */}
            <EditableField
              label={t('personal.lastName', { fallback: 'Last Name' })}
              value={personalData.last_name}
              onChange={(value) => handleFieldUpdate('last_name', value)}
              icon={User}
              placeholder={t('personal.lastNamePlaceholder', { fallback: 'Enter your last name' })}
              maxLength={100}
              isEditing={isEditing}
            />

            {/* Email - Read Only */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('personal.email', { fallback: 'Email' })}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white">
                    {personalData.email || <span className="text-gray-400 italic">No email</span>}
                  </div>
                </div>
                <Badge variant="outline" size="sm">
                  {t('personal.readOnly', { fallback: 'Read Only' })}
                </Badge>
              </div>
            </div>

            {/* Phone */}
            <EditableField
              label={t('personal.phone', { fallback: 'Phone' })}
              value={personalData.phone}
              onChange={(value) => handleFieldUpdate('phone', value)}
              type="tel"
              icon={Phone}
              placeholder={t('personal.phonePlaceholder', { fallback: '+1234567890' })}
              maxLength={20}
              isEditing={isEditing}
            />

            {/* Birthday */}
            <EditableField
              label={t('personal.birthday', { fallback: 'Birthday' })}
              value={personalData.birthday}
              onChange={(value) => handleFieldUpdate('birthday', value)}
              type="date"
              icon={Calendar}
              placeholder={t('personal.birthdayPlaceholder', { fallback: 'Select your birthday' })}
              isEditing={isEditing}
            />

            {/* Location */}
            <EditableField
              label={t('personal.location', { fallback: 'Location' })}
              value={personalData.location}
              onChange={(value) => handleFieldUpdate('location', value)}
              icon={MapPin}
              placeholder={t('personal.locationPlaceholder', { fallback: 'City, Country' })}
              maxLength={255}
              isEditing={isEditing}
            />
          </div>

          {/* Website - Full Width */}
          <div className="mt-6">
            <EditableField
              label={t('personal.website', { fallback: 'Website' })}
              value={personalData.website}
              onChange={(value) => handleFieldUpdate('website', value)}
              type="url"
              icon={Link}
              placeholder={t('personal.websitePlaceholder', { fallback: 'https://your-website.com' })}
              isEditing={isEditing}
            />
          </div>

          {/* Bio - Full Width */}
          <div className="mt-6">
            <EditableField
              label={t('personal.bio', { fallback: 'Bio' })}
              value={personalData.bio}
              onChange={(value) => handleFieldUpdate('bio', value)}
              icon={FileText}
              placeholder={t('personal.bioPlaceholder', { fallback: 'Tell us about yourself...' })}
              maxLength={500}
              isEditing={isEditing}
            />
          </div>
        </Card>
      </motion.div>

      {/* Account Information */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            {t('account.title', { fallback: 'Account Information' })}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('account.memberSince', { fallback: 'Member Since' })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
              <Badge variant="outline">
                {user.role === 'admin' ? t('account.admin', { fallback: 'Admin' }) : t('account.user', { fallback: 'User' })}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('account.lastLogin', { fallback: 'Last Login' })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(user.last_login_at || user.last_login || user.lastLoginAt || user.lastLogin) 
                    ? new Date(user.last_login_at || user.last_login || user.lastLoginAt || user.lastLogin).toLocaleString() 
                    : 'Never logged in'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PersonalInfo; 