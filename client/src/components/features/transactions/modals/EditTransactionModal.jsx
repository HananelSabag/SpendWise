/**
 * ✏️ EDIT TRANSACTION MODAL - Clean Architecture
 * Replaces EditTransactionPanel.jsx (665 lines) with clean, focused modal
 * Features: Uses new form foundation, Mobile-first, Performance optimized
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, X, CheckCircle, Copy, Trash2, 
  MoreVertical, Calendar, AlertTriangle 
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useNotifications
} from '../../../../stores';

// ✅ Import our new foundation
import TransactionForm from '../forms/TransactionForm';
import { Modal, Button, Dropdown } from '../../../ui';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { cn } from '../../../../utils/helpers';

/**
 * ✏️ Edit Transaction Modal Component
 */
const EditTransactionModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  onDelete,
  onDuplicate,
  transaction = null,
  mode = 'edit', // edit, duplicate, view
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { updateTransaction, deleteTransaction, isLoading } = useTransactionActions();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ Modal title and subtitle based on mode
  const modalConfig = useMemo(() => {
    switch (mode) {
      case 'duplicate':
        return {
          title: t('modals.edit.duplicate.title'),
          subtitle: t('modals.edit.duplicate.subtitle'),
          icon: Copy,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30'
        };
      case 'view':
        return {
          title: t('modals.edit.view.title'),
          subtitle: t('modals.edit.view.subtitle'),
          icon: Calendar,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-700/30'
        };
      default:
        return {
          title: t('modals.edit.edit.title'),
          subtitle: t('modals.edit.edit.subtitle'),
          icon: Edit3,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30'
        };
    }
  }, [mode, t]);

  const IconComponent = modalConfig.icon;

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    if (!transaction) return;
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (mode === 'duplicate') {
        // Create new transaction (handled by parent)
        result = await onDuplicate?.(formData);
      } else {
        // Update existing transaction
        result = await updateTransaction(transaction.id, formData);
      }
      
      // Show success state briefly
      setShowSuccess(true);
      
      // Notify success
      addNotification({
        type: 'success',
        message: mode === 'duplicate' 
          ? t('notifications.duplicateSuccess')
          : t('notifications.updateSuccess'),
        duration: 3000
      });
      
      // Call success callback
      onSuccess?.(result);
      
      // Close modal after brief success display
      setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save transaction:', error);
      
      addNotification({
        type: 'error',
        message: error.message || (mode === 'duplicate' 
          ? t('notifications.duplicateFailed')
          : t('notifications.updateFailed')),
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [transaction, mode, updateTransaction, onDuplicate, addNotification, t, onSuccess, onClose]);

  // ✅ Handle delete
  const handleDelete = useCallback(async () => {
    if (!transaction) return;
    
    try {
      await deleteTransaction(transaction.id);
      
      addNotification({
        type: 'success',
        message: t('notifications.deleteSuccess'),
        duration: 3000
      });
      
      onDelete?.(transaction);
      onClose?.();
      
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      
      addNotification({
        type: 'error',
        message: error.message || t('notifications.deleteFailed'),
        duration: 4000
      });
    }
    
    setShowDeleteConfirm(false);
  }, [transaction, deleteTransaction, addNotification, t, onDelete, onClose]);

  // ✅ Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    onClose?.();
  }, [isSubmitting, onClose]);

  // ✅ Action menu items
  const actionMenuItems = useMemo(() => {
    const items = [];
    
    if (mode === 'edit') {
      items.push({
        label: t('actions.duplicate'),
        icon: Copy,
        onClick: () => onDuplicate?.(transaction)
      });
    }
    
    if (mode !== 'view') {
      items.push({
        label: t('actions.delete'),
        icon: Trash2,
        onClick: () => setShowDeleteConfirm(true),
        variant: 'danger'
      });
    }
    
    return items;
  }, [mode, t, transaction, onDuplicate]);

  if (!transaction) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="5xl"
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
              <div className="flex items-center justify-between p-6 md:p-8 lg:p-10 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${modalConfig.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${modalConfig.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {modalConfig.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {modalConfig.subtitle}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Action Menu */}
                  {actionMenuItems.length > 0 && (
                    <Dropdown
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      }
                      items={actionMenuItems}
                    />
                  )}
                  
                  {/* Close Button */}
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
              </div>

              {/* Enhanced Modal Body - Better Desktop Spacing */}
              <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-none mx-auto">
                  <TransactionForm
                    mode={mode}
                    initialData={transaction}
                    onSubmit={handleSubmit}
                    onCancel={handleClose}
                    isLoading={isSubmitting || isLoading}
                    showRecurring={mode !== 'view'}
                    showAdvanced={mode !== 'view'}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="md"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('modals.delete.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('modals.delete.subtitle')}
              </p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">
              {t('modals.delete.warning', { 
                description: transaction?.description,
                amount: transaction?.amount 
              })}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex-1"
            >
              {t('actions.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditTransactionModal; 