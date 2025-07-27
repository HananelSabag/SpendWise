/**
 * ⚠️ ACCOUNT SETTINGS - Account Management & Danger Zone Component
 * Extracted from Profile.jsx for better performance and maintainability
 * Features: Data export, Account deletion, Privacy settings, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Trash2, AlertTriangle, Shield, Eye, 
  EyeOff, Lock, Users, Globe, FileText, Database,
  Calendar, Clock, X, CheckCircle, AlertCircle
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useAuth,
  useTranslation,
  useNotifications
} from '../../../stores';

import { Button, Card, Badge, Switch, Tooltip, Input } from '../../ui';
import ExportModal from './ExportModal';
import { cn } from '../../../utils/helpers';

/**
 * 📊 Data Export Section
 */
const DataExportSection = ({ 
  onExport, 
  className = '' 
}) => {
  const { t } = useTranslation('account');
  const { addNotification } = useNotifications();
  const [showExportModal, setShowExportModal] = useState(false);

  const exportOptions = [
    {
      id: 'transactions',
      title: t('export.transactions.title'),
      description: t('export.transactions.description'),
      icon: Database,
      size: '~2.5MB',
      format: 'CSV, JSON, PDF'
    },
    {
      id: 'categories',
      title: t('export.categories.title'),
      description: t('export.categories.description'),
      icon: FileText,
      size: '~50KB',
      format: 'JSON, CSV'
    },
    {
      id: 'reports',
      title: t('export.reports.title'),
      description: t('export.reports.description'),
      icon: Calendar,
      size: '~1MB',
      format: 'PDF, Excel'
    },
    {
      id: 'settings',
      title: t('export.settings.title'),
      description: t('export.settings.description'),
      icon: Shield,
      size: '~10KB',
      format: 'JSON'
    }
  ];

  const handleQuickExport = useCallback(async (type) => {
    try {
      await onExport?.(type);
      addNotification({
        type: 'success',
        message: t('export.success', { type }),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('export.failed'),
        duration: 3000
      });
    }
  }, [onExport, addNotification, t]);

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('export.title')}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('export.description')}
      </p>

      <div className="space-y-4 mb-6">
        {exportOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <div
              key={option.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <OptionIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" size="xs">
                      {option.size}
                    </Badge>
                    <Badge variant="outline" size="xs">
                      {option.format}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickExport(option.id)}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('export.download')}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex space-x-3">
        <Button
          variant="primary"
          onClick={() => setShowExportModal(true)}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          {t('export.advanced')}
        </Button>

        <Button
          variant="outline"
          onClick={() => handleQuickExport('complete')}
        >
          {t('export.complete')}
        </Button>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </Card>
  );
};

/**
 * 🔐 Privacy Settings Section
 */
