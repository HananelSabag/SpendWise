/**
 * ⚡ TRANSACTION ACTIONS - Bulk Operations Component
 * Extracted from RecentTransactions.jsx for better performance and maintainability
 * Features: Bulk selection, Bulk operations, Action bar, Mobile-first
 * @version 2.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Edit, Trash2, Copy, Archive, Tag,
  Download, Upload, Star, Flag, MoreHorizontal,
  CheckCircle, AlertTriangle
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useNotifications } from '../../../../stores';

import { Button, Badge, Dropdown, Tooltip } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * ⚡ Bulk Action Bar
 */
const BulkActionBar = ({
  selectedCount = 0,
  onSelectAll,
  onDeselectAll,
  onBulkEdit,
  onBulkDelete,
  onBulkArchive,
  onBulkTag,
  onBulkExport,
  isVisible = false,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');
  const { addNotification } = useNotifications();

  const bulkActions = useMemo(() => [
    {
      id: 'edit',
      label: t('actions.bulkEdit'),
      icon: Edit,
      color: 'text-blue-600',
      action: onBulkEdit
    },
    {
      id: 'tag',
      label: t('actions.bulkTag'),
      icon: Tag,
      color: 'text-green-600',
      action: onBulkTag
    },
    {
      id: 'archive',
      label: t('actions.bulkArchive'),
      icon: Archive,
      color: 'text-yellow-600',
      action: onBulkArchive
    },
    {
      id: 'export',
      label: t('actions.bulkExport'),
      icon: Download,
      color: 'text-purple-600',
      action: onBulkExport
    },
    {
      id: 'delete',
      label: t('actions.bulkDelete'),
      icon: Trash2,
      color: 'text-red-600',
      action: onBulkDelete,
      dangerous: true
    }
  ], [t, onBulkEdit, onBulkTag, onBulkArchive, onBulkExport, onBulkDelete]);

  const handleAction = useCallback((action) => {
    if (selectedCount === 0) {
      addNotification({
        type: 'warning',
        message: t('actions.noSelectionWarning')
      });
      return;
    }

    if (action.dangerous) {
      // Show confirmation for dangerous actions
      if (window.confirm(t('actions.confirmBulkDelete', { count: selectedCount }))) {
        action.action?.();
      }
    } else {
      action.action?.();
    }
  }, [selectedCount, addNotification, t]);

  return (
    <AnimatePresence>
      {isVisible && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
            "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700",
            "px-6 py-4 flex items-center space-x-4",
            className
          )}
        >
          {/* Selection info */}
          <div className="flex items-center space-x-3">
            <Badge variant="primary" size="lg">
              {selectedCount} {t('actions.selected')}
            </Badge>
            
            <div className="flex space-x-2">
              <Tooltip content={t('actions.selectAll')}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSelectAll}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </Tooltip>
              
              <Tooltip content={t('actions.deselectAll')}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDeselectAll}
                >
                  <X className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

          {/* Quick actions */}
          <div className="flex items-center space-x-2">
            {bulkActions.slice(0, 3).map((action) => {
              const Icon = action.icon;
              return (
                <Tooltip key={action.id} content={action.label}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(action)}
                    className={cn(action.color)}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </Tooltip>
              );
            })}

            {/* More actions dropdown */}
            <Dropdown
              trigger={
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              }
            >
              <div className="p-2 w-48">
                {bulkActions.slice(3).map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleAction(action)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                        action.dangerous && "text-red-600 dark:text-red-400"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </Dropdown>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * 🎯 Quick Action Buttons
 */
const QuickActions = ({
  onAddTransaction,
  onImportTransactions,
  onExportAll,
  onRefresh,
  isRefreshing = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');

  const quickActions = [
    {
      id: 'add',
      label: t('actions.addTransaction'),
      icon: Upload,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: onAddTransaction
    },
    {
      id: 'import',
      label: t('actions.importTransactions'),
      icon: Upload,
      color: 'bg-green-500 hover:bg-green-600',
      action: onImportTransactions
    },
    {
      id: 'export',
      label: t('actions.exportAll'),
      icon: Download,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: onExportAll
    }
  ];

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Tooltip key={action.id} content={action.label}>
            <Button
              size="sm"
              onClick={action.action}
              className={cn("text-white", action.color)}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">{action.label}</span>
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
};

/**
 * ⚡ Transaction Actions Main Component
 */
const TransactionActions = ({
  selectedTransactions = new Set(),
  totalTransactions = 0,
  onSelectAll,
  onDeselectAll,
  onBulkEdit,
  onBulkDelete,
  onBulkArchive,
  onBulkTag,
  onBulkExport,
  onAddTransaction,
  onImportTransactions,
  onExportAll,
  onRefresh,
  isRefreshing = false,
  showBulkActions = true,
  showQuickActions = true,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  // Handle select all
  const handleSelectAll = useCallback(() => {
    onSelectAll?.();
  }, [onSelectAll]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    onDeselectAll?.();
  }, [onDeselectAll]);

  // Bulk operation handlers
  const handleBulkEdit = useCallback(() => {
    onBulkEdit?.(Array.from(selectedTransactions));
  }, [onBulkEdit, selectedTransactions]);

  const handleBulkDelete = useCallback(() => {
    onBulkDelete?.(Array.from(selectedTransactions));
  }, [onBulkDelete, selectedTransactions]);

  const handleBulkArchive = useCallback(() => {
    onBulkArchive?.(Array.from(selectedTransactions));
  }, [onBulkArchive, selectedTransactions]);

  const handleBulkTag = useCallback(() => {
    onBulkTag?.(Array.from(selectedTransactions));
  }, [onBulkTag, selectedTransactions]);

  const handleBulkExport = useCallback(() => {
    onBulkExport?.(Array.from(selectedTransactions));
  }, [onBulkExport, selectedTransactions]);

  const selectedCount = selectedTransactions.size;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick actions bar */}
      {showQuickActions && (
        <div className="flex items-center justify-between">
          <QuickActions
            onAddTransaction={onAddTransaction}
            onImportTransactions={onImportTransactions}
            onExportAll={onExportAll}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />

          {/* Selection summary */}
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('selection.summary', { 
                  selected: selectedCount, 
                  total: totalTransactions 
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bulk actions bar */}
      {showBulkActions && (
        <BulkActionBar
          selectedCount={selectedCount}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkEdit={handleBulkEdit}
          onBulkDelete={handleBulkDelete}
          onBulkArchive={handleBulkArchive}
          onBulkTag={handleBulkTag}
          onBulkExport={handleBulkExport}
          isVisible={selectedCount > 0}
        />
      )}
    </div>
  );
};

export default TransactionActions;
export { BulkActionBar, QuickActions }; 