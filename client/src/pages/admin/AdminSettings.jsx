import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Settings, Save, Shield, Mail, Zap, BarChart, RefreshCw } from 'lucide-react';
import { useTranslation, useNotifications } from '../../stores';
import { api } from '../../api';
import { LoadingSpinner } from '../../components/ui';
import { cn } from '../../utils/helpers';

const toBoolean = (v) => {
  if (v === true || v === false) return v;
  if (typeof v === 'string') return ['true','1','t','yes','on'].includes(v.trim().toLowerCase());
  if (typeof v === 'number')  return v !== 0;
  return false;
};

const TABS = [
  { id: 'general',   icon: Settings, labelKey: 'settings.general',   fallback: 'General' },
  { id: 'security',  icon: Shield,   labelKey: 'settings.security',  fallback: 'Security' },
  { id: 'email',     icon: Mail,     labelKey: 'settings.email',     fallback: 'Email' },
  { id: 'features',  icon: Zap,      labelKey: 'settings.features',  fallback: 'Features' },
  { id: 'analytics', icon: BarChart, labelKey: 'settings.analytics', fallback: 'Analytics' },
];

const SettingRow = ({ title, desc, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

const Toggle = ({ checked, onChange, variant = 'default' }) => (
  <label className="relative inline-flex items-center cursor-pointer shrink-0">
    <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
    <div className={cn(
      'w-11 h-6 rounded-full transition-colors',
      'bg-gray-200 dark:bg-gray-700',
      'peer-checked:bg-blue-600',
      variant === 'warning' && 'peer-checked:bg-yellow-500',
      'after:content-[""] after:absolute after:top-0.5 after:start-0.5',
      'after:bg-white after:rounded-full after:h-5 after:w-5',
      'after:transition-all ltr:peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5',
    )} />
  </label>
);

const TextInput = ({ value, onChange, type = 'text', placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn(
      'px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl',
      'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
      'focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none',
      'w-full sm:w-64'
    )}
  />
);

const AdminSettings = () => {
  const { t, isRTL }        = useTranslation('admin');
  const { addNotification } = useNotifications();

  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState('general');
  const [settings,   setSettings]   = useState({
    siteName:                 'SpendWise',
    userRegistration:         true,
    emailVerificationRequired:true,
    googleOAuthEnabled:       true,
    maintenanceMode:          false,
    analyticsEnabled:         true,
    notificationsEnabled:     true,
    supportEmail:             '',
    emailSenderName:          'SpendWise',
    analyticsProvider:        '',
  });

  useEffect(() => { loadSettings(); }, []); // eslint-disable-line

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await api.admin.settings.get();
      if (result.success && result.data) {
        const src = Array.isArray(result.data) ? result.data : [];
        const get = (key, fallback) => src.find(s => s.key === key)?.value ?? fallback;
        setSettings({
          siteName:                  get('site_name',                    'SpendWise'),
          userRegistration:          toBoolean(get('user_registration',         true)),
          emailVerificationRequired: toBoolean(get('email_verification_required',true)),
          googleOAuthEnabled:        toBoolean(get('google_oauth_enabled',       true)),
          maintenanceMode:           toBoolean(get('maintenance_mode',          false)),
          analyticsEnabled:          toBoolean(get('analytics_enabled',          true)),
          notificationsEnabled:      toBoolean(get('notifications_enabled',      true)),
          supportEmail:              get('support_email',     ''),
          emailSenderName:           get('email_sender_name', 'SpendWise'),
          analyticsProvider:         get('analytics_provider',''),
        });
      }
    } catch {
      addNotification({ type: 'error', message: t('settings.loadError', { fallback: 'Failed to load settings' }) });
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const pairs = [
        { key: 'site_name',                    value: settings.siteName,                 category: 'general',  description: 'Application name' },
        { key: 'user_registration',            value: settings.userRegistration,         category: 'auth',     description: 'Allow new user registration' },
        { key: 'email_verification_required',  value: settings.emailVerificationRequired,category: 'auth',     description: 'Require email verification' },
        { key: 'google_oauth_enabled',         value: settings.googleOAuthEnabled,       category: 'auth',     description: 'Enable Google OAuth' },
        { key: 'maintenance_mode',             value: settings.maintenanceMode,          category: 'system',   description: 'Maintenance mode' },
        { key: 'notifications_enabled',        value: settings.notificationsEnabled,     category: 'system',   description: 'System notifications' },
        { key: 'support_email',                value: settings.supportEmail,             category: 'contact',  description: 'Support email' },
        { key: 'email_sender_name',            value: settings.emailSenderName,          category: 'email',    description: 'Email sender name' },
        { key: 'analytics_enabled',            value: settings.analyticsEnabled,         category: 'system',   description: 'Analytics tracking' },
        { key: 'analytics_provider',           value: settings.analyticsProvider,        category: 'analytics',description: 'Analytics provider' },
      ];
      for (const pair of pairs) {
        const r = await api.admin.settings.update(pair);
        if (!r.success) throw new Error(r.error?.message || `Failed: ${pair.key}`);
      }
      addNotification({ type: 'success', message: t('settings.saved', { fallback: 'Settings saved' }) });
    } catch (err) {
      addNotification({ type: 'error', message: t('settings.saveError', { fallback: 'Save failed' }) + ': ' + err.message });
    }
    setSaving(false);
  };

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));
  const set    = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Compact Header ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-1.5 -ms-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">
              {t('settings.title', { fallback: 'System Settings' })}
            </h1>
            <button
              onClick={() => loadSettings()}
              disabled={loading}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>

          {/* Tab pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {TABS.map(({ id, icon: Icon, labelKey, fallback }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0 text-xs font-medium transition-colors',
                  activeTab === id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-3 h-3" />
                {t(labelKey, { fallback })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">

          {/* Tab content header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {TABS.find(t => t.id === activeTab) && (() => {
                const tab = TABS.find(t => t.id === activeTab);
                return t(tab.labelKey, { fallback: tab.fallback });
              })()}
            </h2>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {saving
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />}
              {saving
                ? t('common.saving', { fallback: 'Saving…' })
                : t('common.save',   { fallback: 'Save Changes' })}
            </button>
          </div>

          {/* Tab content */}
          <div className="px-5 py-1">
            {activeTab === 'general' && (
              <>
                <SettingRow title={t('settings.siteName',{ fallback: 'Site Name' })} desc={t('settings.siteNameDesc',{ fallback: 'The name of your application' })}>
                  <TextInput value={settings.siteName} onChange={v => set('siteName', v)} />
                </SettingRow>
                <SettingRow title={t('settings.userRegistration',    { fallback: 'User Registration' })}      desc={t('settings.userRegistrationDesc',    { fallback: 'Allow new users to register' })}>
                  <Toggle checked={settings.userRegistration}          onChange={() => toggle('userRegistration')} />
                </SettingRow>
                <SettingRow title={t('settings.emailVerification',   { fallback: 'Email Verification' })}     desc={t('settings.emailVerificationDesc',   { fallback: 'Require email verification for new accounts' })}>
                  <Toggle checked={settings.emailVerificationRequired} onChange={() => toggle('emailVerificationRequired')} />
                </SettingRow>
                <SettingRow title={t('settings.googleOAuth',         { fallback: 'Google OAuth' })}           desc={t('settings.googleOAuthDesc',         { fallback: 'Enable Google OAuth authentication' })}>
                  <Toggle checked={settings.googleOAuthEnabled}        onChange={() => toggle('googleOAuthEnabled')} />
                </SettingRow>
              </>
            )}

            {activeTab === 'security' && (
              <SettingRow title={t('settings.maintenanceMode',{ fallback: 'Maintenance Mode' })} desc={t('settings.maintenanceModeDesc',{ fallback: 'Restrict access during maintenance' })}>
                <Toggle checked={settings.maintenanceMode} onChange={() => toggle('maintenanceMode')} variant="warning" />
              </SettingRow>
            )}

            {activeTab === 'features' && (
              <SettingRow title={t('settings.notifications',{ fallback: 'System Notifications' })} desc={t('settings.notificationsDesc',{ fallback: 'Enable system-wide notifications' })}>
                <Toggle checked={settings.notificationsEnabled} onChange={() => toggle('notificationsEnabled')} />
              </SettingRow>
            )}

            {activeTab === 'email' && (
              <>
                <SettingRow title={t('settings.supportEmail',   { fallback: 'Support Email' })}      desc={t('settings.supportEmailDesc',    { fallback: 'Primary support contact email' })}>
                  <TextInput type="email" value={settings.supportEmail}    onChange={v => set('supportEmail', v)}    placeholder="support@example.com" />
                </SettingRow>
                <SettingRow title={t('settings.emailSenderName',{ fallback: 'Email Sender Name' })}  desc={t('settings.emailSenderNameDesc', { fallback: 'Display name used in outgoing emails' })}>
                  <TextInput value={settings.emailSenderName} onChange={v => set('emailSenderName', v)} placeholder="SpendWise" />
                </SettingRow>
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                <SettingRow title={t('settings.analytics',        { fallback: 'Analytics Tracking' })} desc={t('settings.analyticsDesc',        { fallback: 'Enable analytics and usage tracking' })}>
                  <Toggle checked={settings.analyticsEnabled} onChange={() => toggle('analyticsEnabled')} />
                </SettingRow>
                <SettingRow title={t('settings.analyticsProvider',{ fallback: 'Analytics Provider' })} desc={t('settings.analyticsProviderDesc',{ fallback: 'Identifier, e.g. plausible or ga4' })}>
                  <TextInput value={settings.analyticsProvider} onChange={v => set('analyticsProvider', v)} placeholder="plausible" />
                </SettingRow>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
