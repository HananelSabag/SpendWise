/**
 * 👤 PROFILE PAGE
 * Mobile: sticky top tabs + scrollable content.
 * Desktop: sidebar + content panel with gradient background.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  User, Settings, Shield, Download, Camera,
  Eye, EyeOff, FileSpreadsheet, Braces, FileText,
  X, Check, Loader2, AlertTriangle, ChevronDown, LogOut
} from 'lucide-react';

import {
  useAuth, useAuthStore,
  useTranslation, useTranslationStore,
  useNotifications, useAppStore
} from '../stores';
import { useAuthToasts } from '../hooks/useAuthToasts';
import { useIsMobile } from '../hooks/useIsMobile';
import { Button, Input, Avatar, LoadingSpinner, PageSkeleton } from '../components/ui';
import PersonalInfo from '../components/features/profile/PersonalInfo';
import AuthStatusDetector from '../components/features/auth/AuthStatusDetector';
import useExport from '../hooks/useExport';
import { api } from '../api';
import { cn } from '../utils/helpers';

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'personal',    icon: User,     labelKey: 'tabs.personal'    },
  { id: 'preferences', icon: Settings, labelKey: 'tabs.preferences' },
  { id: 'security',    icon: Shield,   labelKey: 'tabs.security'    },
  { id: 'export',      icon: Download, labelKey: 'tabs.export'      },
];

// ── Avatar Section ────────────────────────────────────────────────────────────

const AvatarSection = ({ user, authToasts }) => {
  const [uploading, setUploading]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview]       = useState(null);
  const [viewOpen, setViewOpen]     = useState(false);
  const fileInputRef                = useRef(null);
  const { t }                       = useTranslation('profile');
  const isMobile                    = useIsMobile();

  useEffect(() => {
    return () => { if (preview?.url) URL.revokeObjectURL(preview.url); };
  }, []); // eslint-disable-line

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    const { validateImageFile, processImageForUpload } = await import('../utils/imageProcessor');
    const validation = validateImageFile(file, { maxSizeMB: 50 });
    if (!validation.valid) { authToasts.toast?.error(validation.error); return; }

    setProcessing(true);
    try {
      const { file: processed, originalSize, newSize } = await processImageForUpload(file, {
        maxSizeMB: 5, maxWidthOrHeight: 2048, quality: 0.85,
      });
      const finalSizeMB = processed.size / (1024 * 1024);
      if (finalSizeMB > 20) {
        authToasts.toast?.error(`Image too large after compression (${finalSizeMB.toFixed(1)}MB).`); return;
      }
      setPreview({
        url: URL.createObjectURL(processed),
        file: processed,
        finalSizeMB: finalSizeMB.toFixed(1),
        originalSizeMB: (originalSize / 1024 / 1024).toFixed(1),
        wasCompressed: newSize < originalSize * 0.95,
      });
    } catch {
      authToasts.toast?.error(t('personal.imageProcessingFailed') || 'Failed to process image.');
    } finally {
      setProcessing(false);
    }
  }, [authToasts, t]);

  const handleConfirmUpload = useCallback(async () => {
    if (!preview?.file) return;
    const fileToUpload = preview.file;
    const urlToRevoke  = preview.url;
    setPreview(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', fileToUpload);
      const res = await api.users.uploadAvatar(formData);
      if (res.success) {
        const url = res.data?.data?.url || res.data?.url;
        useAuthStore.setState({ user: { ...useAuthStore.getState().user, avatar: url, avatar_url: url } });
        document.querySelectorAll('img').forEach(img => {
          if (img.src?.includes('supabase') || img.alt === 'Profile') img.src = url + '?t=' + Date.now();
        });
        authToasts.avatarUploaded?.();
      } else {
        authToasts.avatarUploadFailed?.();
      }
    } catch {
      authToasts.avatarUploadFailed?.();
    } finally {
      setUploading(false);
      URL.revokeObjectURL(urlToRevoke);
    }
  }, [preview, authToasts]);

  const handleCancelPreview = useCallback(() => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }, [preview]);

  const busy = uploading || processing;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        {/* Avatar + camera */}
        <div className="relative shrink-0">
          <button
            onClick={() => !busy && setViewOpen(true)}
            disabled={busy}
            className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-indigo-100 dark:ring-indigo-900/40 focus:outline-none focus:ring-indigo-400 cursor-pointer block transition-opacity hover:opacity-90"
            aria-label={t('personal.viewPhoto') || 'View profile picture'}
          >
            <Avatar
              src={user?.avatar}
              alt={user?.name || user?.email}
              size="xl"
              fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              className="w-full h-full"
            />
          </button>
          {busy && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          <label className={cn(
            'absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center',
            'shadow-md border-2 border-white dark:border-gray-800 transition-colors duration-150',
            busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
          )}>
            <Camera className="w-3.5 h-3.5 text-white" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={busy}
            />
          </label>
        </div>

        {/* User info */}
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {user?.name || user?.email?.split('@')[0]}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {t('personal.memberSince') || 'Member since'}{' '}
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </p>
          {processing && (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('personal.processingImage') || 'Processing image…'}
            </p>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      {preview && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancelPreview} />
          <div className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pb-8 pt-5">
            <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('personal.changePhoto') || 'Change Photo'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('personal.newPhotoDesc') || 'This will be your new profile picture'}</p>
              </div>
              <button onClick={handleCancelPreview} aria-label="Close" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer ml-3">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center mb-5">
              <div className="relative">
                <img src={preview.url} alt={t('personal.previewAlt') || 'Preview'} className="w-36 h-36 rounded-full object-cover ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-xl" />
                {preview.wasCompressed && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
                    {t('personal.optimized') || 'Optimized'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-center mb-6">
              {preview.wasCompressed ? (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="line-through text-gray-400">{preview.originalSizeMB}MB</span>
                  <span>→</span>
                  <span className="font-semibold">{preview.finalSizeMB}MB</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">{preview.finalSizeMB}MB</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCancelPreview} className="flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <X className="w-4 h-4" />{t('actions.cancel') || 'Cancel'}
              </button>
              <button onClick={handleConfirmUpload} className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all cursor-pointer active:scale-95">
                <Check className="w-4 h-4" />{t('personal.setPhoto') || 'Set Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View photo dialog */}
      {viewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewOpen(false)} />
          <div className={cn(
            'relative z-10 w-full bg-white dark:bg-gray-900 shadow-2xl',
            isMobile ? 'rounded-t-3xl px-6 pb-8 pt-5' : 'sm:max-w-sm sm:rounded-2xl px-6 pb-8 pt-5'
          )}>
            {isMobile && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('personal.profilePhoto') || 'Profile Photo'}</h3>
              <button onClick={() => setViewOpen(false)} aria-label="Close" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-2xl">
                <Avatar src={user?.avatar} alt={user?.name || user?.email} size="xl" fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()} className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
              {user?.name || user?.email?.split('@')[0]}
            </p>
            <label className="flex items-center justify-center gap-2 h-12 rounded-2xl cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
              <Camera className="w-4 h-4" />
              {t('personal.changePhoto') || 'Change Photo'}
              <input type="file" accept="image/*,.heic,.heif" className="hidden" disabled={busy}
                onChange={(e) => { setViewOpen(false); handleFileSelect(e); }} />
            </label>
          </div>
        </div>
      )}
    </>
  );
};

// ── Preferences Tab ───────────────────────────────────────────────────────────

const Row = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 gap-4">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{label}</span>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm pl-3 pr-8 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none cursor-pointer appearance-none transition-colors duration-150"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

const PreferencesTab = ({ user, authToasts }) => {
  const { updateProfile } = useAuth();
  const { t }             = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);

  const buildPrefs = (u) => ({
    language_preference: u?.language_preference || 'en',
    theme_preference:    u?.theme_preference    || 'system',
    currency_preference: u?.currency_preference || 'ILS',
  });

  const [prefs, setPrefs]       = useState(() => buildPrefs(user));
  const [original, setOriginal] = useState(() => buildPrefs(user));

  useEffect(() => {
    const p = buildPrefs(user);
    setPrefs(p);
    setOriginal(p);
  }, [user?.language_preference, user?.theme_preference, user?.currency_preference]);

  const isDirty = Object.keys(prefs).some(k => prefs[k] !== original[k]);

  const handleSave = async () => {
    if (!isDirty) return;
    setIsLoading(true);
    try {
      const result = await updateProfile(prefs);
      if (!result.success) throw new Error(result.error?.message);

      if (prefs.theme_preference === 'dark')      document.documentElement.classList.add('dark');
      else if (prefs.theme_preference === 'light') document.documentElement.classList.remove('dark');
      else document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (prefs.language_preference !== user?.language_preference)
        useTranslationStore.getState().actions?.setLanguage?.(prefs.language_preference);
      if (prefs.currency_preference !== user?.currency_preference)
        useAppStore.getState().actions?.setCurrency?.(prefs.currency_preference);

      await useAuthStore.getState().actions?.getProfile?.();
      setOriginal(prefs);
      authToasts.preferencesUpdated?.();
    } catch {
      authToasts.profileUpdateFailed?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm px-5 py-2 transition-colors duration-200',
        isDirty ? 'border-indigo-200 dark:border-indigo-700/60' : 'border-gray-100 dark:border-gray-700'
      )}>
        <Row
          label={t('preferences.language.language') || 'Language'}
          value={prefs.language_preference}
          onChange={v => setPrefs(p => ({ ...p, language_preference: v }))}
          options={[{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית (Hebrew)' }]}
        />
        <Row
          label={t('preferences.display.theme') || 'Theme'}
          value={prefs.theme_preference}
          onChange={v => setPrefs(p => ({ ...p, theme_preference: v }))}
          options={[
            { value: 'system', label: t('preferences.themeOptions.system') || 'System' },
            { value: 'light',  label: t('preferences.themeOptions.light')  || 'Light'  },
            { value: 'dark',   label: t('preferences.themeOptions.dark')   || 'Dark'   },
          ]}
        />
        <Row
          label={t('preferences.language.currency') || 'Currency'}
          value={prefs.currency_preference}
          onChange={v => setPrefs(p => ({ ...p, currency_preference: v }))}
          options={[
            { value: 'ILS', label: '₪ Israeli Shekel'   },
            { value: 'USD', label: '$ US Dollar'         },
            { value: 'EUR', label: '€ Euro'              },
            { value: 'GBP', label: '£ British Pound'     },
            { value: 'JPY', label: '¥ Japanese Yen'      },
            { value: 'CAD', label: 'C$ Canadian Dollar'  },
            { value: 'AUD', label: 'A$ Australian Dollar'},
          ]}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isLoading || !isDirty}
        className={cn(
          'h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-150 flex items-center gap-2',
          isDirty && !isLoading
            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 cursor-pointer'
            : 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed opacity-60'
        )}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('preferences.savePreferences') || 'Save Preferences'}
      </button>
    </div>
  );
};

