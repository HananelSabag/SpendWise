/**
 * 🔄 RECURRING TRANSACTIONS MANAGER - Complete Control Panel
 * Full management interface for user's recurring transactions
 * Features: List all recurring, Edit, Delete, Add new, Preview upcoming
 * @version 1.0.0 - COMPLETE RECURRING MANAGER
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Repeat, X, Plus, Edit3, Trash2, Eye, Calendar,
  Play, Pause, Settings, Filter, Search, ChevronDown,
  ArrowRight, Clock, Target, Zap, RefreshCw
} from 'lucide-react';

// ✅ Import stores and hooks
import {
  useTranslation,
  useNotifications,
  useCurrency
} from '../../../../stores';
import { useRecurringTransactions } from '../../../../hooks/useRecurringTransactions';
import { useTransactionActions } from '../../../../hooks/useTransactionActions';

// ✅ Import components
import { Modal, Button, Card, Badge, LoadingSpinner, Input } from '../../../ui';
import TransactionCard from '../../dashboard/transactions/TransactionCard';
import RecurringSetupModal from './RecurringSetupModal';
import { cn, dateHelpers } from '../../../../utils/helpers';

/**
 * 🔄 Recurring Transaction Item Component
 */
const RecurringTransactionItem = ({ 
  recurring, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onPreview,
  formatCurrency 
}) => {
  const { t } = useTranslation('transactions');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isActive = recurring.status === 'active';
  const nextDate = recurring.next_run_date;
  const frequency = recurring.frequency;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        isActive 
          ? "border-green-200 bg-green-50/30 dark:border-green-700 dark:bg-green-900/10" 
          : "border-gray-200 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-800/30"
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Status Indicator */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              isActive 
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
            )}>
              <Repeat className="w-6 h-6" />
            </div>
            
            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {recurring.description || t('recurring.noDescription')}
                </h4>
                <Badge 
                  variant={isActive ? "success" : "secondary"}
                  size="sm"
                >
                  {isActive ? t('recurring.active') : t('recurring.paused')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{recurring.category_name || t('category.uncategorized')}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {t(`recurring.frequency.${frequency}`, frequency)}
                </span>
                {nextDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {t('recurring.nextRun')}: {dateHelpers.formatShort(nextDate)}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Amount */}
            <div className="text-right">
              <div className={cn(
                "font-bold text-lg",
                recurring.type === 'income' ? "text-green-600" : "text-red-600"
              )}>
                {recurring.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(recurring.amount))}
              </div>
              <div className="text-sm text-gray-500">
                {t(`transaction.type.${recurring.type}`)}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(recurring)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(recurring)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(recurring)}
              className={cn(
                isActive 
                  ? "text-orange-600 hover:text-orange-700" 
                  : "text-green-600 hover:text-green-700"
              )}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(recurring)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400"
            >
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-180"
              )} />
            </Button>
          </div>
        </div>
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t('recurring.created')}:
                  </span>
                  <div className="text-gray-500">
                    {dateHelpers.formatMedium(recurring.created_at)}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t('recurring.totalRuns')}:
                  </span>
                  <div className="text-gray-500">
                    {recurring.execution_count || 0}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t('recurring.lastRun')}:
                  </span>
                  <div className="text-gray-500">
                    {recurring.last_run_date 
                      ? dateHelpers.formatMedium(recurring.last_run_date)
                      : t('recurring.never')
                    }
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t('recurring.endDate')}:
                  </span>
                  <div className="text-gray-500">
                    {recurring.end_date 
                      ? dateHelpers.formatMedium(recurring.end_date)
                      : t('recurring.indefinite')
                    }
                  </div>
                </div>
              </div>
              
              {recurring.notes && (
                <div className="mt-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.notes')}:
                  </span>
                  <div className="text-gray-500 mt-1">
                    {recurring.notes}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * 🔄 Main Recurring Transactions Manager Component
 */
const RecurringTransactionsManager = ({
  isOpen = false,
  onClose,
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  
  // ✅ State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused
  const [typeFilter, setTypeFilter] = useState('all'); // all, income, expense
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // ✅ Data fetching and actions from recurring hook
  const {
    recurringTransactions,
    loading,
    error,
    refetch,
    updateRecurring,
    deleteRecurring,
    createRecurring
  } = useRecurringTransactions();
  
  // ✅ Filtered recurring transactions - FIXED: Ensure array safety
  const filteredRecurring = useMemo(() => {
    if (!recurringTransactions || !Array.isArray(recurringTransactions)) return [];
    
    return recurringTransactions.filter(recurring => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!recurring.description?.toLowerCase().includes(searchLower) &&
            !recurring.category_name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && recurring.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && recurring.type !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [recurringTransactions, searchQuery, statusFilter, typeFilter]);
  
  // ✅ Statistics - FIXED: Ensure array safety
  const stats = useMemo(() => {
    if (!recurringTransactions || !Array.isArray(recurringTransactions)) return { total: 0, active: 0, paused: 0 };
    
    return {
      total: recurringTransactions.length,
      active: recurringTransactions.filter(r => r.status === 'active').length,
      paused: recurringTransactions.filter(r => r.status === 'paused').length
    };
  }, [recurringTransactions]);
  
  // ✅ Event handlers
  const handleEdit = useCallback((recurring) => {
    setSelectedRecurring(recurring);
    setShowEditModal(true);
  }, []);
  
  const handleDelete = useCallback(async (recurring) => {
    if (!confirm(t('recurring.confirmDelete', { name: recurring.description }))) {
      return;
    }
    
    try {
      await deleteRecurring(recurring.id);
      addNotification({
        type: 'success',
        message: t('recurring.deleteSuccess')
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('recurring.deleteFailed')
      });
    }
  }, [deleteRecurring, addNotification, t, refetch]);
  
  const handleToggleStatus = useCallback(async (recurring) => {
    const newStatus = recurring.status === 'active' ? 'paused' : 'active';
    
    try {
      await updateRecurring(recurring.id, { status: newStatus });
      addNotification({
        type: 'success',
        message: t('recurring.statusUpdated')
      });
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('recurring.statusUpdateFailed')
      });
    }
  }, [updateRecurring, addNotification, t, refetch]);
  
  const handlePreview = useCallback((recurring) => {
    setSelectedRecurring(recurring);
    setShowPreview(true);
  }, []);
  
  const handleAddNew = useCallback(() => {
    setSelectedRecurring(null);
    setShowAddModal(true);
  }, []);
  
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        className={className}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Repeat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('recurringManager.title', 'Recurring Transactions')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('recurringManager.subtitle', 'Manage your recurring transactions')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              
              <Button
                variant="primary"
                onClick={handleAddNew}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('recurringManager.addNew', { fallback: 'Add New' })}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-500">{t('recurringManager.total', { fallback: 'Total' })}</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-500">{t('recurringManager.active', { fallback: 'Active' })}</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.paused}</div>
              <div className="text-sm text-gray-500">{t('recurringManager.paused', { fallback: 'Paused' })}</div>
            </Card>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <Input
                type="text"
                placeholder={t('recurringManager.searchPlaceholder', { fallback: 'Search recurring transactions...' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={Search}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">{t('recurringManager.filter.allStatus', { fallback: 'All Status' })}</option>
              <option value="active">{t('recurringManager.filter.active', { fallback: 'Active Only' })}</option>
              <option value="paused">{t('recurringManager.filter.paused', { fallback: 'Paused Only' })}</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">{t('recurringManager.filter.allTypes', { fallback: 'All Types' })}</option>
              <option value="income">{t('transaction.type.income', { fallback: t('types.income', 'Income') })}</option>
              <option value="expense">{t('transaction.type.expense', { fallback: t('types.expense', 'Expense') })}</option>
            </select>
          </div>
          
          {/* Content */}
            {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-500">
                {t('recurringManager.loading', { fallback: 'Loading recurring transactions...' })}
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{t('recurring.loadError')}</div>
              <Button onClick={handleRefresh} variant="outline">
                {t('common.retry')}
              </Button>
            </div>
          ) : filteredRecurring.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? t('recurringManager.noMatches', { fallback: 'No Matching Transactions' })
                  : t('recurringManager.noRecurring', { fallback: 'No Recurring Transactions' })
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? t('recurringManager.noMatchesDesc', { fallback: 'Try adjusting your filters' })
                  : t('recurringManager.noRecurringDesc', { fallback: 'Create recurring transactions to automate your finance tracking' })
                }
              </p>
              <Button onClick={handleAddNew} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                {t('recurringManager.addFirst', { fallback: 'Add First Recurring' })}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredRecurring.map((recurring) => (
                <RecurringTransactionItem
                  key={recurring.id}
                  recurring={recurring}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  onPreview={handlePreview}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
      
      {/* Add New Recurring Modal */}
      <RecurringSetupModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="create"
        onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }}
      />
      
      {/* Edit Recurring Modal */}
      <RecurringSetupModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRecurring(null);
        }}
        mode="edit"
        initialData={selectedRecurring}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedRecurring(null);
          refetch();
        }}
      />
    </>
  );
};

export default RecurringTransactionsManager;