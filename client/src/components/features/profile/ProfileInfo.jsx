// pages/profile/ProfileInfo.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit2, 
  Save, 
  X,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useUploadProfilePicture } from '../../../hooks/useApi';
import { Card, Button, Input, Alert, Avatar } from '../../ui';
import { dateHelpers } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const ProfileInfo = ({ user }) => {
  const { t, language } = useLanguage();
  const { updateProfile, isUpdatingProfile } = useAuth();
  const uploadMutation = useUploadProfilePicture();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});
  
  const isRTL = language === 'he';

  const handleSave = async () => {
    // Validate
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = t('validation.usernameRequired');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setErrors({});
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.invalidImageType'));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.imageTooLarge'));
      return;
    }

    try {
      console.log(`🖼️ [PROFILE] Uploading image: ${file.name}`);
      
      await uploadMutation.mutateAsync(file);
      
      // Clear file input
      const fileInput = document.getElementById('profile-picture-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error(`❌ [PROFILE] Upload failed:`, error);
    }
  };

  const infoItems = [
    {
      label: t('profile.username'),
      value: user?.username,
      icon: User
    },
    {
      label: t('profile.email'),
      value: user?.email,
      icon: Mail
    },
    {
      label: t('profile.memberSince'),
      value: user?.created_at ? dateHelpers.format(user.created_at, 'PPP', language) : '-',
      icon: Calendar
    },
    {
      label: t('profile.lastLogin'),
      value: user?.last_login ? dateHelpers.formatRelative(user.last_login, language) : t('profile.never'),
      icon: Shield
    }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('profile.personalInformation')}
        </h3>
        {!isEditing && (
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsEditing(true)}
            icon={Edit2}
          >
            {t('common.edit')}
          </Button>
        )}
      </div>

      {/* Profile Picture Section - Fixed */}
      <div className="flex flex-col items-center mb-6">
        <div 
          className="relative group cursor-pointer"
          onClick={() => document.getElementById('profile-picture-upload').click()}
        >
          <Avatar
            size="lg"
            name={user?.username}
            src={user?.preferences?.profilePicture}
            className="ring-4 ring-gray-100 dark:ring-gray-800 group-hover:ring-primary-300 dark:group-hover:ring-primary-600 transition-all"
          />
          
          {/* Upload overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white mb-1" />
            <span className="text-xs text-white font-medium">
              {t('profile.changePhoto')}
            </span>
          </div>
          
          {/* Hidden file input */}
          <input
            type="file"
            id="profile-picture-upload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleProfilePictureChange}
            className="hidden"
            disabled={uploadMutation.isLoading}
          />
          
          {/* Loading overlay */}
          {uploadMutation.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Upload instructions */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center max-w-xs">
          {t('profile.photoHelper')}
        </p>
      </div>

      {/* Profile Information */}
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <Input
            label={t('profile.username')}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={errors.username}
            icon={User}
            required
          />
          
          <Input
            label={t('profile.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            icon={Mail}
            required
          />

          <Alert type="info">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{t('profile.emailNotEditable')}</p>
          </Alert>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdatingProfile}
            >
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isUpdatingProfile}
            >
              <Save className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {infoItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.label}
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Account Status */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {t('profile.verified')}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProfileInfo;