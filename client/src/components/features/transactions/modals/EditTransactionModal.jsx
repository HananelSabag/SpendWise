/**
 * ✏️ EDIT TRANSACTION MODAL - Clean Architecture
 * Replaces EditTransactionPanel.jsx (665 lines) with clean, focused modal
 * Features: Uses new form foundation, Mobile-first, Performance optimized
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

// ✅ Import our new foundation
import TransactionForm from '../forms/TransactionForm';
import { Modal } from '../../../ui';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { cn } from '../../../../utils/helpers';

/**
 * ✏️ Edit Transaction Modal Component
 * Delete/duplicate entry points live on the transaction card — this modal
 * only edits (or, in duplicate mode, creates the copy).
 */
const EditTransactionModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  transaction = null,
  mode = 'edit', // edit, duplicate, view
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  const { createTransaction, updateTransaction, isOperating: isLoading } = useTransactionActions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Modal title based on mode
  const modalTitle = useMemo(() => {
    switch (mode) {
      case 'duplicate': return t('modals.edit.duplicate.title');
      case 'view':      return t('modals.edit.view.title');
      default:          return t('modals.edit.edit.title');
    }
  }, [mode, t]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    if (!transaction) return;
    
    setIsSubmitting(true);
    
    try {
      let result;

      if (mode === 'duplicate') {
        // Duplicate = create a NEW transaction from the form values. (This
        // used to call the parent's onDuplicate, which only re-opens this
        // modal — the "duplicate" then reported success without creating
        // anything.)
        result = await createTransaction(formData);
      } else {
        // Update existing transaction
        result = await updateTransaction(transaction.id, formData);
      }
      
      // Show success state briefly (updateTransaction already toasts).
      setShowSuccess(true);
      onSuccess?.(result);

      // Close modal after brief success display
      setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
      }, 1500);

    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [transaction, mode, createTransaction, updateTransaction, onSuccess, onClose]);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    onClose?.();
  }, [isSubmitting, onClose]);

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="5xl"
      className={cn("backdrop-blur-sm", className)}
      sheet
      drawerWidth={760}
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
              <div className="p-4 sm:p-5">
                <TransactionForm
                  mode={mode}
                  initialData={transaction}
                  onSubmit={handleSubmit}
                  onCancel={handleClose}
                  isLoading={isSubmitting || isLoading}
                  showAdvanced={mode !== 'view'}
                  className="w-full"
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
                {mode === 'duplicate' 
                  ? t('modals.edit.success.duplicateTitle')
                  : t('modals.edit.success.updateTitle')
                }
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400">
                {mode === 'duplicate'
                  ? t('modals.edit.success.duplicateMessage')
                  : t('modals.edit.success.updateMessage')
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

export default EditTransactionModal;