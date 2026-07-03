/**
 * ➕ ADD TRANSACTION MODAL - Clean Architecture
 * Replaces AddTransactions.jsx (629 lines) with clean, focused modal
 * Features: Uses new form foundation, Mobile-first, Performance optimized
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

// ✅ Import our new foundation
import TransactionForm from '../forms/TransactionForm';
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
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  const { createTransaction, isOperating: isLoading } = useTransactionActions();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Handle form submission — createTransaction (useTransactions) already
  // shows the success/error toast, so we don't duplicate it here.
  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);

    try {
      const newTransaction = await createTransaction(formData);
      onSuccess?.(newTransaction);
      onClose?.();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [createTransaction, onSuccess, onClose]);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    onClose?.();
  }, [isSubmitting, onClose]);

  // ✅ Default form data
  const defaultFormData = { type: defaultType };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('modals.add.title')}
      size="6xl"
      className={cn("backdrop-blur-sm", className)}
      sheet
      drawerWidth={760}
    >
      <AnimatePresence mode="wait">
        <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 sm:p-5">
              <TransactionForm
                mode="create"
                initialData={defaultFormData}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={isSubmitting || isLoading}
                showAdvanced
                className="w-full"
              />
            </div>
          </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default AddTransactionModal; 