/**
 * 🌟 MODERN RECURRING MANAGER PANEL - Revolutionary Design
 * Features: Stunning visuals, Perfect animations, Advanced recurring management
 * Mobile-first, Premium UX matching the new modern design system
 * @version 1.0.0 - REVOLUTIONARY DESIGN
 */

import React, { useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Repeat, Calendar, Plus, Search, Filter, RefreshCw, X, Layers, Clock,
  ArrowRight, Settings, TrendingUp, TrendingDown, BarChart3, Users,
  Play, Pause, Edit, Trash2, Copy, Eye, EyeOff, Target, Sparkles,
  CheckCircle, AlertCircle, Zap, Star, Activity, DollarSign
} from 'lucide-react';

import { useTranslation, useNotifications, useCurrency, useTheme } from '../../../../stores';
import { useRecurringTransactions } from '../../../../hooks/useRecurringTransactions';
import { useUpcomingTransactions } from '../../../../hooks/useUpcomingTransactions';
import { Button, Card, Input, LoadingSpinner, Badge, Modal } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';
import RecurringSetupModal from '../modals/RecurringSetupModal';

// ✨ Enhanced Animation Variants
const panelVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.3 }
  }
};

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
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

// ✨ Modern Stats Card Component
const ModernStatsCard = ({ title, value, change, icon: Icon, color = 'blue', trend }) => {
  const { formatCurrency } = useCurrency();
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "relative overflow-hidden rounded-2xl p-3 sm:p-6 shadow-xl border-2",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:shadow-2xl transition-all duration-300"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 opacity-5",
        color === 'green' && "bg-gradient-to-br from-green-400 to-emerald-600",
        color === 'purple' && "bg-gradient-to-br from-purple-400 to-violet-600",
        color === 'blue' && "bg-gradient-to-br from-blue-400 to-indigo-600",
        color === 'orange' && "bg-gradient-to-br from-orange-400 to-amber-600"
      )} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {typeof value === 'number' && title.toLowerCase().includes('amount') 
              ? formatCurrency(value) 
              : value
            }
          </p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          "w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          color === 'orange' && "bg-gradient-to-br from-orange-500 to-amber-600 text-white"
        )}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// ✨ Modern Recurring Template Card - MOBILE OPTIMIZED
