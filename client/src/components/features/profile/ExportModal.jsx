/**
 * ExportModal Component - COMPACT & CLEAN DESIGN
 * Data export interface with CSV and JSON options
 * Streamlined for better user experience
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileJson,
  Info,
  Loader2,
  CheckCircle,
  X,
  Shield,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useExport } from '../../../hooks/useExport';
import { cn } from '../../../utils/helpers';
import { Modal, Button, LoadingSpinner } from '../../ui';
import { useToast } from '../../../hooks/useToast';

const ExportModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const toastService = useToast();
  const isRTL = language === 'he';
  
  // Extract export functionality from custom hook
  const {
    exportAsCSV,
    exportAsJSON,
    isExporting,
    exportProgress,
    exportOptions,
    isFormatAvailable,
    isLoadingOptions,
    exportUserInfo
  } = useExport();

  /**
   * Handle export with comprehensive error handling and user feedback
   * @param {string} format - Export format ('csv' or 'json')
   */
  const handleExport = async (format) => {
    try {
      // Validate format before proceeding
      if (!['csv', 'json'].includes(format)) {
        toastService.error('toast.error.formErrors');
        return;
      }

      // Check format availability from server
      if (!isFormatAvailable(format)) {
        toastService.error('toast.error.exportFailed', { params: { format: format.toUpperCase() } });
        return;
      }

      // Close modal immediately for better UX (non-blocking)
      onClose();
      
      // Show progress feedback to user
      const loadingToast = toastService.loading('toast.loading.preparingExport', { 
        params: { format: format.toUpperCase() } 
      });
      
      let result;
      
      // Execute appropriate export function
      switch (format) {
        case 'csv':
          result = await exportAsCSV();
          break;
        case 'json':
          result = await exportAsJSON();
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Clean up loading toast
      toastService.dismiss(loadingToast);
      
      console.log(`${format.toUpperCase()} export completed successfully`);
      
    } catch (error) {
      console.error('Export operation failed:', error);
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Export error details:', {
          format,
          error: error.message,
          response: error.response?.data,
          stack: error.stack
        });
      }
    }
  };

  /**
   * Export format configurations
   */
  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV',
      fullName: 'CSV (Comma Separated Values)',
      icon: FileText,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverColor: 'hover:border-green-400 dark:hover:border-green-600',
      description: t('profile.export.csvDescription'),
      mimeType: 'text/csv',
      fileExtension: '.csv',
      estimatedSize: '~5-50 KB',
      useCase: t('profile.export.csvUseCase')
    },
    {
      id: 'json',
      name: 'JSON',
      fullName: 'JSON (JavaScript Object Notation)',
      icon: FileJson,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      hoverColor: 'hover:border-blue-400 dark:hover:border-blue-600',
      description: t('profile.export.jsonDescription'),
      mimeType: 'application/json',
      fileExtension: '.json',
      estimatedSize: '~10-100 KB',
      useCase: t('profile.export.jsonUseCase')
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Download className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('profile.export.title')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('profile.export.subtitle')}
            </p>
          </div>
        </div>
      }
      size="medium"
      className="max-w-lg"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Data inclusion information banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t('profile.export.dataIncluded')}
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
                {(exportOptions.dataIncluded || [
                  t('profile.export.transactionsIncluded'),
                  t('profile.export.categoriesIncluded'),
                  t('profile.export.summaryIncluded'),
                  t('profile.export.preferencesIncluded')
                ]).map((item, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Loading state while fetching export options */}
        {isLoadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner 
              size="medium" 
              text={t('profile.export.loadingOptions')} 
            />
          </div>
        ) : (
          /* Export format selection cards */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('profile.export.selectFormat')}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {exportFormats.length} {t('profile.export.formatsAvailable')}
              </span>
            </div>
            
            <div className="space-y-3">
              {exportFormats.map((format) => {
                const isAvailable = isFormatAvailable(format.id);
                const isCurrentlyExporting = exportProgress.format === format.name.toUpperCase();
                const isDisabled = !isAvailable || isExporting;

                return (
                  <motion.button
                    key={format.id}
                    whileHover={!isDisabled ? { scale: 1.01 } : {}}
                    whileTap={!isDisabled ? { scale: 0.99 } : {}}
                    onClick={() => !isDisabled && handleExport(format.id)}
                    disabled={isDisabled}
                    className={cn(
                      // Base styles
                      'w-full p-3 rounded-lg border transition-all duration-200',
                      'flex items-start gap-3 text-left',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                      // Conditional styles based on state
                      isDisabled
                        ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        : cn(
                            format.bgColor,
                            format.borderColor,
                            format.hoverColor,
                            'hover:shadow-sm'
                          ),
                      // Active export indication
                      isCurrentlyExporting && 'ring-1 ring-primary-500'
                    )}
                  >
                    {/* Format icon section */}
                    <div className={cn(
                      'p-2 rounded-lg flex-shrink-0',
                      isDisabled 
                        ? 'bg-gray-100 dark:bg-gray-700' 
                        : 'bg-white dark:bg-gray-800 shadow-sm'
                    )}>
                      <format.icon className={cn(
                        'w-5 h-5',
                        isDisabled ? 'text-gray-400' : format.iconColor
                      )} />
                    </div>

                    {/* Format information section */}
                    <div className="flex-1 min-w-0">
                      {/* Format name and file type */}
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {format.fullName}
                        </h5>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                          {format.fileExtension}
                        </span>
                      </div>
                      
                      {/* Format description */}
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
                        {format.description}
                      </p>
                      
                      {/* Format metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          {t('profile.export.estimatedSize')}: {format.estimatedSize}
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('profile.export.instant')}
                        </span>
                      </div>
                    </div>

                    {/* Export status and action section */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      {isCurrentlyExporting ? (
                        // Show progress when exporting
                        <div className="flex items-center gap-1">
                          <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                        </div>
                      ) : isAvailable ? (
                        // Show download icon when available
                        <div className="text-gray-400 dark:text-gray-500">
                          <Download className="w-4 h-4" />
                        </div>
                      ) : (
                        // Show disabled state
                        <div className="text-gray-300 dark:text-gray-600">
                          <X className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Security and privacy information */}
        {exportOptions.privacyNote && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Shield className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                  {t('profile.export.security')}
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
                  {exportOptions.privacyNote}
                </p>
                {/* Security features badges */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>🔒 {t('profile.export.httpsEncrypted')}</span>
                  <span>🚫 {t('profile.export.notStored')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active export progress indicator */}
        {isExporting && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" />
              <div>
                <h5 className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {t('profile.export.processing')}
                </h5>
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  {exportProgress.format && (
                    t('profile.export.progressStatus', { 
                      format: exportProgress.format, 
                      progress: exportProgress.progress 
                    })
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* User information footer */}
        {exportUserInfo && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p>
              {t('profile.export.userInfo', {
                username: exportUserInfo.username,
                currency: exportUserInfo.currency,
                language: exportUserInfo.language?.toUpperCase()
              }) || 
              `Export for ${exportUserInfo.username} • ${exportUserInfo.currency} • ${exportUserInfo.language?.toUpperCase()}`}
            </p>
          </div>
        )}
      </motion.div>
    </Modal>
  );
};

export default ExportModal;