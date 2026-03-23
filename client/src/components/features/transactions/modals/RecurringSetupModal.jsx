/**
 * 🔄 RECURRING SETUP MODAL
 * Single-step form for creating/editing recurring transaction templates.
 * Clean, focused, mobile-first.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, CheckCircle } from 'lucide-react';

import { useTranslation, useNotifications } from '../../../../stores';
import TransactionForm from '../forms/TransactionForm';
import { Modal } from '../../../ui';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';

const RecurringSetupModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  initialData = null,
  mode = 'create', // 'create' | 'edit'
  className = '',
}) => {
  const { t } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { createRecurringTemplate, updateRecurringTemplate, isLoading } = useTransactionActions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const resetModal = useCallback(() => {
    setShowSuccess(false);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetModal();
    onClose?.();
  }, [isSubmitting, resetModal, onClose]);

  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'edit' && initialData?.id) {
        result = await updateRecurringTemplate(initialData.id, formData);
      } else {
        result = await createRecurringTemplate(formData);
      }

      setShowSuccess(true);
      addNotification({
        type: 'success',
        message: mode === 'edit'
          ? t('notifications.recurringUpdateSuccess', 'Template updated')
          : t('notifications.recurringCreateSuccess', 'Template created'),
        duration: 3000,
      });
      onSuccess?.(result);

      setTimeout(() => {
        setShowSuccess(false);
        resetModal();
        onClose?.();
      }, 1200);
    } catch (error) {
      addNotification({
        type: 'error',
        message: error?.message || (mode === 'edit'
          ? t('notifications.recurringUpdateFailed', 'Failed to update')
          : t('notifications.recurringCreateFailed', 'Failed to create')),
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, initialData, createRecurringTemplate, updateRecurringTemplate, addNotification, t, onSuccess, onClose, resetModal]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      className={className}
      sheet
      drawerWidth={520}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 flex flex-col items-center text-center px-8"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === 'edit'
                ? t('recurring.success.updatedTitle', 'Template Updated')
                : t('recurring.success.title', 'Template Created')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('recurring.success.recurringMessage', 'Your recurring schedule is active')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {mode === 'edit'
                    ? t('recurring.modal.editTitle', 'Edit Recurring Template')
                    : t('recurring.modal.createTitle', 'New Recurring Template')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('recurring.modal.subtitle', 'Automate your repeating transactions')}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="p-5">
              <TransactionForm
                mode={mode}
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={isSubmitting || isLoading}
                showRecurring={true}
                showAdvanced={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default RecurringSetupModal;
