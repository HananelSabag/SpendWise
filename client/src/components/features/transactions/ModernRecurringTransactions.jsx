/**
 * 🔄 MODERN RECURRING TRANSACTIONS LIST - For Recurring Tab
 * Shows recurring templates in a list format instead of modal
 * Features: Direct template management, edit actions, status control
 * @version 1.0.0 - LIST VIEW DESIGN
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Plus, Edit, Trash2, Copy, Play, Pause, X,
  DollarSign, Repeat, Calendar, Clock, Target,
  AlertCircle, CheckCircle, TrendingUp, TrendingDown,
  Sparkles, Eye, BarChart3, Users
} from 'lucide-react';

// ✅ Import stores and hooks
import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { useRecurringTransactions } from '../../../hooks/useRecurringTransactions';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { Button, Card, LoadingSpinner, Badge } from '../../ui';

// ✅ DEDICATED ACTION COMPONENT
import RecurringTransactionActions from './actions/RecurringTransactionActions';
import { cn, dateHelpers } from '../../../utils/helpers';

// ✨ Animation Variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// ✨ Modern Stats Card for Summary
const RecurringSummaryCard = ({ title, value, icon: Icon, color = 'blue', trend, isCurrency = true }) => {
  const { formatCurrency } = useCurrency();
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 shadow-lg border-2",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-xl transition-all duration-300"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-5",
        color === 'green' && "bg-gradient-to-br from-green-400 to-emerald-600",
        color === 'purple' && "bg-gradient-to-br from-purple-400 to-violet-600",
        color === 'blue' && "bg-gradient-to-br from-blue-400 to-indigo-600"
      )} />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' && isCurrency ? formatCurrency(value) : value}
          </p>
        </div>
        
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};

// 🔄 Recurring Template Card Component
const RecurringTemplateCard = ({ 
  template, 
  onEdit, 
  onDelete,
  onToggleStatus
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  const isIncome = template.type === 'income';
  const isActive = template.is_active;
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "p-5 rounded-xl border-2 transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        isActive 
          ? "border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl"
          : "border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
            isIncome 
              ? "bg-gradient-to-br from-green-500 to-emerald-600" 
              : "bg-gradient-to-br from-red-500 to-pink-600"
          )}>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={template.interval_type === 'monthly' ? 'default' : 'secondary'}
                className="text-xs"
              >
                <Repeat className="w-3 h-3 mr-1" />
                {template.interval_type}
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                • {template.category_name}
              </span>
            </div>
          </div>
        </div>

        <Badge 
          variant={isActive ? "success" : "secondary"}
          className="text-xs font-medium"
        >
          {isActive ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 mr-1" />
              Paused
            </>
          )}
        </Badge>
      </div>

      {/* Amount and Details */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">
          <span className={cn(
            isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {isIncome ? '+' : '-'}{formatCurrency(template.amount)}
          </span>
        </div>

        {template.next_run_date && (
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Next Run</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dateHelpers.format(template.next_run_date, 'MMM dd')}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Actions - Mobile Optimized */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 overflow-hidden">
        <div className="flex flex-wrap gap-2 sm:gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(template)}
            className="flex-1 min-w-0 text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="truncate">Edit</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template)}
            className="flex-1 min-w-0 text-red-600 hover:text-red-700 text-xs sm:text-sm"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="truncate">Delete</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const duplicateTemplate = {
                ...template,
                id: null,
                name: `${template.name} (Copy)`
              };
              onEdit(duplicateTemplate);
            }}
            className="flex-1 min-w-0 text-purple-600 hover:text-purple-700 text-xs sm:text-sm"
          >
            <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="truncate">Copy</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// 🔄 MAIN MODERN RECURRING TRANSACTIONS COMPONENT
const ModernRecurringTransactions = ({ onOpenRecurringManager }) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  
  // ✅ Get recurring transactions data
  const {
    recurringTransactions: templates,
    stats,
    isLoading,
    refetch
  } = useRecurringTransactions();

  // ✅ Transaction actions
  const { 
    deleteTemplate,
    updateRecurringTemplate,
    createRecurringTemplate 
  } = useTransactionActions();

  // ✅ Process templates and calculate summary
  const { activeTemplates, pausedTemplates, summary } = useMemo(() => {
    if (!templates) return { activeTemplates: [], pausedTemplates: [], summary: {} };
    
    const active = templates.filter(t => t.is_active);
    const paused = templates.filter(t => !t.is_active);
    
    const summaryData = {
      totalCount: templates.length,
      activeCount: active.length,
      pausedCount: paused.length,
      totalMonthlyIncome: active.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
      totalMonthlyExpenses: active.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    };
    summaryData.netMonthly = (summaryData.totalMonthlyIncome || 0) - (summaryData.totalMonthlyExpenses || 0);
    
    return {
      activeTemplates: active,
      pausedTemplates: paused,
      summary: summaryData
    };
  }, [templates]);

  // ✅ Event handlers
  const handleToggleStatus = useCallback(async (template) => {
    try {
      await updateRecurringTemplate(template.id, {
        is_active: !template.is_active
      });
      refetch();
    } catch (error) {
      console.error('Failed to toggle template status:', error);
    }
  }, [updateRecurringTemplate, refetch]);

  const handleEdit = useCallback((template) => {
    // Open the recurring manager in edit mode
    onOpenRecurringManager(template);
  }, [onOpenRecurringManager]);

  const handleDelete = useCallback((template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async (scope) => {
    if (!templateToDelete) return;
    
    try {
      await deleteTemplate(templateToDelete.id, { scope });
      refetch();
    } catch (error) {
      console.error('Failed to delete template:', error);
    } finally {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  }, [templateToDelete, deleteTemplate, refetch]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  }, []);

  // ✅ REMOVED: Duplication feature as requested by user
  // const handleDuplicate = useCallback((template) => {
  //   const duplicateTemplate = {
  //     ...template,
  //     id: null,
  //     name: `${template.name} (Copy)`
  //   };
  //   onOpenRecurringManager(duplicateTemplate);
  // }, [onOpenRecurringManager]);

  if (isLoading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex items-center justify-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-gray-600 dark:text-gray-400">
              {t('recurringManager.loading', 'Loading recurring transactions...')}
            </span>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!templates?.length) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/40 dark:to-violet-900/40 rounded-full flex items-center justify-center">
              <Repeat className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('recurringManager.noRecurring', 'No Recurring Templates')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                {t('recurringManager.noRecurringDesc', 'Create recurring transactions to automate your finance tracking')}
              </p>
              <Button 
                onClick={onOpenRecurringManager}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('recurringManager.addFirst', 'Add First Template')}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >


      {/* ✨ Recurring Templates List */}
      <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Header - Mobile Optimized Layout */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          {/* Mobile: Stacked Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Recurring Transactions
                  </h2>
                </div>
              </div>
              <Button
                onClick={onOpenRecurringManager}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
              >
                <Settings className="w-4 h-4 mr-1" />
                Manage
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 ml-13">
              {summary.totalCount} templates • {summary.activeCount} active
            </p>
          </div>

          {/* Desktop: Original Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Repeat className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('transactions.recurring.title', 'Recurring Transactions')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('transactions.recurring.description', 'Manage your recurring transactions and templates')} • {summary.totalCount} {t('transactions.total', 'total')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={onOpenRecurringManager}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('recurringManager.title', 'Manage Templates')}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Active Templates */}
          {activeTemplates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('recurringManager.active', 'Active Templates')} ({activeTemplates.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeTemplates.map((template) => (
                  <RecurringTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Templates */}
          {pausedTemplates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Pause className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('recurringManager.paused', 'Paused Templates')} ({pausedTemplates.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pausedTemplates.map((template) => (
                  <RecurringTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {summary.activeCount} active • {summary.pausedCount} paused
            </span>
            
            <span className="text-green-600 dark:text-green-400 font-medium">
              Monthly Net: {formatCurrency(summary.netMonthly || 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* 🗑️ Smart Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && templateToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl",
                "border border-gray-200 dark:border-gray-700 overflow-hidden"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('recurring.deleteTemplate', 'Delete Template')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {templateToDelete.name || templateToDelete.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCancel}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t('recurring.deleteChoose', 'Choose what to delete:')}
                </p>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => handleDeleteConfirm('template_only')}
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t('recurring.deleteTemplateOnly', 'Template only (keep transactions)')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('recurring.deleteTemplateOnlyDesc', 'Deactivate template but keep all transaction history')}
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    onClick={() => handleDeleteConfirm('future')}
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t('recurring.deleteFuture', 'Template + future transactions')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('recurring.deleteFutureDesc', 'Remove template and all future scheduled transactions')}
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => handleDeleteConfirm('current_and_future')}
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t('recurring.deleteCurrentAndFuture', 'Template + current month & future')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('recurring.deleteCurrentAndFutureDesc', 'Remove template and transactions from this month forward')}
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                    onClick={() => handleDeleteConfirm('all')}
                  >
                    <div>
                      <div className="font-medium text-red-600 dark:text-red-400">
                        {t('recurring.deleteAll', 'Template + all transactions')}
                      </div>
                      <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                        {t('recurring.deleteAllDesc', 'Permanently remove template and entire transaction history')}
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="ghost"
                  onClick={handleDeleteCancel}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModernRecurringTransactions;
