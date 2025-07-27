/**
 * ➕ ADD TRANSACTION MODAL - Clean Architecture
 * Replaces AddTransactions.jsx (629 lines) with clean, focused modal
 * Features: Uses new form foundation, Mobile-first, Performance optimized
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckCircle } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications
} from '../../../../stores';

// ✅ Import our new foundation
import TransactionForm from '../forms/TransactionForm';
import { Modal, Button } from '../../../ui';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';

/**
 * ➕ Add Transaction Modal Component
 */
const AddTransactionModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  defaultType = 'expense',
  defaultCategory = '',
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { createTransaction, isLoading } = useTransactionActions();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    
    try {
      const newTransaction = await createTransaction(formData);
      
      // Show success state briefly
      setShowSuccess(true);
      
      // Notify success
      addNotification({
        type: 'success',
        message: t('notifications.createSuccess'),
        duration: 3000
      });
      
      // Call success callback
      onSuccess?.(newTransaction);
      
      // Close modal after brief success display
      setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to create transaction:', error);
      
      addNotification({
        type: 'error',
        message: error.message || t('notifications.createFailed'),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [createTransaction, addNotification, t, onSuccess, onClose]);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    onClose?.();
  }, [isSubmitting, onClose]);

  // ✅ Default form data
  const defaultFormData = {
    type: defaultType,
    categoryId: defaultCategory
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      className={className}
    >
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('modals.add.title')}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('modals.add.subtitle')}
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

            {/* Modal Body - Transaction Form */}
            <div className="p-6">
              <TransactionForm
                mode="create"
                initialData={defaultFormData}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={isSubmitting || isLoading}
                showRecurring={true}
                showAdvanced={true}
              />
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
              {t('modals.add.success.title')}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400">
              {t('modals.add.success.message')}
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

export default AddTransactionModal; 