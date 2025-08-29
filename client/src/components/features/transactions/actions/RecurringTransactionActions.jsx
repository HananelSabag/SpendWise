/**
 * 🔄 RECURRING TRANSACTION ACTIONS - Dedicated Component
 * Handles actions specific to recurring transactions and templates
 * Features: Edit template, Delete template, Pause/Resume, Stop generation
 * @version 1.0.0 - DEDICATED ACTIONS
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit, Trash2, Play, Pause, Copy, StopCircle, 
  Settings, AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';
import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const RecurringTransactionActions = ({ 
  transaction, 
  template, 
  onEdit, 
  onDelete, 
  onSuccess,
  className = "",
  variant = "dropdown" // "dropdown" | "inline" | "compact"
}) => {
  const { t } = useTranslation();
  const { 
    deleteTemplate, 
    updateRecurringTemplate,
    deleteTransaction 
  } = useTransactionActions();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ Determine if this is a template or a transaction instance
  const isTemplate = !!template;
  const item = template || transaction;
  const isActive = template?.is_active ?? true;

  // ✅ TEMPLATE ACTIONS
  const handleEditTemplate = () => {
    if (onEdit) {
      onEdit(template, 'edit');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!confirm(t('recurring.confirmDeleteTemplate', { name: template.name }))) return;
    
    setIsLoading(true);
    try {
      await deleteTemplate(template.id);
      onSuccess?.('template_deleted');
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTemplate = async () => {
    setIsLoading(true);
    try {
      await updateRecurringTemplate(template.id, {
        is_active: !isActive
      });
      onSuccess?.('template_toggled');
    } catch (error) {
      console.error('Failed to toggle template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateTemplate = () => {
    if (onEdit) {
      onEdit({ ...template, id: null, name: `${template.name} (Copy)` }, 'duplicate');
    }
  };

  // ✅ TRANSACTION INSTANCE ACTIONS (for recurring transactions)
  const handleEditInstance = () => {
    if (onEdit) {
      onEdit(transaction, 'edit');
    }
  };

  const handleDeleteInstance = async (deleteType = 'current') => {
    const options = {
      deleteType,
      templateId: transaction.template_id
    };

    setIsLoading(true);
    try {
      await deleteTransaction(transaction.id, options);
      onSuccess?.('instance_deleted');
    } catch (error) {
      console.error('Failed to delete transaction instance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ DELETE MODAL for complex recurring deletion options
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
            {t('transactions.delete.recurring.title', 'Delete Recurring Transaction')}
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('transactions.delete.recurring.options', 'What would you like to delete?')}
        </p>

        <div className="space-y-3">
          {/* Delete Current Only */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              handleDeleteInstance('current');
              setShowDeleteModal(false);
            }}
            disabled={isLoading}
          >
            <Clock className="w-4 h-4 mr-3" />
            <div className="text-left">
              <div className="font-medium">{t('transactions.delete.recurring.single', 'This Occurrence Only')}</div>
              <div className="text-xs text-gray-500">{t('transactions.delete.recurring.singleDescription', 'Delete only this single transaction')}</div>
            </div>
          </Button>

          {/* Delete Future */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              handleDeleteInstance('future');
              setShowDeleteModal(false);
            }}
            disabled={isLoading}
          >
            <StopCircle className="w-4 h-4 mr-3" />
            <div className="text-left">
              <div className="font-medium">{t('transactions.delete.recurring.future', 'This and Future')}</div>
              <div className="text-xs text-gray-500">{t('transactions.delete.recurring.futureDescription', 'Delete this and all future occurrences')}</div>
            </div>
          </Button>

          {/* Delete All */}
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => {
              handleDeleteInstance('all');
              setShowDeleteModal(false);
            }}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-3" />
            <div className="text-left">
              <div className="font-medium">{t('transactions.delete.recurring.all', 'All Occurrences')}</div>
              <div className="text-xs text-gray-500">{t('transactions.delete.recurring.allDescription', 'Delete all past and future occurrences')}</div>
            </div>
          </Button>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowDeleteModal(false)}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );

  // ✅ RENDER ACTIONS BASED ON VARIANT
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isTemplate ? (
          // Template actions
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleTemplate}
              disabled={isLoading}
              className={cn(
                "text-xs",
                isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"
              )}
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditTemplate}
              className="text-blue-600 hover:text-blue-700 text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicateTemplate}
              className="text-purple-600 hover:text-purple-700 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteTemplate}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 text-xs"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </>
        ) : (
          // Transaction instance actions
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditInstance}
              className="text-blue-600 hover:text-blue-700 text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </>
        )}

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
          onClick={isTemplate ? handleEditTemplate : handleEditInstance}
          className="text-blue-600 hover:text-blue-700"
        >
          <Edit className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={isTemplate ? handleDeleteTemplate : () => setShowDeleteModal(true)}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {showDeleteModal && <DeleteModal />}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={cn("relative", className)}>
      {/* Dropdown implementation would go here */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={isTemplate ? handleEditTemplate : handleEditInstance}
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={isTemplate ? handleDeleteTemplate : () => setShowDeleteModal(true)}
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default RecurringTransactionActions;
