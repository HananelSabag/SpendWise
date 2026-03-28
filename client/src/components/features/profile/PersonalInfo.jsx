/**
 * ✏️ PERSONAL INFO — Clean list-style display
 * View mode: labeled rows with separators (no blending boxes)
 * Edit mode: clear input fields with blue border focus
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Link, FileText,
  Edit3, Save, X, CheckCircle, AlertCircle
} from 'lucide-react';

import { useTranslation, useNotifications } from '../../../stores';
import { Button, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

// ── Field Row ─────────────────────────────────────────────────────────────────

const FieldRow = ({ label, value, icon: Icon, placeholder, isEditing, onChange, type = 'text', readOnly = false, required = false, maxLength }) => {
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => { setLocalVal(value || ''); }, [value]);

  const handleChange = (e) => {
    setLocalVal(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <div className="py-3.5 border-b border-gray-100 dark:border-gray-700/70 last:border-0">
      {/* Label */}
      <div className="flex items-center gap-1 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {readOnly && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            Read only
          </span>
        )}
      </div>

      {/* Value / Input */}
      {isEditing && !readOnly ? (
        <input
          type={type}
          value={localVal}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'w-full px-3 py-2 rounded-xl text-sm',
            'bg-white dark:bg-gray-700',
            'border-2 border-blue-300 dark:border-blue-600',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:border-blue-500 dark:focus:border-blue-400',
            'ring-0 focus:ring-2 focus:ring-blue-500/20',
            'transition-colors'
          )}
        />
      ) : (
        <p className={cn(
          'text-sm font-medium pl-0.5',
          value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'
        )}>
          {value || placeholder}
        </p>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────

const PersonalInfo = ({ user = {}, onUpdate, isUpdating = false, className = '' }) => {
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  const [personalData, setPersonalData] = useState({
    first_name: user.first_name || user.firstName || '',
    last_name:  user.last_name  || user.lastName  || '',
    email:      user.email      || '',
    phone:      user.phone      || '',
    bio:        user.bio        || '',
    location:   user.location   || user.address   || '',
    website:    user.website    || '',
    birthday:   user.birthday   || user.dateOfBirth || '',
  });

  const [originalData, setOriginalData] = useState({ ...personalData });
  const [isEditing, setIsEditing]       = useState(false);

  useEffect(() => {
    const newData = {
      first_name: user.first_name || user.firstName || '',
      last_name:  user.last_name  || user.lastName  || '',
      email:      user.email      || '',
      phone:      user.phone      || '',
      bio:        user.bio        || '',
      location:   user.location   || user.address   || '',
      website:    user.website    || '',
      birthday:   user.birthday   || user.dateOfBirth || '',
    };
    setPersonalData(newData);
    setOriginalData(newData);
  }, [user]);

  const update = useCallback((field, value) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const changed = {};
    Object.keys(personalData).forEach(k => {
      if (personalData[k] !== originalData[k]) changed[k] = personalData[k];
    });
    if (Object.keys(changed).length === 0) { setIsEditing(false); return; }
    try {
      await onUpdate?.(changed);
      setOriginalData(personalData);
      setIsEditing(false);
      addNotification({ type: 'success', message: t('personal.profileUpdated', { fallback: 'Profile updated!' }), duration: 3000 });
    } catch {
      setPersonalData(originalData);
      addNotification({ type: 'error', message: t('personal.updateFailed', { fallback: 'Update failed' }), duration: 4000 });
    }
  }, [personalData, originalData, onUpdate, addNotification, t]);

  const handleCancel = useCallback(() => {
    setPersonalData(originalData);
    setIsEditing(false);
  }, [originalData]);

  if (!user || !user.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Personal info card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">

        {/* Card header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b',
          isEditing
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50'
        )}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('personal.title', { fallback: 'Personal Information' })}
            </h3>
            {isEditing && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full font-medium">
                Editing
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user.email_verified ? 'success' : 'secondary'} size="sm">
              {user.email_verified
                ? <><CheckCircle className="w-3 h-3 mr-1" />{t('personal.verified', { fallback: 'Verified' })}</>
                : <><AlertCircle className="w-3 h-3 mr-1" />{t('personal.unverified', { fallback: 'Unverified' })}</>}
            </Badge>
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdating}
                  className="h-7 px-2.5 text-xs">
                  <X className="w-3.5 h-3.5 mr-1" />Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}
                  className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}
                className="h-7 px-2.5 text-xs">
                <Edit3 className="w-3.5 h-3.5 mr-1" />Edit
              </Button>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <FieldRow
              label={t('personal.firstName', { fallback: 'First Name' })}
              value={personalData.first_name}
              onChange={v => update('first_name', v)}
              icon={User}
              placeholder={t('personal.firstNamePlaceholder', { fallback: 'Your first name' })}
              maxLength={100}
              isEditing={isEditing}
            />
            <FieldRow
              label={t('personal.lastName', { fallback: 'Last Name' })}
              value={personalData.last_name}
              onChange={v => update('last_name', v)}
              icon={User}
              placeholder={t('personal.lastNamePlaceholder', { fallback: 'Your last name' })}
              maxLength={100}
              isEditing={isEditing}
            />
            <FieldRow
              label={t('personal.email', { fallback: 'Email' })}
              value={personalData.email}
              icon={Mail}
              placeholder={t('personal.noEmail')}
              isEditing={isEditing}
              readOnly
              required
            />
            <FieldRow
              label={t('personal.phone', { fallback: 'Phone' })}
              value={personalData.phone}
              onChange={v => update('phone', v)}
              type="tel"
              icon={Phone}
              placeholder={t('personal.phonePlaceholder', { fallback: '+1 234 567 8900' })}
              maxLength={20}
              isEditing={isEditing}
            />
            <FieldRow
              label={t('personal.birthday', { fallback: 'Birthday' })}
              value={personalData.birthday}
              onChange={v => update('birthday', v)}
              type="date"
              icon={Calendar}
              placeholder={t('personal.notSet')}
              isEditing={isEditing}
            />
            <FieldRow
              label={t('personal.location', { fallback: 'Location' })}
              value={personalData.location}
              onChange={v => update('location', v)}
              icon={MapPin}
              placeholder={t('personal.locationPlaceholder', { fallback: 'City, Country' })}
              maxLength={255}
              isEditing={isEditing}
            />
          </div>

          {/* Full-width fields */}
          <FieldRow
            label={t('personal.website', { fallback: 'Website' })}
            value={personalData.website}
            onChange={v => update('website', v)}
            type="url"
            icon={Link}
            placeholder="https://your-website.com"
            isEditing={isEditing}
          />
          <FieldRow
            label={t('personal.bio', { fallback: 'Bio' })}
            value={personalData.bio}
            onChange={v => update('bio', v)}
            icon={FileText}
            placeholder={t('personal.bioPlaceholder', { fallback: 'Tell us about yourself...' })}
            maxLength={500}
            isEditing={isEditing}
          />
        </div>
      </div>

      {/* Account info card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('account.title', { fallback: 'Account Information' })}
          </h3>
        </div>
        <div className="px-5">
          <div className="py-3.5 border-b border-gray-100 dark:border-gray-700/70">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('account.memberSince', { fallback: 'Member Since' })}
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </p>
              <Badge variant="outline">
                {user.role === 'admin' ? t('account.admin', { fallback: 'Admin' }) : t('account.user', { fallback: 'User' })}
              </Badge>
            </div>
          </div>
          <div className="py-3.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('account.lastLogin', { fallback: 'Last Login' })}
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1.5">
              {(user.last_login_at || user.last_login || user.lastLoginAt || user.lastLogin)
                ? new Date(user.last_login_at || user.last_login || user.lastLoginAt || user.lastLogin).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
