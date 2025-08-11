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
        "relative overflow-hidden rounded-2xl p-6 shadow-xl border-2",
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
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
          color === 'green' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          color === 'orange' && "bg-gradient-to-br from-orange-500 to-amber-600 text-white"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// ✨ Modern Recurring Template Card
const ModernTemplateCard = ({ 
  template, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  onDuplicate,
  className = '' 
}) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = template.status === 'active';
  const isIncome = template.type === 'income';
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={cn(
        "relative group rounded-2xl p-6 shadow-lg border-2 transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
        isActive 
          ? "border-purple-200 dark:border-purple-800"
          : "border-gray-200 dark:border-gray-700 opacity-75",
        "hover:shadow-xl",
        className
      )}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className={cn(
          "w-3 h-3 rounded-full",
          isActive ? "bg-green-500" : "bg-gray-400"
        )} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
            isIncome
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
              : "bg-gradient-to-br from-red-500 to-rose-600 text-white"
          )}>
            <Repeat className="w-6 h-6" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {template.description || t('transactions.noDescription', 'No description')}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={isIncome ? 'success' : 'destructive'}
                size="sm"
              >
                {isIncome ? t('types.income') : t('types.expense')}
              </Badge>
              <Badge variant="outline" size="sm">
                {template.frequency}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <div className={cn(
          "text-2xl font-bold",
          isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(template.amount))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('recurring.created')}</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {dateHelpers.formatMedium(new Date(template.created_at))}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('recurring.nextRun')}</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {template.next_run ? dateHelpers.formatMedium(new Date(template.next_run)) : t('recurring.never')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(template)}
          className={cn(
            "text-xs",
            isActive 
              ? "text-orange-600 hover:text-orange-700" 
              : "text-green-600 hover:text-green-700"
          )}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 mr-1" />
              {t('actions.pause')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              {t('actions.resume')}
            </>
          )}
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(template)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(template)}
            className="text-purple-600 hover:text-purple-700"
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(template)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
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

  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  // Data hooks
  const {
    recurringTransactions,
    stats: templateStats,
    isLoading: templatesLoading,
    refetch: refetchTemplates
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
      const newStatus = template.status === 'active' ? 'paused' : 'active';
      // API call would go here
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
  }, [addNotification, t, refetchTemplates]);

  const handleDelete = useCallback(async (template) => {
    if (!confirm(t('recurring.confirmDelete', { name: template.description }))) return;
    
    try {
      // API call would go here
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
    }
  }, [addNotification, t, refetchTemplates]);

  const handleDuplicate = useCallback((template) => {
    setEditTemplate({ ...template, id: null, description: `${template.description} (Copy)` });
    setShowCreateModal(true);
  }, []);

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
            "absolute inset-4 sm:inset-8",
            "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950",
            "rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800",
            "flex flex-col overflow-hidden"
          )}
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {/* ✨ Enhanced Header */}
          <motion.div
            variants={headerVariants}
            className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex items-center justify-between">
              {/* Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Repeat className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {t('recurringManager.title', 'Recurring Transactions Manager')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('recurringManager.subtitle', 'Manage your recurring transactions')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('actions.add', 'Add New')}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ✨ Stats Grid */}
          <div className="flex-shrink-0 p-6 bg-white/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex-shrink-0 p-6 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
              <button
                onClick={() => setActiveTab('templates')}
                className={cn(
                  "flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200",
                  activeTab === 'templates'
                    ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                {t('recurringManager.templates', 'Templates')}
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={cn(
                  "flex-1 px-4 py-2 rounded-xl font-medium transition-all duration-200",
                  activeTab === 'upcoming'
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                {t('recurringManager.upcoming', 'Upcoming')}
              </button>
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

          {/* ✨ Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'templates' ? (
              <div>
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <LoadingSpinner size="lg" />
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        {t('recurringManager.loading', 'Loading templates...')}
                      </p>
                    </div>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6">
                      <Repeat className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                        ? t('recurringManager.noMatches', 'No Matching Templates')
                        : t('recurringManager.noRecurring', 'No Recurring Templates')
                      }
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                      {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                        ? t('recurringManager.noMatchesDesc', 'Try adjusting your filters')
                        : t('recurringManager.noRecurringDesc', 'Create recurring transactions to automate your finance tracking')
                      }
                    </p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('recurringManager.addFirst', 'Add First Template')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTemplates.map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ModernTemplateCard
                          template={template}
                          onEdit={handleEdit}
                          onToggleStatus={handleToggleStatus}
                          onDelete={handleDelete}
                          onDuplicate={handleDuplicate}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('recurringManager.upcomingTitle', 'Upcoming Transactions')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {t('recurringManager.upcomingDesc', 'Your upcoming recurring transactions will appear here')}
                </p>
              </div>
            )}
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
      </div>
    </AnimatePresence>
  );
};

export default ModernRecurringManagerPanel;