// ── Security Tab ──────────────────────────────────────────────────────────────

const SecurityTab = ({ authToasts }) => {
  const { t }        = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    api.authStatus.getAuthStatus().then(r => r.success && setAuthStatus(r.data));
  }, []);

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) { authToasts.passwordMismatch?.(); return; }
    if (form.newPassword.length < 8)               { authToasts.passwordTooShort?.(); return; }
    if (!/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
      authToasts.toast?.error?.('Password must include at least one letter and one number'); return;
    }

    setIsLoading(true);
    try {
      const statusCheck = await api.authStatus.getAuthStatus();
      const isGoogleOnly = statusCheck.success && statusCheck.data.authType === 'GOOGLE_ONLY';
      const result = isGoogleOnly
        ? await api.auth.setPassword({ newPassword: form.newPassword })
        : await api.auth.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });

      if (!result.success) throw new Error(result.error?.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await useAuthStore.getState().actions?.getProfile?.();
      const updated = await api.authStatus.getAuthStatus();
      if (updated.success) setAuthStatus(updated.data);
      authToasts.passwordChanged?.();
    } catch (err) {
      authToasts.passwordChangeFailed?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isGoogleOnly = authStatus?.authType === 'GOOGLE_ONLY';

  const eyeBtn = (show, toggle, label) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 cursor-pointer"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <AuthStatusDetector />
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {isGoogleOnly
            ? (t('security.setPassword')    || 'Set Password')
            : (t('security.password.title') || 'Change Password')}
        </h3>

        {isGoogleOnly && (
          <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm text-indigo-700 dark:text-indigo-300">
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{t('security.googleSignInNote') || 'You signed in with Google. You can add a password to also sign in with email.'}</span>
          </div>
        )}

        <div className="space-y-3">
          {!isGoogleOnly && (
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                placeholder={t('security.currentPasswordPlaceholder') || 'Current password'}
                value={form.currentPassword}
                onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
                className="pr-10"
              />
              {eyeBtn(showCurrent, () => setShowCurrent(s => !s), showCurrent ? 'Hide current password' : 'Show current password')}
            </div>
          )}
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder={t('security.newPasswordPlaceholder') || 'New password (min. 8 chars, letter + number)'}
              value={form.newPassword}
              onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
              className="pr-10"
            />
            {eyeBtn(showNew, () => setShowNew(s => !s), showNew ? 'Hide new password' : 'Show new password')}
          </div>
          <Input
            type="password"
            placeholder={t('security.confirmPasswordPlaceholder') || 'Confirm new password'}
            value={form.confirmPassword}
            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="h-11 px-6 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isGoogleOnly
            ? (t('security.setPassword')    || 'Set Password')
            : (t('security.updatePassword') || 'Update Password')}
        </button>
      </div>
    </div>
  );
};

