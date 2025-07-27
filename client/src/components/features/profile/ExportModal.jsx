/**
 * 📥 EXPORT MODAL - Mobile-First Data Export
 * Features: Zustand stores, Multiple formats, Date range selection, Mobile-responsive
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Database,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Settings,
  Eye,
  BarChart3
} from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { 
  useAuth,
  useTranslation, 
  useCurrency,
  useNotifications,
  useTheme 
} from '../../../stores';

// API and components
import { api } from '../../../api';
import { useExport } from '../../../hooks/useExport';
import { Button, Input, Card, LoadingSpinner, Modal, Dropdown, Badge } from '../../ui';
import { cn } from '../../../utils/helpers';

const ExportModal = ({ isOpen, onClose }) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { user } = useAuth();
  const { t, isRTL } = useTranslation();
  const { currency } = useCurrency();
  const { addNotification } = useNotifications();
  const { isDark } = useTheme();

  // Hooks
  const { exportData, isLoading: exportLoading, progress } = useExport();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    includeCategories: true,
    includeAnalytics: false,
    includeRecurring: true,
    categories: [],
    transactionTypes: ['income', 'expense']
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // ✅ Export format options
  const formatOptions = [
    {
      value: 'csv',
      label: 'CSV',
      description: t('export.csvDesc', { fallback: 'Comma-separated values (Excel compatible)' }),
      icon: FileText,
      recommended: true
    },
    {
      value: 'json',
      label: 'JSON',
      description: t('export.jsonDesc', { fallback: 'JavaScript Object Notation (for developers)' }),
      icon: Database,
      recommended: false
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: t('export.pdfDesc', { fallback: 'Portable Document Format (for reports)' }),
      icon: BarChart3,
      recommended: false
    }
  ];

  // ✅ Date range options
  const dateRangeOptions = [
    { value: 'all', label: t('export.allTime', { fallback: 'All Time' }) },
    { value: 'lastMonth', label: t('export.lastMonth', { fallback: 'Last Month' }) },
    { value: 'last3Months', label: t('export.last3Months', { fallback: 'Last 3 Months' }) },
    { value: 'lastYear', label: t('export.lastYear', { fallback: 'Last Year' }) },
    { value: 'custom', label: t('export.customRange', { fallback: 'Custom Range' }) }
  ];

  // ✅ Transaction type options
  const typeOptions = [
    { value: 'income', label: t('transactions.income', { fallback: 'Income' }) },
    { value: 'expense', label: t('transactions.expense', { fallback: 'Expenses' }) }
  ];

  // ✅ Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setExportConfig({
        format: 'csv',
        dateRange: 'all',
        startDate: '',
        endDate: '',
        includeCategories: true,
        includeAnalytics: false,
        includeRecurring: true,
        categories: [],
        transactionTypes: ['income', 'expense']
      });
      setIsExporting(false);
      setExportComplete(false);
    }
  }, [isOpen]);

  // ✅ Handle config changes
  const handleConfigChange = (field, value) => {
    setExportConfig(prev => ({ ...prev, [field]: value }));
  };

  // ✅ Calculate estimated records
  const getEstimatedRecords = () => {
    // This would typically come from an API call
    // For now, return a mock estimate
    return Math.floor(Math.random() * 1000) + 100;
  };

  // ✅ Validate export configuration
  const validateConfig = () => {
    if (exportConfig.dateRange === 'custom') {
      if (!exportConfig.startDate || !exportConfig.endDate) {
        addNotification({
          type: 'error',
          message: t('export.customDateRequired', { fallback: 'Please select start and end dates' })
        });
        return false;
      }
      if (exportConfig.startDate >= exportConfig.endDate) {
        addNotification({
          type: 'error',
          message: t('export.invalidDateRange', { fallback: 'End date must be after start date' })
        });
        return false;
      }
    }
    
    if (exportConfig.transactionTypes.length === 0) {
      addNotification({
        type: 'error',
        message: t('export.selectTransactionType', { fallback: 'Please select at least one transaction type' })
      });
      return false;
    }

    return true;
  };

  // ✅ Handle export
  const handleExport = async () => {
    if (!validateConfig()) return;

    setIsExporting(true);

    try {
      // Prepare export parameters
      const params = {
        format: exportConfig.format,
        dateRange: exportConfig.dateRange,
        ...(exportConfig.dateRange === 'custom' && {
          startDate: exportConfig.startDate,
          endDate: exportConfig.endDate
        }),
        includeCategories: exportConfig.includeCategories,
        includeAnalytics: exportConfig.includeAnalytics,
        includeRecurring: exportConfig.includeRecurring,
        transactionTypes: exportConfig.transactionTypes,
        categories: exportConfig.categories
      };

      const result = await exportData(params);
      
      if (result.success) {
        setExportComplete(true);
        addNotification({
          type: 'success',
          message: t('export.success', { fallback: 'Data exported successfully!' })
        });
      } else {
        throw new Error(result.error || t('export.failed', { fallback: 'Export failed' }));
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.message || t('export.failed', { fallback: 'Export failed' })
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ Steps configuration
  const steps = [
    { 
      id: 1, 
      title: t('export.selectFormat', { fallback: 'Select Format' }),
      description: t('export.selectFormatDesc', { fallback: 'Choose your preferred export format' })
    },
    { 
      id: 2, 
      title: t('export.configureData', { fallback: 'Configure Data' }),
      description: t('export.configureDataDesc', { fallback: 'Select what data to include' })
    },
    { 
      id: 3, 
      title: t('export.review', { fallback: 'Review & Export' }),
      description: t('export.reviewDesc', { fallback: 'Review your settings and export' })
    }
  ];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('export.title', { fallback: 'Export Data' })}
      size="large"
      className="max-w-2xl"
    >
      <div className={cn('space-y-6', isRTL && 'rtl')}>
        {/* Step indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      isActive && 'bg-primary-500 text-white',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <p className={cn(
                    'mt-2 text-xs text-center',
                    isActive && 'text-primary-600 dark:text-primary-400 font-medium',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    !isActive && !isCompleted && 'text-gray-500 dark:text-gray-400'
                  )}>
                    {step.title}
                  </p>
                </div>
                
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4 transition-colors',
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Format Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[0].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[0].description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {formatOptions.map(format => {
                      const Icon = format.icon;
                      return (
                        <button
                          key={format.value}
                          onClick={() => handleConfigChange('format', format.value)}
                          className={cn(
                            'w-full p-4 rounded-lg border-2 transition-all text-left',
                            exportConfig.format === format.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {format.label}
                                </h4>
                                {format.recommended && (
                                  <Badge variant="success" size="xs">
                                    {t('export.recommended', { fallback: 'Recommended' })}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {format.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Data Configuration */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[1].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[1].description}
                    </p>
                  </div>

                  {/* Date range */}
                  <div>
                    <Dropdown
                      label={t('export.dateRange', { fallback: 'Date Range' })}
                      options={dateRangeOptions}
                      value={exportConfig.dateRange}
                      onChange={(value) => handleConfigChange('dateRange', value)}
                      fullWidth
                      icon={<Calendar />}
                    />

                    {/* Custom date range */}
                    <AnimatePresence>
                      {exportConfig.dateRange === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 grid grid-cols-2 gap-4"
                        >
                          <Input
                            label={t('export.startDate', { fallback: 'Start Date' })}
                            type="date"
                            value={exportConfig.startDate}
                            onChange={(e) => handleConfigChange('startDate', e.target.value)}
                            fullWidth
                          />
                          <Input
                            label={t('export.endDate', { fallback: 'End Date' })}
                            type="date"
                            value={exportConfig.endDate}
                            onChange={(e) => handleConfigChange('endDate', e.target.value)}
                            min={exportConfig.startDate}
                            fullWidth
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Transaction types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('export.transactionTypes', { fallback: 'Transaction Types' })}
                    </label>
                    <div className="space-y-2">
                      {typeOptions.map(type => (
                        <label key={type.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exportConfig.transactionTypes.includes(type.value)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...exportConfig.transactionTypes, type.value]
                                : exportConfig.transactionTypes.filter(t => t !== type.value);
                              handleConfigChange('transactionTypes', types);
                            }}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {type.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional options */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('export.additionalOptions', { fallback: 'Additional Options' })}
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeCategories}
                          onChange={(e) => handleConfigChange('includeCategories', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {t('export.includeCategories', { fallback: 'Include Category Details' })}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('export.includeCategoriesDesc', { fallback: 'Export category names and icons' })}
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeRecurring}
                          onChange={(e) => handleConfigChange('includeRecurring', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {t('export.includeRecurring', { fallback: 'Include Recurring Information' })}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('export.includeRecurringDesc', { fallback: 'Export recurring transaction details' })}
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={exportConfig.includeAnalytics}
                          onChange={(e) => handleConfigChange('includeAnalytics', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                        />
                        <div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {t('export.includeAnalytics', { fallback: 'Include Analytics Data' })}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('export.includeAnalyticsDesc', { fallback: 'Export spending patterns and insights' })}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Export */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {steps[2].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {steps[2].description}
                    </p>
                  </div>

                  {/* Export summary */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('export.format', { fallback: 'Format' })}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatOptions.find(f => f.value === exportConfig.format)?.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('export.dateRange', { fallback: 'Date Range' })}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {exportConfig.dateRange === 'custom' 
                          ? `${exportConfig.startDate} - ${exportConfig.endDate}`
                          : dateRangeOptions.find(d => d.value === exportConfig.dateRange)?.label
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('export.transactionTypes', { fallback: 'Transaction Types' })}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {exportConfig.transactionTypes.map(type => 
                          typeOptions.find(t => t.value === type)?.label
                        ).join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('export.estimatedRecords', { fallback: 'Estimated Records' })}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ~{getEstimatedRecords()} {t('export.records', { fallback: 'records' })}
                      </span>
                    </div>

                    {/* Additional options summary */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {exportConfig.includeCategories && (
                          <Badge variant="outline" size="sm">
                            {t('export.categories', { fallback: 'Categories' })}
                          </Badge>
                        )}
                        {exportConfig.includeRecurring && (
                          <Badge variant="outline" size="sm">
                            {t('export.recurring', { fallback: 'Recurring' })}
                          </Badge>
                        )}
                        {exportConfig.includeAnalytics && (
                          <Badge variant="outline" size="sm">
                            {t('export.analytics', { fallback: 'Analytics' })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Export progress */}
                  {isExporting && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            {t('export.exporting', { fallback: 'Exporting your data...' })}
                          </p>
                          {progress && (
                            <div className="mt-2">
                              <div className="bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {progress}% {t('export.complete', { fallback: 'complete' })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export complete */}
                  {exportComplete && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">
                            {t('export.exportComplete', { fallback: 'Export completed successfully!' })}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {t('export.downloadStarted', { fallback: 'Your download should start automatically.' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : () => setCurrentStep(prev => prev - 1)}
            disabled={isExporting}
            icon={currentStep === 1 ? <X /> : undefined}
          >
            {currentStep === 1 
              ? t('common.cancel', { fallback: 'Cancel' })
              : t('common.back', { fallback: 'Back' })
            }
          </Button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('common.step', { current: currentStep, total: steps.length, fallback: `${currentStep} of ${steps.length}` })}
          </div>

          <Button
            onClick={currentStep === steps.length ? handleExport : () => setCurrentStep(prev => prev + 1)}
            loading={isExporting}
            disabled={isExporting || exportComplete}
            icon={currentStep === steps.length ? <Download /> : undefined}
          >
            {currentStep === steps.length 
              ? (exportComplete 
                  ? t('export.done', { fallback: 'Done' })
                  : t('export.startExport', { fallback: 'Start Export' })
                )
              : t('common.next', { fallback: 'Next' })
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;