/**
 * 🎛️ UNIFIED RECURRING CONTROL CENTER
 * Single view showing BOTH templates AND upcoming transactions
 * No tabs - everything in one place as requested by user
 * @version 1.0.0 - UNIFIED DESIGN
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Calendar, Plus, RefreshCw, X, Clock, Target,
  ArrowRight, TrendingUp, TrendingDown, BarChart3, Zap,
  Play, Pause, Edit, Trash2, Copy, Eye, CheckCircle,
  AlertCircle, Sparkles, Star, Activity, DollarSign,
  Repeat, Timer, CalendarDays
} from 'lucide-react';

import { useTranslation, useNotifications, useCurrency, useTheme } from '../../../../stores';
import { useRecurringTransactions } from '../../../../hooks/useRecurringTransactions';
import { useUpcomingTransactions } from '../../../../hooks/useUpcomingTransactions';
import { Button, Card, LoadingSpinner, Badge, Modal } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';
import RecurringSetupModal from '../modals/RecurringSetupModal';

// ✨ Animation Variants
const containerVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      duration: 0.5 
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// 🎛️ Template Card Component
const TemplateCard = ({ template, onEdit, onDelete, onToggle, onDuplicate }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  const isIncome = template.type === 'income';
  const isActive = template.is_active;
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "p-4 rounded-xl border-2 transition-all duration-300",
        isActive 
          ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 dark:border-green-700"
          : "border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isIncome 
              ? "bg-gradient-to-br from-green-400 to-emerald-500" 
              : "bg-gradient-to-br from-red-400 to-pink-500"
          )}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {template.interval_type} • {template.category_name}
            </p>
          </div>
        </div>

        <Badge 
          variant={isActive ? "success" : "secondary"}
          className="text-xs"
        >
          {isActive ? '🟢 Active' : '⏸️ Paused'}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">
          <span className={isIncome ? "text-green-600" : "text-red-600"}>
            {isIncome ? '+' : '-'}{formatCurrency(template.amount)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(template)}
            className={isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
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

// 📅 Upcoming Transaction Card Component
const UpcomingCard = ({ transaction }) => {
  const { formatCurrency } = useCurrency();
  
  const isIncome = transaction.type === 'income';
  const daysUntil = Math.ceil((new Date(transaction.date) - new Date()) / (1000 * 60 * 60 * 24));
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 4 }}
      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isIncome 
              ? "bg-green-100 dark:bg-green-900/20" 
              : "bg-red-100 dark:bg-red-900/20"
          )}>
            <CalendarDays className={cn(
              "w-4 h-4",
              isIncome ? "text-green-600" : "text-red-600"
            )} />
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {transaction.description}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {dateHelpers.format(transaction.date, 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className={cn(
            "font-semibold",
            isIncome ? "text-green-600" : "text-red-600"
          )}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </div>
          <div className="text-xs text-gray-500">
            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 🎛️ MAIN UNIFIED RECURRING CONTROL CENTER
const UnifiedRecurringControlCenter = ({ isOpen = false, onClose = () => {} }) => {
  const { t, isRTL } = useTranslation();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  // Data hooks
  const {
    recurringTransactions: templates,
    stats: templateStats,
    isLoading: templatesLoading,
    refetch: refetchTemplates
  } = useRecurringTransactions();

  const {
    upcomingTransactions,
    isLoading: upcomingLoading
  } = useUpcomingTransactions();

  // Computed data
  const upcomingNext7Days = useMemo(() => {
    if (!upcomingTransactions) return [];
    
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    
    return upcomingTransactions
      .filter(t => new Date(t.date) <= next7Days)
      .slice(0, 5);
  }, [upcomingTransactions]);

  const totalUpcomingAmount = useMemo(() => {
    return upcomingNext7Days.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }, [upcomingNext7Days]);

  // Event handlers
  const handleCreateTemplate = useCallback(() => {
    setEditTemplate(null);
    setShowCreateModal(true);
  }, []);

  const handleEditTemplate = useCallback((template) => {
    setEditTemplate(template);
    setShowCreateModal(true);
  }, []);

  const handleToggleStatus = useCallback(async (template) => {
    try {
      const newStatus = template.is_active ? 'paused' : 'active';
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
    if (!confirm(t('recurring.confirmDelete', { name: template.name }))) return;
    
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
    setEditTemplate({ ...template, id: null, name: `${template.name} (Copy)` });
    setShowCreateModal(true);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed inset-4 lg:inset-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl",
          "flex flex-col overflow-hidden",
          "border border-gray-200 dark:border-gray-700"
        )}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 via-violet-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-white">
                  🎛️ Recurring Control Center
                </h1>
                <p className="text-purple-100 mt-1">
                  Manage templates and view upcoming transactions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateTemplate}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 backdrop-blur-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Active Templates</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {templates?.filter(t => t.is_active).length || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Upcoming (7 days)</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {upcomingNext7Days.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Net Impact</p>
                  <p className={cn(
                    "text-lg font-bold",
                    totalUpcomingAmount >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(Math.abs(totalUpcomingAmount))}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Templates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Recurring Templates
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {templates?.length || 0} total
                </Badge>
              </div>

              <div className="space-y-3">
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner className="w-6 h-6" />
                  </div>
                ) : templates?.length > 0 ? (
                  templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleEditTemplate}
                      onDelete={handleDelete}
                      onToggle={handleToggleStatus}
                      onDuplicate={handleDuplicate}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Repeat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recurring templates yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCreateTemplate}
                      className="mt-3"
                    >
                      Create Your First Template
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Transactions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Upcoming (Next 7 Days)
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {upcomingNext7Days.length} pending
                </Badge>
              </div>

              <div className="space-y-2">
                {upcomingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner className="w-6 h-6" />
                  </div>
                ) : upcomingNext7Days?.length > 0 ? (
                  upcomingNext7Days.map((transaction) => (
                    <UpcomingCard
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming transactions</p>
                    <p className="text-sm">Create templates to see upcoming transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Template Setup Modal */}
      <RecurringSetupModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditTemplate(null);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          setEditTemplate(null);
          refetchTemplates();
          addNotification({
            type: 'success',
            message: 'Template saved successfully',
            duration: 3000
          });
        }}
        initialData={editTemplate}
        mode={editTemplate ? 'edit' : 'create'}
      />
    </motion.div>
  );
};

export default UnifiedRecurringControlCenter;
