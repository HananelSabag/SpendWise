/**
 * ✏️ PERSONAL INFO - Personal Details Editing Component
 * Extracted from Profile.jsx for better performance and maintainability
 * Features: Profile editing, Contact info, Preferences, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Calendar, Globe,
  Edit3, Save, X, CheckCircle, AlertCircle
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useNotifications,
  useCurrency,
  useTheme
} from '../../../stores';

import { Button, Input, Card, Select, Badge } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

/**
 * 📝 Editable Field Component
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
  options = null,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = useCallback(() => {
    onChange?.(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex items-center space-x-3">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              {options ? (
                <Select
                  value={editValue}
                  onValueChange={setEditValue}
                  className="flex-1"
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1"
                  autoFocus
                />
              )}
              
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={disabled}
              >
                <Save className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={disabled}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 🌍 Preferences Section
 */
const PreferencesSection = ({ 
  preferences, 
  onPreferencesChange,
  className = '' 
}) => {
  const { t } = useTranslation('profile');
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();

  const currencyOptions = [
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
    { value: 'ILS', label: '₪ ILS' }
  ];

  const themeOptions = [
    { value: 'light', label: t('preferences.theme.light') },
    { value: 'dark', label: t('preferences.theme.dark') },
    { value: 'system', label: t('preferences.theme.system') }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
    { value: 'Asia/Jerusalem', label: 'Israel Standard Time (IST)' }
  ];

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
        {t('preferences.title')}
      </h3>

      <div className="space-y-6">
        <EditableField
          label={t('preferences.currency')}
          value={currency}
          onChange={(value) => {
            setCurrency(value);
            onPreferencesChange?.({ currency: value });
          }}
          options={currencyOptions}
          icon={Globe}
        />

        <EditableField
          label={t('preferences.theme.title')}
          value={theme}
          onChange={(value) => {
            setTheme(value);
            onPreferencesChange?.({ theme: value });
          }}
          options={themeOptions}
          icon={Globe}
        />

        <EditableField
          label={t('preferences.timezone')}
          value={preferences.timezone || 'UTC'}
          onChange={(value) => onPreferencesChange?.({ timezone: value })}
          options={timezoneOptions}
          icon={Globe}
        />

        <EditableField
          label={t('preferences.dateFormat')}
          value={preferences.dateFormat || 'MM/dd/yyyy'}
          onChange={(value) => onPreferencesChange?.({ dateFormat: value })}
          options={[
            { value: 'MM/dd/yyyy', label: 'MM/dd/yyyy (US)' },
            { value: 'dd/MM/yyyy', label: 'dd/MM/yyyy (EU)' },
            { value: 'yyyy-MM-dd', label: 'yyyy-MM-dd (ISO)' }
          ]}
          icon={Calendar}
        />
      </div>
    </Card>
  );
};

/**
 * ✏️ Personal Info Main Component
 */
const PersonalInfo = ({
  user = {},
  onUpdate,
  isUpdating = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  const [personalData, setPersonalData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    country: user.country || '',
    dateOfBirth: user.dateOfBirth || '',
    bio: user.bio || ''
  });

  const [preferences, setPreferences] = useState({
    timezone: user.timezone || 'UTC',
    dateFormat: user.dateFormat || 'MM/dd/yyyy',
    language: user.language || 'en'
  });

  // Handle field update
  const handleFieldUpdate = useCallback(async (field, value) => {
    const updatedData = { ...personalData, [field]: value };
    setPersonalData(updatedData);

    try {
      await onUpdate?.({ [field]: value });
      addNotification({
        type: 'success',
        message: t('personal.fieldUpdated'),
        duration: 2000
      });
    } catch (error) {
      // Revert on error
      setPersonalData(prev => ({ ...prev, [field]: personalData[field] }));
      addNotification({
        type: 'error',
        message: t('personal.updateFailed'),
        duration: 3000
      });
    }
  }, [personalData, onUpdate, addNotification, t]);

  // Handle preferences update
  const handlePreferencesUpdate = useCallback(async (newPreferences) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      await onUpdate?.(newPreferences);
      addNotification({
        type: 'success',
        message: t('preferences.updated'),
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('preferences.updateFailed'),
        duration: 3000
      });
    }
  }, [preferences, onUpdate, addNotification, t]);

  // Animation variants
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
              {t('personal.title')}
            </h3>
            
            <Badge variant={user.isVerified ? "success" : "secondary"} size="sm">
              {user.isVerified ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {t('personal.verified')}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {t('personal.unverified')}
                </>
              )}
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <EditableField
              label={t('personal.firstName')}
              value={personalData.firstName}
              onChange={(value) => handleFieldUpdate('firstName', value)}
              icon={User}
              placeholder={t('personal.firstNamePlaceholder')}
              required
            />

            <EditableField
              label={t('personal.lastName')}
              value={personalData.lastName}
              onChange={(value) => handleFieldUpdate('lastName', value)}
              icon={User}
              placeholder={t('personal.lastNamePlaceholder')}
              required
            />

            <EditableField
              label={t('personal.email')}
              value={personalData.email}
              onChange={(value) => handleFieldUpdate('email', value)}
              type="email"
              icon={Mail}
              placeholder={t('personal.emailPlaceholder')}
              required
            />

            <EditableField
              label={t('personal.phone')}
              value={personalData.phone}
              onChange={(value) => handleFieldUpdate('phone', value)}
              type="tel"
              icon={Phone}
              placeholder={t('personal.phonePlaceholder')}
            />

            <EditableField
              label={t('personal.dateOfBirth')}
              value={personalData.dateOfBirth}
              onChange={(value) => handleFieldUpdate('dateOfBirth', value)}
              type="date"
              icon={Calendar}
            />

            <EditableField
              label={t('personal.country')}
              value={personalData.country}
              onChange={(value) => handleFieldUpdate('country', value)}
              icon={MapPin}
              placeholder={t('personal.countryPlaceholder')}
            />
          </div>

          <div className="mt-6">
            <EditableField
              label={t('personal.address')}
              value={personalData.address}
              onChange={(value) => handleFieldUpdate('address', value)}
              icon={MapPin}
              placeholder={t('personal.addressPlaceholder')}
            />
          </div>

          <div className="mt-6">
            <EditableField
              label={t('personal.bio')}
              value={personalData.bio}
              onChange={(value) => handleFieldUpdate('bio', value)}
              icon={Edit3}
              placeholder={t('personal.bioPlaceholder')}
            />
          </div>
        </Card>
      </motion.div>

      {/* Preferences */}
      <motion.div variants={itemVariants}>
        <PreferencesSection
          preferences={preferences}
          onPreferencesChange={handlePreferencesUpdate}
        />
      </motion.div>

      {/* Account Information */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            {t('account.title')}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('account.memberSince')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user.createdAt ? dateHelpers.format(user.createdAt, 'MMMM do, yyyy') : 'Unknown'}
                </div>
              </div>
              <Badge variant="outline">
                {user.isPremium ? t('account.premium') : t('account.free')}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t('account.lastLogin')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user.lastLogin ? dateHelpers.formatDistance(user.lastLogin) : 'Unknown'}
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
export { EditableField, PreferencesSection }; 