const ModernTemplateCard = ({ 
  template, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  className = '' 
}) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  const isActive = template.is_active;
  const isIncome = template.type === 'income';
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "relative group rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border-2 transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        isActive 
          ? "border-purple-200 dark:border-purple-800"
          : "border-gray-200 dark:border-gray-700 opacity-75",
        "hover:shadow-xl",
        className
      )}
    >
      {/* Status Indicator - Mobile Optimized */}
      <div className={cn("absolute top-3 sm:top-4", isRTL ? "left-3 sm:left-4" : "right-3 sm:right-4")}>
        <div className={cn(
          "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full",
          isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
        )} />
      </div>

      {/* Header - Compact on Mobile */}
      <div className="flex items-start gap-3 mb-3 sm:mb-4">
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shrink-0",
          isIncome
            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
            : "bg-gradient-to-br from-red-500 to-rose-600 text-white"
        )}>
          <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate pr-6">
            {template.description || template.name || t('transactions.noDescription', 'No description')}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
            <Badge 
              variant={isIncome ? 'success' : 'destructive'}
              className="text-xs px-1.5 py-0.5"
            >
              {isIncome ? t('types.income', 'Income') : t('types.expense', 'Expense')}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {t(`recurringManager.frequency.${template.interval_type}`, template.interval_type || 'monthly')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Amount - Prominent */}
      <div className="mb-3 sm:mb-4">
        <div className={cn(
          "text-xl sm:text-2xl font-bold tabular-nums",
          isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(template.amount))}
        </div>
      </div>

      {/* Stats - Compact Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
          <p className="text-gray-500 dark:text-gray-400 text-xs">{t('recurringManager.created', 'Created')}</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {dateHelpers.formatMedium(new Date(template.created_at))}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3">
          <p className="text-gray-500 dark:text-gray-400 text-xs">{t('recurringManager.nextRun', 'Next Run')}</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {template.next_run ? dateHelpers.formatMedium(new Date(template.next_run)) : t('recurringManager.never', 'Never')}
          </p>
        </div>
      </div>

      {/* Actions - Touch-Friendly */}
      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(template)}
          className={cn(
            "text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] px-2 sm:px-3",
            isActive 
              ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20" 
              : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
          )}
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">{t('actions.pause', 'Pause')}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden xs:inline">{t('actions.resume', 'Resume')}</span>
            </>
          )}
        </Button>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(template)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] p-0"
          >
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] p-0"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// 🌟 MAIN MODERN RECURRING MANAGER PANEL
const ModernRecurringManagerPanel = ({ isOpen = false, onClose = () => {} }) => {
  const { t, isRTL } = useTranslation();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  // ✅ Calculate next run date for a template
  const calculateNextRunDate = useCallback((template) => {
    if (!template || !template.start_date || !template.is_active) return null;
    
    const now = new Date();
    const startDate = new Date(template.start_date);
    let nextDate = new Date(startDate);
    
    // If start date is in the future, return start date
    if (startDate > now) return startDate;
    
    // Calculate next occurrence based on interval
    switch (template.interval_type) {
      case 'daily':
        const daysDiff = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
        nextDate.setDate(startDate.getDate() + daysDiff + 1);
        break;
        
      case 'weekly':
        const weeksDiff = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000));
        nextDate.setDate(startDate.getDate() + ((weeksDiff + 1) * 7));
        break;
        
      case 'monthly':
        // Use day_of_month if specified, otherwise use start date's day
        const targetDay = template.day_of_month || startDate.getDate();
        nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
        
        // If we've passed this month's target day, move to next month
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        // Handle month-end cases (day 31 in February, etc.)
        if (nextDate.getDate() !== targetDay) {
          nextDate.setDate(0); // Go to last day of previous month
        }
        break;
        
      default:
        return null;
    }
    
    // Check if we've passed the end date
    if (template.end_date && nextDate > new Date(template.end_date)) {
      return null;
    }
    
    return nextDate;
  }, []);

  const [activeTab, setActiveTab] = useState('templates'); // Only 'templates' tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Data hooks
  const {
    recurringTransactions,
    stats: templateStats,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
    updateRecurring,
    deleteRecurring
  } = useRecurringTransactions();

  const {
    upcomingTransactions,
    isLoading: upcomingLoading
  } = useUpcomingTransactions();

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!recurringTransactions) return [];
    
    return recurringTransactions.filter(template => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !template.description?.toLowerCase().includes(query) &&
          !template.category_name?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && template.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && template.type !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [recurringTransactions, searchQuery, statusFilter, typeFilter]);

  // Summary stats
  const summary = useMemo(() => {
    if (!filteredTemplates.length) return { totalActive: 0, totalAmount: 0, avgAmount: 0 };
    
    const active = filteredTemplates.filter(t => t.status === 'active');
    const totalAmount = active.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalActive: active.length,
      totalPaused: filteredTemplates.length - active.length,
      totalAmount,
      avgAmount: active.length > 0 ? totalAmount / active.length : 0
    };
  }, [filteredTemplates]);

  // Event handlers
  const handleEdit = useCallback((template) => {
    setEditTemplate(template);
    setShowCreateModal(true);
  }, []);

  const handleToggleStatus = useCallback(async (template) => {
    try {
      const newStatus = !template.is_active;
      
      // Use the proper hook instead of direct fetch
      await updateRecurring(template.id, { is_active: newStatus });
      
      addNotification({
        type: 'success',
        message: t('recurring.statusUpdated', 'Status updated successfully'),
        duration: 3000
      });
      refetchTemplates();
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('recurring.statusUpdateFailed', 'Failed to update status'),
        duration: 5000
      });
    }
  }, [updateRecurring, addNotification, t, refetchTemplates]);

  const handleDelete = useCallback((template) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async (scope) => {
    if (!templateToDelete) return;
    
    try {
      // Use the proper hook with scope parameter
      await deleteRecurring(templateToDelete.id, { scope });
      
      addNotification({
        type: 'success',
        message: t('recurring.deleteSuccess', 'Template deleted successfully'),
        duration: 3000
      });
      refetchTemplates();
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('recurring.deleteFailed', 'Failed to delete template'),
        duration: 5000
      });
    } finally {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  }, [templateToDelete, deleteRecurring, addNotification, t, refetchTemplates]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
  }, []);

  // ✅ REMOVED: Duplication feature as requested by user
  // const handleDuplicate = useCallback((template) => {
  //   setEditTemplate({ ...template, id: null, description: `${template.description} (Copy)` });
  //   setShowCreateModal(true);
  // }, []);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    setEditTemplate(null);
    refetchTemplates();
    addNotification({
      type: 'success',
      message: t('recurring.templateSaved', 'Template saved successfully'),
      duration: 3000
    });
  }, [addNotification, t, refetchTemplates]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        {/* Panel */}
        <motion.div
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            "absolute inset-0 sm:inset-8",
            "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950",
            "rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800",
            "flex flex-col overflow-hidden"
          )}
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {/* ✨ Enhanced Header - More Compact on Desktop */}
          <motion.div
            variants={headerVariants}
            className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-3 sm:p-4"
          >
            <div className="flex items-center justify-between">
              {/* Title */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
                    <Repeat className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-5 sm:h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {t('recurringManager.title', 'Recurring Manager')}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
                    {t('recurringManager.subtitle', 'Manage your recurring transactions')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-4"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('actions.add', 'Add New')}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 sm:p-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ✨ Stats Grid - compact on mobile and desktop */}
          <div className="flex-shrink-0 p-2 sm:p-4 bg-white/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <ModernStatsCard
                title={t('recurringManager.active', 'Active Templates')}
                value={summary.totalActive}
                icon={Play}
                color="green"
              />
              <ModernStatsCard
                title={t('recurringManager.paused', 'Paused Templates')}
                value={summary.totalPaused}
                icon={Pause}
                color="orange"
              />
              <ModernStatsCard
                title={t('recurringManager.totalAmount', 'Total Monthly')}
                value={summary.totalAmount}
                icon={DollarSign}
                color="blue"
              />
              <ModernStatsCard
                title={t('recurringManager.avgAmount', 'Average Amount')}
                value={summary.avgAmount}
                icon={BarChart3}
                color="purple"
              />
            </div>
          </div>

          {/* ✨ Tabs and Filters */}
          <div className="flex-shrink-0 p-3 sm:p-4 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
            {/* Header - Templates Only */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('recurringManager.templates', 'Templates')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage your recurring transaction templates
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('recurringManager.searchPlaceholder', 'Search templates...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-2 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Filters */}
              {activeTab === 'templates' && (
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="all">{t('recurringManager.filter.allStatus', 'All Status')}</option>
                    <option value="active">{t('recurringManager.filter.active', 'Active Only')}</option>
                    <option value="paused">{t('recurringManager.filter.paused', 'Paused Only')}</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="all">{t('recurringManager.filter.allTypes', 'All Types')}</option>
                    <option value="income">{t('types.income', 'Income')}</option>
                    <option value="expense">{t('types.expense', 'Expense')}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ✨ Content - Mobile Optimized */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
            <div>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12 sm:py-20">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      {t('recurringManager.loading', 'Loading templates...')}
                    </p>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 sm:py-20 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Repeat className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                      ? t('recurringManager.noMatches', 'No Matching Templates')
                      : t('recurringManager.noRecurring', 'No Recurring Templates')
                    }
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6 sm:mb-8">
                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                      ? t('recurringManager.noMatchesDesc', 'Try adjusting your filters')
                      : t('recurringManager.noRecurringDesc', 'Create recurring transactions to automate your finance tracking')
                    }
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-sm sm:text-base px-4 sm:px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('recurringManager.addFirst', 'Add First Template')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {filteredTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <ModernTemplateCard
                        template={template}
                        onEdit={handleEdit}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ✨ Create/Edit Modal */}
        <RecurringSetupModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditTemplate(null);
          }}
          onSuccess={handleCreateSuccess}
          initialData={editTemplate}
          mode={editTemplate ? 'edit' : 'create'}
        />

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
      </div>
    </AnimatePresence>
  );
};

export default ModernRecurringManagerPanel;
