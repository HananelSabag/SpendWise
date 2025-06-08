/**
 * ExportModal Component - Production Ready
 * Data export interface with CSV and JSON options
 * Fully commented and optimized for production use
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
import toast from 'react-hot-toast';

const ExportModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
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
        toast.error(t('profile.export.invalidFormat') || 'Invalid export format selected');
        return;
      }

      // Check format availability from server
      if (!isFormatAvailable(format)) {
        toast.error(t('profile.export.formatUnavailable') || `${format.toUpperCase()} export is not available`);
        return;
      }

      // Close modal immediately for better UX (non-blocking)
      onClose();
      
      // Show progress feedback to user
      const loadingToast = toast.loading(
        t('profile.export.preparing', { format: format.toUpperCase() }) || 
        `Preparing ${format.toUpperCase()} export...`
      );
      
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
      toast.dismiss(loadingToast);
      
      // Success feedback is handled by useExport hook
      console.log(`${format.toUpperCase()} export completed successfully`);
      
    } catch (error) {
      console.error('Export operation failed:', error);
      
      // Error toasts are handled by useExport hook
      // Additional debug logging for development
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
   * Only includes properly implemented and tested formats
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
      description: t('profile.export.csvDescription') || 'Compatible with Excel, Google Sheets, and all spreadsheet applications',
      mimeType: 'text/csv',
      fileExtension: '.csv',
      estimatedSize: '~5-50 KB',
      compatibility: ['Microsoft Excel', 'Google Sheets', 'LibreOffice Calc', 'Numbers'],
      useCase: t('profile.export.csvUseCase') || 'Perfect for data analysis, reporting, and further processing'
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
      description: t('profile.export.jsonDescription') || 'Machine-readable format with complete data structure and metadata',
      mimeType: 'application/json',
      fileExtension: '.json',
      estimatedSize: '~10-100 KB',
      compatibility: ['Programming tools', 'Data analysis software', 'API integrations', 'Custom applications'],
      useCase: t('profile.export.jsonUseCase') || 'Ideal for developers, data scientists, and technical users'
    }
  ];

  // Animation variants for smooth user interactions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          {/* Modal header with icon and title */}
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('profile.export.title') || 'Export Your Data'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('profile.export.subtitle') || 'Choose your preferred format for downloading'}
            </p>
          </div>
        </div>
      }
      size="medium"
      className="max-w-2xl"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Data inclusion information banner */}
        <motion.div 
          variants={itemVariants}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t('profile.export.dataIncluded') || 'What\'s included in your export'}
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                {(exportOptions.dataIncluded || [
                  'All transactions (income and expenses)',
                  'Categories and descriptions', 
                  'Account summary and statistics',
                  'User preferences and settings',
                  'Export metadata and timestamps'
                ]).map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Loading state while fetching export options */}
        {isLoadingOptions ? (
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center py-12"
          >
            <LoadingSpinner 
              size="medium" 
              text={t('profile.export.loadingOptions') || 'Loading export options...'} 
            />
          </motion.div>
        ) : (
          /* Export format selection cards */
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('profile.export.selectFormat') || 'Select export format:'}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {exportFormats.length} {t('profile.export.formatsAvailable') || 'formats available'}
              </span>
            </div>
            
            <div className="grid gap-4">
              {exportFormats.map((format) => {
                const isAvailable = isFormatAvailable(format.id);
                const isCurrentlyExporting = exportProgress.format === format.name.toUpperCase();
                const isDisabled = !isAvailable || isExporting;

                return (
                  <motion.button
                    key={format.id}
                    variants={itemVariants}
                    whileHover={!isDisabled ? { scale: 1.02 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    onClick={() => !isDisabled && handleExport(format.id)}
                    disabled={isDisabled}
                    className={cn(
                      // Base styles
                      'w-full p-5 rounded-xl border-2 transition-all duration-200',
                      'flex items-start gap-4 text-left',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      // Conditional styles based on state
                      isDisabled
                        ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        : cn(
                            format.bgColor,
                            format.borderColor,
                            format.hoverColor,
                            'hover:shadow-md dark:hover:shadow-lg'
                          ),
                      // Active export indication
                      isCurrentlyExporting && 'ring-2 ring-primary-500 ring-offset-2'
                    )}
                  >
                    {/* Format icon section */}
                    <div className={cn(
                      'p-3 rounded-lg flex-shrink-0',
                      isDisabled 
                        ? 'bg-gray-100 dark:bg-gray-700' 
                        : 'bg-white dark:bg-gray-800 shadow-sm'
                    )}>
                      <format.icon className={cn(
                        'w-6 h-6',
                        isDisabled ? 'text-gray-400' : format.iconColor
                      )} />
                    </div>

                    {/* Format information section */}
                    <div className="flex-1 min-w-0">
                      {/* Format name and file type */}
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-900 dark:text-white">
                          {format.fullName}
                        </h5>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {format.fileExtension}
                        </span>
                      </div>
                      
                      {/* Format description */}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                        {format.description}
                      </p>
                      
                      {/* Format metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          {t('profile.export.estimatedSize') || 'Size'}: {format.estimatedSize}
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t('profile.export.instant') || 'Instant download'}
                        </span>
                      </div>

                      {/* Use case description */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {format.useCase}
                      </p>
                    </div>

                    {/* Export status and action section */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      {isCurrentlyExporting ? (
                        // Show progress when exporting
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 transition-all duration-300"
                              style={{ width: `${exportProgress.progress}%` }}
                            />
                          </div>
                          <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                        </div>
                      ) : isAvailable ? (
                        // Show download icon when available
                        <div className="text-gray-400 dark:text-gray-500">
                          <Download className="w-5 h-5" />
                        </div>
                      ) : (
                        // Show disabled state
                        <div className="text-gray-300 dark:text-gray-600">
                          <X className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Security and privacy information */}
        {exportOptions.privacyNote && (
          <motion.div 
            variants={itemVariants}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t('profile.export.security') || 'Security & Privacy'}
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                  {exportOptions.privacyNote}
                </p>
                {/* Security features badges */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    🔒 {t('profile.export.httpsEncrypted') || 'HTTPS Encrypted'}
                  </span>
                  <span className="flex items-center gap-1">
                    🚫 {t('profile.export.notStored') || 'Not Stored'}
                  </span>
                  <span className="flex items-center gap-1">
                    ⚡ {t('profile.export.onDemand') || 'On-Demand Only'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active export progress indicator */}
        {isExporting && (
          <motion.div 
            variants={itemVariants}
            className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin" />
              <div>
                <h5 className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {t('profile.export.processing') || 'Processing your export...'}
                </h5>
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  {exportProgress.format && (
                    t('profile.export.progressStatus', { 
                      format: exportProgress.format, 
                      progress: exportProgress.progress 
                    }) || 
                    `${exportProgress.format} export: ${exportProgress.progress}% complete`
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* User information footer */}
        {exportUserInfo && (
          <motion.div 
            variants={itemVariants}
            className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700"
          >
            <p>
              {t('profile.export.userInfo', {
                username: exportUserInfo.username,
                currency: exportUserInfo.currency,
                language: exportUserInfo.language?.toUpperCase()
              }) || 
              `Export for ${exportUserInfo.username} • ${exportUserInfo.currency} • ${exportUserInfo.language?.toUpperCase()}`}
            </p>
          </motion.div>
        )}
      </motion.div>
    </Modal>
  );
};

export default ExportModal;