/**
 * ✏️ PERSONAL INFO — Controlled form with proper labels and textarea for bio
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  User, Mail,
  Edit3, Save, X, CheckCircle, AlertCircle
} from 'lucide-react';

import { useTranslation, useNotifications } from '../../../stores';
import { Button, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

// ── Field Row — fully controlled, no local state ──────────────────────────────

const FieldRow = ({
  label, value, icon: Icon, placeholder,
  isEditing, onChange, type = 'text',
  readOnly = false, required = false,
  maxLength, multiline = false,
  id
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const sharedInputClass = cn(
    'w-full px-3 py-2 rounded-xl text-sm',
    'bg-white dark:bg-gray-700/80',
    'border-2 border-indigo-300 dark:border-indigo-600',
    'text-gray-900 dark:text-white',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400',
    'focus:ring-2 focus:ring-indigo-500/20',
    'transition-colors duration-150'
  );

  return (
    <div className="py-3.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />}
        <label
          htmlFor={isEditing && !readOnly ? inputId : undefined}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-default"
        >
          {label}
          {required && <span className="text-red-500 ms-0.5">*</span>}
        </label>
        {readOnly && (
          <span className="ms-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">
            Read only
          </span>
        )}
      </div>

      {isEditing && !readOnly ? (
        multiline ? (
          <textarea
            id={inputId}
            value={value || ''}
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            className={cn(sharedInputClass, 'resize-none leading-relaxed')}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            value={value || ''}
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className={sharedInputClass}
          />
        )
      ) : (
        <p className={cn(
          'text-sm font-medium ps-0.5',
          value
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-gray-500 italic'
        )}>
          {value || placeholder}
        </p>
      )}

      {isEditing && maxLength && (value?.length ?? 0) > 0 && (
        <p className="text-end text-xs text-gray-400 mt-1">
          {value?.length ?? 0}/{maxLength}
        </p>
      )}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const PersonalInfo = ({ user = {}, onUpdate, isUpdating = false, className = '' }) => {
  const { t, isRTL } = useTranslation('profile');
  const { addNotification } = useNotifications();

  const buildData = (u) => ({
    first_name: u.first_name || u.firstName || '',
    last_name:  u.last_name  || u.lastName  || '',
    email:      u.email      || '',
  });

  const [personalData, setPersonalData] = useState(() => buildData(user));
  const [originalData, setOriginalData] = useState(() => buildData(user));
  const [isEditing, setIsEditing]       = useState(false);
  const [isSaving, setIsSaving]         = useState(false);

  useEffect(() => {
    const d = buildData(user);
    setPersonalData(d);
    setOriginalData(d);
  }, [user.email, user.first_name, user.last_name]);

  const isDirty = Object.keys(personalData).some(k => personalData[k] !== originalData[k]);

  const update = useCallback((field, value) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const changed = {};
    Object.keys(personalData).forEach(k => {
      if (personalData[k] !== originalData[k]) changed[k] = personalData[k];
    });
    if (Object.keys(changed).length === 0) { setIsEditing(false); return; }

    setIsSaving(true);
    try {
      await onUpdate?.(changed);
      setOriginalData(personalData);
      setIsEditing(false);
      addNotification({ type: 'success', message: t('personal.profileUpdated', { fallback: 'Profile updated!' }), duration: 3000 });
    } catch {
      setPersonalData(originalData);
      addNotification({ type: 'error', message: t('personal.updateFailed', { fallback: 'Update failed' }), duration: 4000 });
    } finally {
      setIsSaving(false);
    }
  }, [personalData, originalData, onUpdate, addNotification, t]);

  const handleCancel = useCallback(() => {
    setPersonalData(originalData);
    setIsEditing(false);
  }, [originalData]);

  if (!user?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* ── Personal info card ─────────────────────────────────── */}
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm overflow-hidden transition-colors duration-200',
        isEditing
          ? 'border-indigo-200 dark:border-indigo-700/60 shadow-indigo-100 dark:shadow-indigo-900/20'
          : 'border-gray-100 dark:border-gray-700/50'
      )}>

        {/* Card header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b transition-colors duration-200',
          isEditing
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50'
            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50'
        )}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {t('personal.title', { fallback: 'Personal Information' })}
            </h3>
            {isEditing && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full font-semibold">
                Editing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={user.email_verified ? 'success' : 'secondary'} size="sm">
              {user.email_verified
                ? <><CheckCircle className="w-3 h-3 me-1" />{t('personal.verified', { fallback: 'Verified' })}</>
                : <><AlertCircle className="w-3 h-3 me-1" />{t('personal.unverified', { fallback: 'Unverified' })}</>}
            </Badge>

            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="h-7 px-2.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className={cn(
                    'h-7 px-2.5 text-xs font-semibold rounded-lg text-white transition-all duration-150 cursor-pointer flex items-center gap-1',
                    isDirty && !isSaving
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30'
                      : 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed opacity-60'
                  )}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="h-7 px-2.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-150 cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Fields grid */}
        <div className="px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <FieldRow
              id="first-name"
              label={t('personal.firstName', { fallback: 'First Name' })}
              value={personalData.first_name}
              onChange={v => update('first_name', v)}
              icon={User}
              placeholder={t('personal.firstNamePlaceholder', { fallback: 'Your first name' })}
              maxLength={100}
              isEditing={isEditing}
            />
            <FieldRow
              id="last-name"
              label={t('personal.lastName', { fallback: 'Last Name' })}
              value={personalData.last_name}
              onChange={v => update('last_name', v)}
              icon={User}
              placeholder={t('personal.lastNamePlaceholder', { fallback: 'Your last name' })}
              maxLength={100}
              isEditing={isEditing}
            />
            <FieldRow
              id="email"
              label={t('personal.email', { fallback: 'Email' })}
              value={personalData.email}
              icon={Mail}
              placeholder={t('personal.noEmail')}
              isEditing={isEditing}
              readOnly
              required
            />
          </div>
        </div>
      </div>

      {/* ── Account info card ──────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('account.title', { fallback: 'Account Information' })}
          </h3>
        </div>
        <div className="px-5">
          <div className="py-3.5 border-b border-gray-100 dark:border-gray-700/70">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('account.memberSince', { fallback: 'Member Since' })}
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </p>
              <Badge variant="outline">
                {user.role === 'admin'
                  ? t('account.admin', { fallback: 'Admin' })
                  : t('account.user',  { fallback: 'User' })}
              </Badge>
            </div>
          </div>
          <div className="py-3.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
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
