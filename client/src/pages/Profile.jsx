/**
 * 👤 PROFILE PAGE — Clean rebuild
 * Mobile: top tabs + scrollable. Desktop: sidebar + content panel.
 * All functionality preserved: personal info, preferences, security, export.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  User, Settings, Shield, Download, Upload,
  Eye, EyeOff, FileSpreadsheet, Braces, FileText, CheckCircle
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
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { validateImageFile, processImageForUpload } = await import('../utils/imageProcessor');
    const validation = validateImageFile(file, { maxSizeMB: 10 });
    if (!validation.valid) { authToasts.toast?.error(validation.error); return; }

    setUploading(true);
    try {
      const { file: processed } = await processImageForUpload(file, { maxSizeMB: 5, maxWidthOrHeight: 2048, quality: 0.85 });
      const formData = new FormData();
      formData.append('profilePicture', processed);

      const res = await api.users.uploadAvatar(formData);
      if (res.success) {
        const url = res.data?.data?.url || res.data?.url;
        useAuthStore.setState({ user: { ...useAuthStore.getState().user, avatar: url, avatar_url: url } });
        // Refresh avatar images in DOM
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
      if (e.target) e.target.value = '';
    }
  }, [authToasts]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
      <div className="relative shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/40">
          <Avatar
            src={user?.avatar}
            alt={user?.name || user?.email}
            size="xl"
            fallback={(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            className="w-full h-full"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <LoadingSpinner size="sm" className="text-white" />
            </div>
          )}
        </div>
        <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white dark:border-gray-800 transition-colors">
          <Upload className="w-3.5 h-3.5 text-white" />
          <input type="file" accept="image/*,.heic,.heif" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || user?.email?.split('@')[0]}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
        </p>
      </div>
    </div>
  );
};

// ── Preferences Tab ───────────────────────────────────────────────────────────

const PreferencesTab = ({ user, authToasts }) => {
  const { updateProfile } = useAuth();
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

  const Row = ({ label, value, onChange, options }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-sm px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm px-5 py-2">
        <Row label="Language" value={prefs.language_preference} onChange={v => setPrefs(p => ({...p, language_preference: v}))}
          options={[{ value: 'en', label: 'English' }, { value: 'he', label: 'עברית (Hebrew)' }]} />
        <Row label="Theme" value={prefs.theme_preference} onChange={v => setPrefs(p => ({...p, theme_preference: v}))}
          options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <Row label="Currency" value={prefs.currency_preference} onChange={v => setPrefs(p => ({...p, currency_preference: v}))}
          options={[{ value: 'ILS', label: '₪ Israeli Shekel' }, { value: 'USD', label: '$ US Dollar' }, { value: 'EUR', label: '€ Euro' }, { value: 'GBP', label: '£ British Pound' }, { value: 'JPY', label: '¥ Japanese Yen' }, { value: 'CAD', label: 'C$ Canadian Dollar' }, { value: 'AUD', label: 'A$ Australian Dollar' }]} />
      </div>
      <Button onClick={handleSave} isLoading={isLoading} disabled={isLoading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
        Save Preferences
      </Button>
    </div>
  );
};

// ── Security Tab ──────────────────────────────────────────────────────────────

const SecurityTab = ({ authToasts }) => {
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
          {isGoogleOnly ? 'Set Password' : 'Change Password'}
        </h3>

        {isGoogleOnly && (
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
            <span>You signed in with Google. You can add a password to also sign in with email.</span>
          </div>
        )}

        <div className="space-y-3">
          {!isGoogleOnly && (
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Current password"
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
              placeholder="New password (min. 8 chars, letter + number)"
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
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={e => setForm(p => ({...p, confirmPassword: e.target.value}))}
          />
        </div>

        <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
          {isGoogleOnly ? 'Set Password' : 'Update Password'}
        </Button>
      </div>
    </div>
  );
};

// ── Export Tab ────────────────────────────────────────────────────────────────

const ExportTab = ({ t }) => {
  const { exportAsCSV, exportAsJSON, exportAsPDF, isExporting } = useExport();

  const exports = [
    { label: 'Export as CSV',  desc: 'Spreadsheet format for Excel / Google Sheets', icon: FileSpreadsheet, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', action: exportAsCSV },
    { label: 'Export as JSON', desc: 'Raw data format for developers',                icon: Braces,          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',  action: exportAsJSON },
    { label: 'Export as PDF',  desc: 'Formatted report ready to print or share',      icon: FileText,        color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',   action: exportAsPDF  },
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
          {isExporting ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
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
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profile</h1>
          </div>
          <HorizontalTabs active={activeTab} onChange={setActiveTab} t={t} />
        </div>
        <div className="px-4 py-4">{tabContent}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Desktop header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your profile and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <SidebarTabs active={activeTab} onChange={setActiveTab} t={t} />
          <div className="flex-1 min-w-0">{tabContent}</div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