const PrivacySettingsSection = ({ 
  onPrivacyChange, 
  privacySettings = {},
  className = '' 
}) => {
  const { t } = useTranslation('account');
  const { addNotification } = useNotifications();

  const [settings, setSettings] = useState({
    profileVisibility: privacySettings.profileVisibility ?? true,
    dataSharing: privacySettings.dataSharing ?? false,
    analyticsTracking: privacySettings.analyticsTracking ?? true,
    marketingEmails: privacySettings.marketingEmails ?? false,
    publicActivity: privacySettings.publicActivity ?? false,
    ...privacySettings
  });

  const handleSettingChange = useCallback(async (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    try {
      await onPrivacyChange?.(setting, value);
      addNotification({
        type: 'success',
        message: t('privacy.updated'),
        duration: 2000
      });
    } catch (error) {
      // Revert on error
      setSettings(prev => ({ ...prev, [setting]: !value }));
      addNotification({
        type: 'error',
        message: t('privacy.updateFailed'),
        duration: 3000
      });
    }
  }, [onPrivacyChange, addNotification, t]);

  const privacyOptions = [
    {
      id: 'profileVisibility',
      title: t('privacy.profileVisibility.title'),
      description: t('privacy.profileVisibility.description'),
      icon: Eye,
      enabled: settings.profileVisibility
    },
    {
      id: 'dataSharing',
      title: t('privacy.dataSharing.title'),
      description: t('privacy.dataSharing.description'),
      icon: Users,
      enabled: settings.dataSharing
    },
    {
      id: 'analyticsTracking',
      title: t('privacy.analyticsTracking.title'),
      description: t('privacy.analyticsTracking.description'),
      icon: Globe,
      enabled: settings.analyticsTracking
    },
    {
      id: 'marketingEmails',
      title: t('privacy.marketingEmails.title'),
      description: t('privacy.marketingEmails.description'),
      icon: FileText,
      enabled: settings.marketingEmails
    },
    {
      id: 'publicActivity',
      title: t('privacy.publicActivity.title'),
      description: t('privacy.publicActivity.description'),
      icon: Users,
      enabled: settings.publicActivity
    }
  ];

  return (
    <Card className={cn("p-6", className)}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('privacy.title')}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('privacy.description')}
      </p>

      <div className="space-y-4">
        {privacyOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <div
              key={option.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <OptionIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </div>

              <Switch
                checked={option.enabled}
                onCheckedChange={(checked) => handleSettingChange(option.id, checked)}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/**
 * ⚠️ Danger Zone Section
 */
const DangerZoneSection = ({ 
  onAccountDelete, 
  className = '' 
}) => {
  const { user } = useAuth();
  const { t } = useTranslation('account');
  const { addNotification } = useNotifications();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      addNotification({
        type: 'error',
        message: t('dangerZone.confirmationError'),
        duration: 3000
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      await onAccountDelete?.();
      addNotification({
        type: 'success',
        message: t('dangerZone.deleteSuccess'),
        duration: 5000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('dangerZone.deleteFailed'),
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
    }
  }, [deleteConfirmation, onAccountDelete, addNotification, t]);

  return (
    <>
      <Card className={cn("p-6 border-2 border-red-200 dark:border-red-700", className)}>
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400">
            {t('dangerZone.title')}
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('dangerZone.description')}
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-400 mb-1">
                  {t('dangerZone.warning.title')}
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  <li>• {t('dangerZone.warning.data')}</li>
                  <li>• {t('dangerZone.warning.transactions')}</li>
                  <li>• {t('dangerZone.warning.settings')}</li>
                  <li>• {t('dangerZone.warning.irreversible')}</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('dangerZone.deleteAccount')}
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('dangerZone.confirmDelete')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {t('dangerZone.confirmDescription', { email: user?.email })}
                  </p>
                </div>

                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('dangerZone.typeDelete')}
                  </label>
                  <Input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="w-full"
                    disabled={isDeleting}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                    disabled={isDeleting}
                  >
                    {t('actions.cancel')}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="flex-1"
                    disabled={isDeleting || deleteConfirmation.toLowerCase() !== 'delete'}
                  >
                    {isDeleting ? t('actions.deleting') : t('actions.delete')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * ⚙️ Account Settings Main Component
 */
const AccountSettings = ({
  onExport,
  onPrivacyChange,
  onAccountDelete,
  privacySettings = {},
  className = ''
}) => {
  const { t, isRTL } = useTranslation('account');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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
      {/* Data Export */}
      <motion.div variants={itemVariants}>
        <DataExportSection onExport={onExport} />
      </motion.div>

      {/* Privacy Settings */}
      <motion.div variants={itemVariants}>
        <PrivacySettingsSection
          onPrivacyChange={onPrivacyChange}
          privacySettings={privacySettings}
        />
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <DangerZoneSection onAccountDelete={onAccountDelete} />
      </motion.div>
    </motion.div>
  );
};

export default AccountSettings;
export { DataExportSection, PrivacySettingsSection, DangerZoneSection }; 