// ── Export Tab ────────────────────────────────────────────────────────────────

const ExportTab = ({ t }) => {
  const { exportAsCSV, exportAsJSON, exportAsPDF, isExporting } = useExport();

  const exports = [
    { label: t('export.csvLabel')  || 'Export as CSV',  desc: t('export.csvDesc')  || 'Spreadsheet format for Excel / Google Sheets', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', action: exportAsCSV  },
    { label: t('export.jsonLabel') || 'Export as JSON', desc: t('export.jsonDesc') || 'Raw data format for developers',               icon: Braces,          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',   action: exportAsJSON },
    { label: t('export.pdfLabel')  || 'Export as PDF',  desc: t('export.pdfDesc')  || 'Formatted report ready to print or share',     icon: FileText,        color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',             action: exportAsPDF  },
  ];

  return (
    <div className="space-y-3">
      {exports.map(({ label, desc, icon: Icon, color, action }) => (
        <button
          key={label}
          onClick={action}
          disabled={isExporting}
          className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-800 transition-all duration-150 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105', color.split(' ').slice(1).join(' '))}>
            <Icon className={cn('w-5 h-5', color.split(' ')[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
          </div>
          {isExporting
            ? <LoadingSpinner size="sm" />
            : <Download className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors duration-150" />}
        </button>
      ))}
    </div>
  );
};

// ── Tab navigation ────────────────────────────────────────────────────────────

const HorizontalTabs = ({ active, onChange, t }) => (
  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
    {TABS.map(tab => {
      const Icon     = tab.icon;
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
            isActive
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="whitespace-nowrap leading-tight">{t(tab.labelKey, tab.id)}</span>
        </button>
      );
    })}
  </div>
);

const SidebarTabs = ({ active, onChange, t, onLogout, tc }) => (
  <div className="w-48 shrink-0 space-y-0.5">
    {TABS.map(tab => {
      const Icon     = tab.icon;
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer',
            isActive
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{t(tab.labelKey, tab.id)}</span>
        </button>
      );
    })}
    <div className="pt-3 mt-1 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={onLogout}
        className={cn(
          'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer',
          'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        )}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>{tc?.('common.logout') || 'Logout'}</span>
      </button>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { t }        = useTranslation('profile');
  const { t: tc }    = useTranslation();
  const authToasts   = useAuthToasts();
  const isMobile     = useIsMobile();
  const [activeTab, setActiveTab] = useState('personal');

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'personal':
        return (
          <div>
            <AvatarSection user={user} authToasts={authToasts} />
            <PersonalInfo user={user} onUpdate={updateProfile} />
          </div>
        );
      case 'preferences':
        return <PreferencesTab user={user} authToasts={authToasts} />;
      case 'security':
        return <SecurityTab authToasts={authToasts} />;
      case 'export':
        return <ExportTab t={t} />;
      default:
        return null;
    }
  }, [activeTab, user, authToasts, updateProfile, t]);

  // Show skeleton when user data hasn't loaded yet (e.g. hard refresh)
  if (!user) return <PageSkeleton page="profile" />;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Mobile sticky header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('page.title') || 'Profile'}
            </h1>
          </div>
          <HorizontalTabs active={activeTab} onChange={setActiveTab} t={t} />
        </div>
        <div className="px-4 py-4 pb-4">{tabContent}</div>

        {/* Logout — bottom of profile page */}
        <div className="px-4 pb-28 pt-2">
          <button
            onClick={() => logout(true)}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl',
              'bg-white dark:bg-gray-800',
              'border border-red-100 dark:border-red-900/40',
              'text-red-600 dark:text-red-400 font-semibold text-sm',
              'shadow-sm active:scale-[0.98] transition-all duration-150'
            )}
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            {tc('common.logout') || 'Logout'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tabs.accountSettings') || 'Account Settings'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('tabs.accountSettingsDesc') || 'Manage your profile and preferences'}
          </p>
        </div>

        <div className="flex gap-8 items-start">
          <SidebarTabs active={activeTab} onChange={setActiveTab} t={t} onLogout={() => logout(true)} tc={tc} />
          <div className="flex-1 min-w-0">{tabContent}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
