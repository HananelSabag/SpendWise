/**
 * 📄 ONE-TIME TRANSACTION ACTIONS - Dedicated Component
 * Handles actions specific to one-time transactions
 * Features: Edit, Delete, Duplicate - simple single-occurrence actions
 * @version 1.0.0 - DEDICATED ACTIONS
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit, Trash2, Copy, AlertTriangle, MoreVertical,
  DollarSign, Receipt, Eye
} from 'lucide-react';

import { useTranslation, useCurrency } from '../../../../stores';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const OneTimeTransactionActions = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onSuccess,
  className = "",
  variant = "inline", // "inline" | "compact" | "dropdown"
  showLabels = false
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { deleteTransaction } = useTransactionActions();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ ONE-TIME TRANSACTION ACTIONS
  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction, 'edit');
    }
  };

  const handleDelete = () => {
    // ✅ FIXED: Use parent handler if provided, otherwise show our own modal
    if (onDelete) {
      onDelete(transaction);
    } else {
      setShowDeleteModal(true);
    }
  };

  // ✅ FIXED: Only handle actual deletion when parent handlers aren't available
  const handleActualDelete = async () => {
    if (!confirm(t('transactions.delete.confirmDelete', { description: transaction.description }))) return;
    
    setIsLoading(true);
    try {
      // Simple deletion for one-time transactions
      await deleteTransaction(transaction.id, { deleteSingle: true });
      onSuccess?.('deleted');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(transaction);
    } else if (onEdit) {
      // Fallback: open edit modal in duplicate mode
      onEdit(transaction, 'duplicate');
    }
  };

  const handleViewDetails = () => {
    if (onEdit) {
      onEdit(transaction, 'view');
    }
  };

  // ✅ SIMPLE DELETE CONFIRMATION MODAL
  const DeleteModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowDeleteModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('transactions.delete.title', 'Delete Transaction')}
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {t('transactions.delete.description', 'Are you sure you want to delete this transaction?')}
        </p>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6">
          <div className="font-medium text-gray-900 dark:text-white">
            {transaction.description}
          </div>
          <div className={cn(
            "text-lg font-bold",
            transaction.type === 'income' ? "text-green-600" : "text-red-600"
          )}>
            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString()}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('transactions.delete.warning', 'This action cannot be undone.')}
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDeleteModal(false)}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleActualDelete}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isLoading ? t('actions.deleting', 'Deleting...') : t('actions.delete', 'Delete')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );

  // ✅ RENDER ACTIONS BASED ON VARIANT
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-700 text-xs"
        >
          <Edit className="w-3 h-3 mr-1" />
          {showLabels && 'Edit'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="text-purple-600 hover:text-purple-700 text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          {showLabels && 'Copy'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700 text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          {showLabels && 'Delete'}
        </Button>

        {showDeleteModal && <DeleteModal />}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="text-blue-600 hover:text-blue-700"
        >
          <Edit className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicate}
          className="text-purple-600 hover:text-purple-700"
        >
          <Copy className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {showDeleteModal && <DeleteModal />}
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
        
        {/* Dropdown menu would be implemented here */}
        {/* For now, fallback to inline */}
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-32 z-10">
          <button
            onClick={handleEdit}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        {showDeleteModal && <DeleteModal />}
      </div>
    );
  }

  // Default: button group
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
      >
        <Edit className="w-4 h-4 mr-1" />
        Edit
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDuplicate}
      >
        <Copy className="w-4 h-4 mr-1" />
        Duplicate
      </Button>
      
              <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>

      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default OneTimeTransactionActions;
