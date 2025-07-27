/**
 * 🔄 RECURRING SETUP MODAL - Clean Architecture
 * Replaces RecurringModal.jsx (601 lines) with clean, focused modal
 * Features: Uses new form foundation, Step-by-step flow, Mobile-first
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, X, CheckCircle, ArrowLeft, ArrowRight,
  Calendar, Clock, Target, Zap, Eye
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications,
  useCurrency
} from '../../../../stores';

// ✅ Import our new foundation
import TransactionForm from '../forms/TransactionForm';
import { Modal, Button, Card, Badge } from '../../../ui';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { 
  generateRecurringPreview, 
  calculateNextRecurringDate,
  getRecurringFrequencyInfo 
} from '../forms/TransactionHelpers';

/**
 * 🔄 Recurring Setup Modal Component
 */
const RecurringSetupModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  initialData = null,
  mode = 'create', // create, edit
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const { createRecurringTemplate, updateRecurringTemplate, isLoading } = useTransactionActions();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(null);

  // ✅ Steps configuration
  const steps = [
    {
      id: 1,
      title: t('recurring.steps.setup.title'),
      description: t('recurring.steps.setup.description'),
      icon: Repeat,
      component: 'form'
    },
    {
      id: 2,
      title: t('recurring.steps.preview.title'),
      description: t('recurring.steps.preview.description'),
      icon: Eye,
      component: 'preview'
    },
    {
      id: 3,
      title: t('recurring.steps.confirm.title'),
      description: t('recurring.steps.confirm.description'),
      icon: CheckCircle,
      component: 'confirm'
    }
  ];

  const currentStepConfig = steps[currentStep - 1];

  // ✅ Generate preview data
  const previewData = useMemo(() => {
    if (!formData?.isRecurring) return [];
    return generateRecurringPreview(formData, 6);
  }, [formData]);

  // ✅ Calculate recurring summary
  const recurringSummary = useMemo(() => {
    if (!formData?.isRecurring) return null;
    
    const frequencyInfo = getRecurringFrequencyInfo(formData.recurringFrequency);
    const nextDate = calculateNextRecurringDate(
      formData.date, 
      formData.recurringFrequency, 
      parseInt(formData.recurringInterval)
    );
    
    return {
      frequency: frequencyInfo,
      interval: formData.recurringInterval,
      nextDate,
      endType: formData.recurringEndType,
      endDate: formData.recurringEndDate,
      maxOccurrences: formData.recurringMaxOccurrences,
      totalEstimate: previewData.length > 0 
        ? previewData.length * Math.abs(parseFloat(formData.amount))
        : 0
    };
  }, [formData, previewData]);

  // ✅ Handle form data from step 1
  const handleFormData = useCallback((data) => {
    setFormData(data);
    if (data.isRecurring) {
      setCurrentStep(2); // Go to preview
    } else {
      // Skip preview for non-recurring, go straight to confirm
      setCurrentStep(3);
    }
  }, []);

  // ✅ Handle final submission
  const handleSubmit = useCallback(async () => {
    if (!formData) return;
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (mode === 'edit' && initialData) {
        result = await updateRecurringTemplate(initialData.id, formData);
      } else {
        result = await createRecurringTemplate(formData);
      }
      
      // Show success state briefly
      setShowSuccess(true);
      
      // Notify success
      addNotification({
        type: 'success',
        message: mode === 'edit' 
          ? t('notifications.recurringUpdateSuccess')
          : t('notifications.recurringCreateSuccess'),
        duration: 3000
      });
      
      // Call success callback
      onSuccess?.(result);
      
      // Close modal after brief success display
      setTimeout(() => {
        setShowSuccess(false);
        resetModal();
        onClose?.();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save recurring template:', error);
      
      addNotification({
        type: 'error',
        message: error.message || (mode === 'edit'
          ? t('notifications.recurringUpdateFailed')
          : t('notifications.recurringCreateFailed')),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, initialData, createRecurringTemplate, updateRecurringTemplate, addNotification, t, onSuccess, onClose]);

  // ✅ Reset modal state
  const resetModal = useCallback(() => {
    setCurrentStep(1);
    setFormData(null);
    setShowSuccess(false);
    setIsSubmitting(false);
  }, []);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    resetModal();
    onClose?.();
  }, [isSubmitting, resetModal, onClose]);

  // ✅ Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="3xl"
      className={className}
    >
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {mode === 'edit' 
                      ? t('recurring.modal.editTitle')
                      : t('recurring.modal.createTitle')
                    }
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentStepConfig.description}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                        ${isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                            ? 'bg-purple-500 border-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      {index < steps.length - 1 && (
                        <div className={`
                          w-16 h-0.5 mx-2 transition-colors
                          ${isCompleted || currentStep > step.id 
                            ? 'bg-green-500' 
                            : 'bg-gray-300 dark:bg-gray-600'
                          }
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-2 text-center">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {currentStepConfig.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Form */}
                {currentStep === 1 && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TransactionForm
                      mode={mode}
                      initialData={initialData}
                      onSubmit={handleFormData}
                      onCancel={handleClose}
                      isLoading={isSubmitting || isLoading}
                      showRecurring={true}
                      showAdvanced={true}
                    />
                  </motion.div>
                )}

                {/* Step 2: Preview */}
                {currentStep === 2 && formData && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Summary */}
                    {recurringSummary && (
                      <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                          {t('recurring.summary.title')}
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <span className="text-sm text-purple-700 dark:text-purple-300">
                              {t('recurring.summary.frequency')}:
                            </span>
                            <span className="ml-2 font-medium text-purple-900 dark:text-purple-100">
                              {t(`frequencies.${formData.recurringFrequency}`)} 
                              {formData.recurringInterval > 1 && ` (${formData.recurringInterval}x)`}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-purple-700 dark:text-purple-300">
                              {t('recurring.summary.nextDate')}:
                            </span>
                            <span className="ml-2 font-medium text-purple-900 dark:text-purple-100">
                              {recurringSummary.nextDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Preview List */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                        {t('recurring.preview.title')}
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {previewData.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className="text-xs">
                                #{item.occurrence}
                              </Badge>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.formattedDate}
                              </span>
                            </div>
                            <span className={`font-semibold ${
                              formData.type === 'income' 
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {formatCurrency(Math.abs(parseFloat(formData.amount)))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        className="flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('actions.previous')}</span>
                      </Button>
                      
                      <Button
                        variant="primary"
                        onClick={handleNext}
                        className="flex items-center space-x-2"
                      >
                        <span>{t('actions.next')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Confirm */}
                {currentStep === 3 && formData && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Final Summary */}
                    <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <h4 className="font-semibold text-green-900 dark:text-green-100">
                          {t('recurring.confirm.ready')}
                        </h4>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">
                            {t('fields.description.label')}:
                          </span>
                          <span className="font-medium text-green-900 dark:text-green-100">
                            {formData.description}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">
                            {t('fields.amount.label')}:
                          </span>
                          <span className="font-bold text-green-900 dark:text-green-100">
                            {formatCurrency(Math.abs(parseFloat(formData.amount)))}
                          </span>
                        </div>
                        
                        {formData.isRecurring && (
                          <div className="flex justify-between">
                            <span className="text-green-700 dark:text-green-300">
                              {t('recurring.summary.frequency')}:
                            </span>
                            <span className="font-medium text-green-900 dark:text-green-100">
                              {t(`frequencies.${formData.recurringFrequency}`)}
                              {formData.recurringInterval > 1 && ` (${formData.recurringInterval}x)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('actions.previous')}</span>
                      </Button>
                      
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                      >
                        <span>
                          {isSubmitting 
                            ? t('actions.saving')
                            : mode === 'edit'
                              ? t('actions.update')
                              : t('actions.create')
                          }
                        </span>
                        {!isSubmitting && <CheckCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* Success State */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('recurring.success.title')}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400">
              {formData?.isRecurring 
                ? t('recurring.success.recurringMessage')
                : t('recurring.success.singleMessage')
              }
            </p>
            
            {/* Success animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4"
            >
              <div className="w-24 h-1 bg-green-500 rounded-full mx-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default RecurringSetupModal; 