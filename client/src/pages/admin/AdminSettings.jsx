/**
 * ⚙️ ADMIN SETTINGS - System Configuration
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle, Settings, Shield, Mail, BarChart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

// Import components and hooks
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useTranslation, useNotifications } from '../../stores';
import { cn } from '../../utils/helpers';
import { api } from '../../api';

// Normalize jsonb values that may be stored as boolean, string, or number
const toBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 't' || v === 'yes' || v === 'on';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: 'SpendWise',
    userRegistration: true,
    emailVerificationRequired: true,
    googleOAuthEnabled: true,
    maintenanceMode: false,
    analyticsEnabled: true,
    notificationsEnabled: true,
    supportEmail: '',
    emailSenderName: 'SpendWise',
    analyticsProvider: ''
  });

  // Settings categories
  const categories = [
    { id: 'general', name: t('admin.settings.general', { fallback: 'General' }), icon: Settings },
    { id: 'security', name: t('admin.settings.security', { fallback: 'Security' }), icon: Shield },
    { id: 'email', name: t('admin.settings.email', { fallback: 'Email' }), icon: Mail },
    { id: 'features', name: t('admin.settings.features', { fallback: 'Features' }), icon: Zap },
    { id: 'analytics', name: t('admin.settings.analytics', { fallback: 'Analytics' }), icon: BarChart }
  ];

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Use real API call to get admin settings
      const result = await api.admin.settings.get();
      if (result.success && result.data) {
        // Transform server data format to local state format
        const serverSettings = Array.isArray(result.data) ? result.data : [];
        const transformedSettings = {
          siteName: serverSettings.find(s => s.key === 'site_name')?.value || 'SpendWise',
          userRegistration: toBoolean(serverSettings.find(s => s.key === 'user_registration')?.value),
          emailVerificationRequired: toBoolean(serverSettings.find(s => s.key === 'email_verification_required')?.value),
          googleOAuthEnabled: toBoolean(serverSettings.find(s => s.key === 'google_oauth_enabled')?.value),
          maintenanceMode: toBoolean(serverSettings.find(s => s.key === 'maintenance_mode')?.value),
          analyticsEnabled: toBoolean(serverSettings.find(s => s.key === 'analytics_enabled')?.value),
          notificationsEnabled: toBoolean(serverSettings.find(s => s.key === 'notifications_enabled')?.value),
          supportEmail: serverSettings.find(s => s.key === 'support_email')?.value || '',
          emailSenderName: serverSettings.find(s => s.key === 'email_sender_name')?.value || 'SpendWise',
          analyticsProvider: serverSettings.find(s => s.key === 'analytics_provider')?.value || ''
        };
        setSettings(transformedSettings);
        
        addNotification({
          type: 'success',
          message: t('admin.settings.loaded', { fallback: 'Settings loaded successfully' })
        });
      } else {
        // If no settings exist yet, use defaults
        addNotification({
          type: 'info',
          message: t('admin.settings.loaded', { fallback: 'Settings loaded successfully' })
        });
      }
    } catch (error) {
      console.error('Settings load error:', error);
      addNotification({
        type: 'error',
        message: t('admin.settings.loadError', { fallback: 'Failed to load settings' })
      });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Prepare settings data for server
      const settingsToSave = [
        { key: 'site_name', value: settings.siteName, category: 'general', description: 'Application name' },
        { key: 'user_registration', value: settings.userRegistration, category: 'auth', description: 'Allow new user registration' },
        { key: 'email_verification_required', value: settings.emailVerificationRequired, category: 'auth', description: 'Require email verification' },
        { key: 'google_oauth_enabled', value: settings.googleOAuthEnabled, category: 'auth', description: 'Enable Google OAuth' },
        { key: 'maintenance_mode', value: settings.maintenanceMode, category: 'system', description: 'System maintenance mode' },
        { key: 'notifications_enabled', value: settings.notificationsEnabled, category: 'system', description: 'Enable system notifications' },
        // Email settings
        { key: 'support_email', value: settings.supportEmail, category: 'contact', description: 'Support email address' },
        { key: 'email_sender_name', value: settings.emailSenderName, category: 'email', description: 'Email sender display name' },
        // Analytics settings
        { key: 'analytics_enabled', value: settings.analyticsEnabled, category: 'system', description: 'Enable analytics tracking' },
        { key: 'analytics_provider', value: settings.analyticsProvider, category: 'analytics', description: 'Analytics provider identifier' }
      ];

      // Save each setting
      for (const setting of settingsToSave) {
        const result = await api.admin.settings.update(setting);
        if (!result.success) {
          throw new Error(result.error?.message || `Failed to save ${setting.key}`);
        }
      }
      
      addNotification({
        type: 'success',
        message: t('admin.settings.saved', { fallback: 'Settings saved successfully' })
      });
    } catch (error) {
      console.error('Settings save error:', error);
      addNotification({
        type: 'error',
        message: t('admin.settings.saveError', { fallback: 'Failed to save settings' }) + ': ' + error.message
      });
    }
    setSaving(false);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900") }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header banner */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <Link to="/admin" className="text-white/90 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold">{t('admin.settings.title', { fallback: 'System Settings' })}</h1>
                  <p className="text-white/90 text-sm mt-1">{t('admin.settings.description', { fallback: 'Configure system-wide settings and preferences (Super Admin Only)' })}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('admin.settings.categories', { fallback: 'Categories' })}
              </h2>
              <nav className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                        activeTab === category.id
                          ? 'bg-emerald-600 text-white shadow hover:shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center rounded-md ${activeTab === category.id ? 'bg-white/20' : 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400'} p-2`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      {category.name}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </motion.div>

          {/* Settings Content */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {categories.find(cat => cat.id === activeTab)?.name} Settings
                </h2>
                <Button
                  onClick={saveSettings}
                  loading={saving}
                  className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('common.saving', { fallback: 'Saving...' }) : t('common.save', { fallback: 'Save Changes' })}
                </Button>
              </div>
              
              <div className="space-y-6">
                {activeTab === 'general' && (
                  <>
                    {/* Site Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('admin.settings.siteName', { fallback: 'Site Name' })}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('admin.settings.siteNameDesc', { fallback: 'The name of your application' })}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => handleInputChange('siteName', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* User Registration */}
                    <SettingToggle
                      title={t('admin.settings.userRegistration', { fallback: 'User Registration' })}
                      description={t('admin.settings.userRegistrationDesc', { fallback: 'Allow new users to register' })}
                      checked={settings.userRegistration}
                      onChange={() => handleToggle('userRegistration')}
                    />

                    {/* Email Verification */}
                    <SettingToggle
                      title={t('admin.settings.emailVerification', { fallback: 'Email Verification Required' })}
                      description={t('admin.settings.emailVerificationDesc', { fallback: 'Require email verification for new accounts' })}
                      checked={settings.emailVerificationRequired}
                      onChange={() => handleToggle('emailVerificationRequired')}
                    />

                    {/* Google OAuth */}
                    <SettingToggle
                      title={t('admin.settings.googleOAuth', { fallback: 'Google OAuth' })}
                      description={t('admin.settings.googleOAuthDesc', { fallback: 'Enable Google OAuth authentication' })}
                      checked={settings.googleOAuthEnabled}
                      onChange={() => handleToggle('googleOAuthEnabled')}
                    />
                  </>
                )}

                {activeTab === 'security' && (
                  <>
                    {/* Maintenance Mode */}
                    <SettingToggle
                      title={t('admin.settings.maintenanceMode', { fallback: 'Maintenance Mode' })}
                      description={t('admin.settings.maintenanceModeDesc', { fallback: 'Enable maintenance mode to restrict access' })}
                      checked={settings.maintenanceMode}
                      onChange={() => handleToggle('maintenanceMode')}
                      variant={settings.maintenanceMode ? 'warning' : 'default'}
                    />
                  </>
                )}

                {activeTab === 'features' && (
                  <>
                    {/* Notifications */}
                    <SettingToggle
                      title={t('admin.settings.notifications', { fallback: 'System Notifications' })}
                      description={t('admin.settings.notificationsDesc', { fallback: 'Enable system-wide notifications' })}
                      checked={settings.notificationsEnabled}
                      onChange={() => handleToggle('notificationsEnabled')}
                    />
                  </>
                )}

                {activeTab === 'email' && (
                  <>
                    {/* Support Email */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('admin.settings.supportEmail', { fallback: 'Support Email' })}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('admin.settings.supportEmailDesc', { fallback: 'Primary support contact email address' })}
                        </p>
                      </div>
                      <input
                        type="email"
                        value={settings.supportEmail || 'spendwise.verifiction@gmail.com'}
                        onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Email Sender Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('admin.settings.emailSenderName', { fallback: 'Email Sender Name' })}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('admin.settings.emailSenderNameDesc', { fallback: 'Display name used in system emails' })}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={settings.emailSenderName}
                        onChange={(e) => handleInputChange('emailSenderName', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'analytics' && (
                  <>
                    {/* Analytics Enabled */}
                    <SettingToggle
                      title={t('admin.settings.analytics', { fallback: 'Analytics Tracking' })}
                      description={t('admin.settings.analyticsDesc', { fallback: 'Enable analytics and usage tracking' })}
                      checked={settings.analyticsEnabled}
                      onChange={() => handleToggle('analyticsEnabled')}
                    />

                    {/* Analytics Provider */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('admin.settings.analyticsProvider', { fallback: 'Analytics Provider' })}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('admin.settings.analyticsProviderDesc', { fallback: 'Identifier (e.g., plausible, ga4) for client integration' })}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={settings.analyticsProvider}
                        onChange={(e) => handleInputChange('analyticsProvider', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="plausible"
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* API Integration Notice */}
            <Card className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="p-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {t('admin.settings.apiReady', { fallback: 'Settings System Ready' })}
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {t('admin.settings.apiDesc', { fallback: 'This interface is ready for backend API integration. Settings are currently in demo mode.' })}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ✅ Reusable Setting Toggle Component
const SettingToggle = ({ title, description, checked, onChange, variant = 'default' }) => {
  const variantClasses = {
    default: 'peer-checked:bg-emerald-600',
    warning: 'peer-checked:bg-yellow-500'
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked}
          onChange={onChange}
        />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${variantClasses[variant]}`}></div>
      </label>
    </div>
  );
};

export default AdminSettings; 