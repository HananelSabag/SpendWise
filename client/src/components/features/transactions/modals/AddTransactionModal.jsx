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
import TransactionFormTabs from '../forms/TransactionFormTabs';
import { Modal, Button } from '../../../ui';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { cn } from '../../../../utils/helpers';

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
      size="6xl"
      className={cn("backdrop-blur-sm", className)}
      mobileFullScreen={true}
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
            {/* Enhanced Modal Header */}
            <div className="flex items-center justify-between p-6 md:p-8 lg:p-10 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {t('modals.add.title')}
                  </h2>
                  <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
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

            {/* Enhanced Modal Body - Optimized for Desktop & Mobile */}
            <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 min-h-[500px] md:min-h-[650px] lg:min-h-[700px]">
              <div className="max-w-none mx-auto">
                <TransactionFormTabs
                  mode="create"
                  initialData={defaultFormData}
                  onSubmit={handleSubmit}
                  onCancel={handleClose}
                  isLoading={isSubmitting || isLoading}
                  className="w-full"
                />
              </div>
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