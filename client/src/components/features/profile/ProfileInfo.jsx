// components/features/profile/ProfileInfo.jsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Camera,
  Edit2,
  Save,
  X,
  Shield,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Loader,
  Check,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { cn } from '../../../utils/helpers';
import { Card, Input, Button, Alert, Avatar } from '../../ui';
import { authAPI } from '../../../utils/api';
import toast from 'react-hot-toast';

/**
 * ProfileInfo Component
 * User profile information and editing
 */
const ProfileInfo = ({ user }) => {
  const { updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.preferences?.phone || '',
    location: user?.preferences?.location || '',
    website: user?.preferences?.website || ''
  });
  
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(user?.preferences?.profilePicture || null);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.errors.invalidFileType'));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(t('profile.errors.fileTooLarge'));
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await authAPI.uploadProfilePicture(file);
      const imageUrl = response.data.data.path;
      
      setProfileImage(imageUrl);
      toast.success(t('profile.photoUploaded'));
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t('profile.errors.uploadFailed'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username?.trim()) {
      newErrors.username = t('validation.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('validation.usernameTooShort');
    }
    
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = t('validation.invalidWebsite');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSavingProfile(true);
    
    try {
      await updateProfile({
        username: formData.username,
        preferences: {
          phone: formData.phone,
          location: formData.location,
          website: formData.website,
          profilePicture: profileImage
        }
      });
      
      setIsEditing(false);
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(t('profile.updateError'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.preferences?.phone || '',
      location: user?.preferences?.location || '',
      website: user?.preferences?.website || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  // Info fields
  const infoFields = [
    {
      icon: User,
      label: t('profile.username'),
      value: formData.username,
      field: 'username',
      editable: true,
      required: true
    },
    {
      icon: Mail,
      label: t('profile.email'),
      value: formData.email,
      field: 'email',
      editable: false,
      helper: t('profile.emailNotEditable')
    },
    {
      icon: Phone,
      label: t('profile.phone'),
      value: formData.phone,
      field: 'phone',
      editable: true,
      placeholder: t('profile.phonePlaceholder')
    },
    {
      icon: MapPin,
      label: t('profile.location'),
      value: formData.location,
      field: 'location',
      editable: true,
      placeholder: t('profile.locationPlaceholder')
    },
    {
      icon: Globe,
      label: t('profile.website'),
      value: formData.website,
      field: 'website',
      editable: true,
      placeholder: 'https://example.com'
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('profile.personalInformation')}
        </h2>
        
        {!isEditing ? (
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="small"
              onClick={handleCancel}
              disabled={savingProfile}
            >
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              loading={savingProfile}
            >
              <Save className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar
              size="xl"
              name={user?.username}
              src={profileImage}
              className="ring-4 ring-gray-200 dark:ring-gray-700"
            />
            
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'bg-black/50 rounded-full opacity-0 group-hover:opacity-100',
                  'transition-opacity cursor-pointer'
                )}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <Loader className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {t('profile.profilePhoto')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('profile.photoHelper')}
            </p>
          </div>
        </div>

        {/* Info Fields */}
        <div className="space-y-4">
          {infoFields.map((field) => (
            <div key={field.field}>
              {isEditing && field.editable ? (
                <Input
                  label={field.label}
                  type="text"
                  value={field.value}
                  onChange={(e) => handleChange(field.field, e.target.value)}
                  placeholder={field.placeholder}
                  icon={field.icon}
                  error={errors[field.field]}
                  required={field.required}
                  helper={field.helper}
                />
              ) : (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </label>
                  <div className={cn(
                    'flex items-center gap-3 p-3',
                    'bg-gray-50 dark:bg-gray-900/50 rounded-xl',
                    'border border-gray-200 dark:border-gray-700'
                  )}>
                    <field.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {field.value || (
                        <span className="text-gray-400">
                          {field.placeholder || t('common.notSet')}
                        </span>
                      )}
                    </span>
                  </div>
                  {field.helper && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {field.helper}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Account Info */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            {t('profile.accountInfo')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Calendar className="w-4 h-4" />
                {t('profile.memberSince')}
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(user?.created_at).toLocaleDateString(
                  language === 'he' ? 'he-IL' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Shield className="w-4 h-4" />
                {t('profile.accountStatus')}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <p className="font-medium text-green-600 dark:text-green-400">
                  {t('profile.verified')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileInfo;