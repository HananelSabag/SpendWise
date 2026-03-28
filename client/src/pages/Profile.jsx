/**
 * 👤 PROFILE PAGE — Clean rebuild
 * Mobile: top tabs + scrollable. Desktop: sidebar + content panel.
 * All functionality preserved: personal info, preferences, security, export.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  User, Settings, Shield, Download, Camera,
  Eye, EyeOff, FileSpreadsheet, Braces, FileText,
  X, Check, Loader2, AlertTriangle
} from 'lucide-react';

import {
  useAuth, useAuthStore,
  useTranslation, useTranslationStore,
  useNotifications, useAppStore
} from '../stores';
import { useAuthToasts } from '../hooks/useAuthToasts';
import { useIsMobile } from '../hooks/useIsMobile';
import { Button, Input, Avatar, LoadingSpinner } from '../components/ui';
import PersonalInfo from '../components/features/profile/PersonalInfo';
import AuthStatusDetector from '../components/features/auth/AuthStatusDetector';
import useExport from '../hooks/useExport';
import { api } from '../api';
import { cn } from '../utils/helpers';

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'personal',     icon: User,     labelKey: 'tabs.personal'     },
  { id: 'preferences',  icon: Settings, labelKey: 'tabs.preferences'  },
  { id: 'security',     icon: Shield,   labelKey: 'tabs.security'     },
  { id: 'export',       icon: Download, labelKey: 'tabs.export'       },
];

// ── Avatar Section ────────────────────────────────────────────────────────────

const AvatarSection = ({ user, authToasts }) => {
  const [uploading, setUploading]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview]       = useState(null); // { url, file, finalSizeMB, originalSizeMB, wasCompressed }
  const fileInputRef                = useRef(null);
  const { t } = useTranslation('profile');

  // Cleanup object URL when dialog closes
  useEffect(() => {
    return () => { if (preview?.url) URL.revokeObjectURL(preview.url); };
  }, []); // eslint-disable-line

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ''; // reset so same file can be re-selected
    if (!file) return;

    const { validateImageFile, processImageForUpload } = await import('../utils/imageProcessor');

    // Pre-validation: allow up to 50MB (Live Photos / Motion Photos embed video data)
    const validation = validateImageFile(file, { maxSizeMB: 50 });
    if (!validation.valid) {
      authToasts.toast?.error(validation.error);
      return;
    }

    setProcessing(true);
    try {
      const { file: processed, originalSize, newSize } = await processImageForUpload(file, {
        maxSizeMB: 5, maxWidthOrHeight: 2048, quality: 0.85,
      });

      const finalSizeMB = processed.size / (1024 * 1024);
      if (finalSizeMB > 20) {
        authToasts.toast?.error(t('personal.imageTooLargeAfterCompression', { size: finalSizeMB.toFixed(1) }) || `Image too large after compression (${finalSizeMB.toFixed(1)}MB). Please choose a smaller image.`);
        return;
      }

      const previewUrl = URL.createObjectURL(processed);
      setPreview({
        url: previewUrl,
        file: processed,
        finalSizeMB: finalSizeMB.toFixed(1),
        originalSizeMB: (originalSize / 1024 / 1024).toFixed(1),
        wasCompressed: newSize < originalSize * 0.95,
      });
    } catch {
      authToasts.toast?.error(t('personal.imageProcessingFailed') || 'Failed to process image. Please try another photo.');
    } finally {
      setProcessing(false);
    }
  }, [authToasts]);

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
        {/* Avatar + camera button */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/40">
            <Avatar
              src={user?.avatar}
              alt={user?.name || user?.email}
              size="xl"
              fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              className="w-full h-full"
            />
          </div>
          {/* Loading overlay */}
          {busy && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          {/* Camera trigger */}
          <label className={cn(
            'absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center',
            'shadow-md border-2 border-white dark:border-gray-800 transition-colors cursor-pointer',
            busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
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
            {t('personal.memberSince') || 'Member since'} {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </p>
          {processing && (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('personal.processingImage') || 'Processing image…'}
            </p>
          )}
        </div>
      </div>

      {/* ── Preview / Confirm dialog ───────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancelPreview}
          />

          {/* Sheet */}
          <div className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pb-8 pt-5">
            {/* Mobile drag handle */}
            <div className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('personal.changePhoto') || 'Change Photo'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('personal.newPhotoDesc') || 'This will be your new profile picture'}
                </p>
              </div>
              <button
                onClick={handleCancelPreview}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Preview image */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <img
                  src={preview.url}
                  alt={t('personal.previewAlt')}
                  className="w-36 h-36 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/40 shadow-xl"
                />
                {preview.wasCompressed && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md">
                    {t('personal.optimized')}
                  </span>
                )}
              </div>
            </div>

            {/* Size info */}
            <div className="flex justify-center mb-6">
              {preview.wasCompressed ? (
                <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="line-through text-gray-400">{preview.originalSizeMB}MB</span>
                  <span>→</span>
                  <span className="font-semibold">{preview.finalSizeMB}MB</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">{preview.finalSizeMB}MB</span>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCancelPreview}
                className="flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                {t('actions.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleConfirmUpload}
                className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                {t('personal.setPhoto') || 'Set Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Preferences Tab ───────────────────────────────────────────────────────────

// Defined at module level so React sees a stable component reference across renders.
// If defined inside PreferencesTab, React would remount all <select> elements on
// every re-render because the component identity would change each time.
const Row = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const PreferencesTab = ({ user, authToasts }) => {
  const { updateProfile } = useAuth();
  const { t } = useTranslation('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    language_preference: user?.language_preference || 'en',
    theme_preference:    user?.theme_preference    || 'system',
    currency_preference: user?.currency_preference || 'ILS',
  });

  useEffect(() => {
    if (user) setPrefs({ language_preference: user.language_preference || 'en', theme_preference: user.theme_preference || 'system', currency_preference: user.currency_preference || 'ILS' });
  }, [user?.language_preference, user?.theme_preference, user?.currency_preference]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile(prefs);
      if (!result.success) throw new Error(result.error?.message);

      // Apply theme immediately
      if (prefs.theme_preference === 'dark')       document.documentElement.classList.add('dark');
      else if (prefs.theme_preference === 'light')  document.documentElement.classList.remove('dark');
      else { document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches); }

      // Apply language immediately
      if (prefs.language_preference !== user?.language_preference) {
        useTranslationStore.getState().actions?.setLanguage?.(prefs.language_preference);
      }
      // Apply currency immediately
      if (prefs.currency_preference !== user?.currency_preference) {
        useAppStore.getState().actions?.setCurrency?.(prefs.currency_preference);
      }

      await useAuthStore.getState().actions?.getProfile?.();
      authToasts.preferencesUpdated?.();
    } catch {
      authToasts.profileUpdateFailed?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-2">
        <Row label={t('preferences.language.language') || 'Language'} value={prefs.language_preference} onChange={v => setPrefs(p => ({...p, language_preference: v}))}
          options={[{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית (Hebrew)' }]} />
        <Row label={t('preferences.display.theme') || 'Theme'} value={prefs.theme_preference} onChange={v => setPrefs(p => ({...p, theme_preference: v}))}
          options={[{ value: 'system', label: t('preferences.themeOptions.system') || 'System' }, { value: 'light', label: t('preferences.themeOptions.light') || 'Light' }, { value: 'dark', label: t('preferences.themeOptions.dark') || 'Dark' }]} />
        <Row label={t('preferences.language.currency') || 'Currency'} value={prefs.currency_preference} onChange={v => setPrefs(p => ({...p, currency_preference: v}))}
          options={[{ value: 'ILS', label: '₪ Israeli Shekel' }, { value: 'USD', label: '$ US Dollar' }, { value: 'EUR', label: '€ Euro' }, { value: 'GBP', label: '£ British Pound' }, { value: 'JPY', label: '¥ Japanese Yen' }, { value: 'CAD', label: 'C$ Canadian Dollar' }, { value: 'AUD', label: 'A$ Australian Dollar' }]} />
      </div>
      <Button onClick={handleSave} isLoading={isLoading} disabled={isLoading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
        {t('preferences.savePreferences') || 'Save Preferences'}
      </Button>
    </div>
  );
};

// ── Security Tab ──────────────────────────────────────────────────────────────

const SecurityTab = ({ authToasts }) => {
  const { t } = useTranslation('profile');
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
    if (form.newPassword.length < 8) { authToasts.passwordTooShort?.(); return; }
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

  return (
    <div className="space-y-4">
      <AuthStatusDetector />
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {isGoogleOnly ? (t('security.setPassword') || 'Set Password') : (t('security.password.title') || 'Change Password')}
        </h3>

        {isGoogleOnly && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
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
                onChange={e => setForm(p => ({...p, currentPassword: e.target.value}))}
                className="pr-10"
              />
              <button onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder={t('security.newPasswordPlaceholder') || 'New password (min. 8 chars, letter + number)'}
              value={form.newPassword}
              onChange={e => setForm(p => ({...p, newPassword: e.target.value}))}
              className="pr-10"
            />
            <button onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            type="password"
            placeholder={t('security.confirmPasswordPlaceholder') || 'Confirm new password'}
            value={form.confirmPassword}
            onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))}
          />
        </div>

        <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
          {isGoogleOnly ? (t('security.setPassword') || 'Set Password') : (t('security.updatePassword') || 'Update Password')}
        </Button>
      </div>
    </div>
  );
};

// ── Export Tab ────────────────────────────────────────────────────────────────

const ExportTab = ({ t }) => {
  const { exportAsCSV, exportAsJSON, exportAsPDF, isExporting } = useExport();

  const exports = [
    { label: t('export.csvLabel') || 'Export as CSV',  desc: t('export.csvDesc') || 'Spreadsheet format for Excel / Google Sheets', icon: FileSpreadsheet, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', action: exportAsCSV },
    { label: t('export.jsonLabel') || 'Export as JSON', desc: t('export.jsonDesc') || 'Raw data format for developers',               icon: Braces,          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',  action: exportAsJSON },
    { label: t('export.pdfLabel') || 'Export as PDF',  desc: t('export.pdfDesc') || 'Formatted report ready to print or share',      icon: FileText,        color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',   action: exportAsPDF  },
  ];

  return (
    <div className="space-y-3">
      {exports.map(({ label, desc, icon: Icon, color, action }) => (
        <button key={label} onClick={action} disabled={isExporting}
          className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left disabled:opacity-50">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color.split(' ').slice(1).join(' '))}>
            <Icon className={cn('w-5 h-5', color.split(' ')[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
          </div>
          {isExporting ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
        </button>
      ))}
    </div>
  );
};

// ── Tab navigation ────────────────────────────────────────────────────────────

const HorizontalTabs = ({ active, onChange, t }) => (
  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
    {TABS.map(tab => {
      const Icon = tab.icon;
      const isActive = active === tab.id;
      return (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-all',
            isActive
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          )}>
          <Icon className="w-4 h-4" />
          <span className="whitespace-nowrap leading-tight">{t(tab.labelKey, tab.id)}</span>
        </button>
      );
    })}
  </div>
);

const SidebarTabs = ({ active, onChange, t }) => (
  <div className="w-44 shrink-0 space-y-0.5">
    {TABS.map(tab => {
      const Icon = tab.icon;
      const isActive = active === tab.id;
      return (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
            isActive
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          )}>
          <Icon className="w-4 h-4 shrink-0" />
          <span>{t(tab.labelKey, tab.id)}</span>
        </button>
      );
    })}
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation('profile');
  const authToasts = useAuthToasts();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('personal');

  const tabContent = (() => {
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
  })();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Mobile header */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('page.title') || 'Profile'}</h1>
          </div>
          <HorizontalTabs active={activeTab} onChange={setActiveTab} t={t} />
        </div>
        <div className="px-4 py-4">{tabContent}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('tabs.accountSettings') || 'Account Settings'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('tabs.accountSettingsDesc') || 'Manage your profile and preferences'}
          </p>
        </div>
        <div className="flex gap-8">
          <SidebarTabs active={activeTab} onChange={setActiveTab} t={t} />
          <div className="flex-1 min-w-0">{tabContent}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
