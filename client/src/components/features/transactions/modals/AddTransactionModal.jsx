/**
 * ➕ ADD TRANSACTION MODAL - Clean Architecture
 * Replaces AddTransactions.jsx (629 lines) with clean, focused modal
 * Features: Uses new form foundation, Mobile-first, Performance optimized
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, CreditCard, Repeat } from 'lucide-react';

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
  const [active, setActive] = useState('one-time');

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    
    try {
      const newTransaction = await createTransaction(formData);
      
      // Notify success
      addNotification({
        type: 'success',
        message: t('notifications.createSuccess'),
        duration: 3000
      });
      
      // Call success callback
      onSuccess?.(newTransaction);
      
      // Close modal immediately after success toast
      onClose?.();
      
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
      title={t('modals.add.title')}
      size="6xl"
      className={cn("backdrop-blur-sm", className)}
      mobileFullScreen={true}
    >
      <AnimatePresence mode="wait">
        <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Enhanced Modal Body - Optimized for Desktop & Mobile */}
            <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-[500px] md:min-h-[600px]">
              {/* Centered Tab Selector under header */}
              <div className="w-full flex justify-center mb-4">
                <div className="inline-flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                  {[{ id: 'one-time', label: t('formTabs.oneTime.title') }, { id: 'recurring', label: t('formTabs.recurring.title') }].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActive(tab.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${active === tab.id ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {tab.id === 'recurring' ? <Repeat className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-w-none mx-auto">
                <TransactionFormTabs
                  mode="create"
                  initialData={defaultFormData}
                  onSubmit={handleSubmit}
                  onCancel={handleClose}
                  isLoading={isSubmitting || isLoading}
                  className="w-full"
                  activeTabExternal={active}
                  onActiveTabChange={setActive}
                  hideTopCard
                />
              </div>
            </div>
          </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default AddTransactionModal; 