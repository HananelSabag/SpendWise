/**
 * 💳 TRANSACTION CARD - MOBILE-FIRST REVOLUTION!
 * Complete rewrite with Zustand, enhanced action panels, perfect mobile design
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Trash2, Calendar, Clock, Pause, Play, Settings,
  ChevronDown, ChevronUp, MoreHorizontal, Zap, CalendarX,
  ArrowUpRight, ArrowDownRight, Copy, Eye, EyeOff, Check,
  AlertCircle, Repeat, Target, Activity, Sparkles, AlertTriangle,
  SkipForward, XCircle, TrendingUp, TrendingDown
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useAuth,
  useTranslation,
  useCurrency,
  useNotifications,
  useTheme
} from '../../../stores';

// Enhanced imports
import { getIconComponent, getColorForCategory, getGradientForCategory } from '../../../config/categoryIcons';
import { dateHelpers, cn } from '../../../utils/helpers';
import { Badge, Button, Tooltip } from '../../ui';
import DeleteTransaction from './DeleteTransaction';

/**
 * 💳 TransactionCard - MOBILE-FIRST PERFECTION!
 */
const TransactionCard = ({
  transaction,
  onEdit,
  onEditSingle,
  onEditTemplate,
  onDelete,
  onQuickAction,
  showActions = true,
  isSelected = false,
  onSelect,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { user } = useAuth();
  const { t, isRTL } = useTranslation('transactions');
  const { formatCurrency, currency } = useCurrency();
  const { addNotification } = useNotifications();
  const { isDark } = useTheme();

  // Enhanced state management
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Enhanced transaction data processing
  const transactionData = useMemo(() => {
    const isRecurring = transaction.template_id || transaction.is_recurring;
    const isIncome = transaction.type === 'income' || transaction.amount > 0;
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));
    const categoryIcon = getIconComponent(transaction.category?.icon);
    const categoryColor = getColorForCategory(transaction.category?.name);
    const categoryGradient = getGradientForCategory(transaction.category?.name);
    
    return {
      isRecurring,
      isIncome,
      formattedAmount,
      categoryIcon,
      categoryColor,
      categoryGradient,
      displayDate: dateHelpers.format(transaction.date, user?.preferences?.dateFormat || 'MM/DD/YYYY'),
      relativeDate: dateHelpers.fromNow(transaction.date),
      category: transaction.category?.name || t('categories.uncategorized'),
      description: transaction.description || t('transactions.noDescription')
    };
  }, [transaction, formatCurrency, user, t]);

  // Enhanced action handlers
  const handleQuickAction = useCallback(async (action, data = {}) => {
    setIsProcessing(true);
    
    try {
      await onQuickAction?.(action, transaction.id, data);
      
      // Show success notification
      addNotification({
        type: 'success',
        title: t(`actions.${action}.success`),
        duration: 3000
      });
      
    } catch (error) {
      console.error(`Quick action ${action} failed:`, error);
      
      addNotification({
        type: 'error',
        title: t(`actions.${action}.failed`),
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
      setShowQuickActions(false);
    }
  }, [onQuickAction, transaction.id, addNotification, t]);

  // Enhanced edit handler
  const handleEdit = useCallback(() => {
    if (transactionData.isRecurring) {
      // Show recurring edit options
      setIsExpanded(true);
    } else {
      onEdit?.(transaction);
    }
  }, [transactionData.isRecurring, onEdit, transaction]);

  // Enhanced delete handler
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Quick actions configuration
  const quickActions = useMemo(() => {
    const actions = [];
    
    if (transactionData.isRecurring) {
      actions.push(
        {
          id: 'pause',
          icon: Pause,
          label: t('actions.pause'),
          color: 'text-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-900/20'
        },
        {
          id: 'skip',
          icon: SkipForward,
          label: t('actions.skip'),
          color: 'text-blue-600',
          bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
          id: 'edit_template',
          icon: Settings,
          label: t('actions.editTemplate'),
          color: 'text-purple-600',
          bg: 'bg-purple-50 dark:bg-purple-900/20'
        }
      );
    }
    
    actions.push(
      {
        id: 'duplicate',
        icon: Copy,
        label: t('actions.duplicate'),
        color: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-900/20'
      },
      {
        id: 'delete',
        icon: Trash2,
        label: t('actions.delete'),
        color: 'text-red-600',
        bg: 'bg-red-50 dark:bg-red-900/20',
        dangerous: true
      }
    );
    
    return actions;
  }, [transactionData.isRecurring, t]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const quickActionsVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10,
      transition: { duration: 0.15 }
    }
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        className={cn(
          "relative group",
          "bg-white dark:bg-gray-800",
          "border border-gray-200 dark:border-gray-700",
          "rounded-2xl p-4 md:p-6",
          "shadow-sm hover:shadow-md",
          "transition-all duration-200",
          isSelected && "ring-2 ring-primary-500 border-primary-500",
          "touch-pan-y", // Better mobile scrolling
          className
        )}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Selection indicator */}
        {onSelect && (
          <motion.div
            className={cn(
              "absolute top-4 w-5 h-5 rounded-full border-2",
              "cursor-pointer transition-all",
              isSelected 
                ? "bg-primary-500 border-primary-500" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400",
              isRTL ? "left-4" : "right-4"
            )}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(transaction.id);
            }}
          >
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Main content */}
        <div className="flex items-start space-x-4">
          {/* Category icon - Enhanced mobile design */}
          <motion.div
            whileHover={{ rotate: 5 }}
            className={cn(
              "relative flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl",
              "flex items-center justify-center",
              "bg-gradient-to-br", transactionData.categoryGradient,
              "shadow-lg shadow-gray-200 dark:shadow-gray-800"
            )}
          >
            {transactionData.categoryIcon && (
              <transactionData.categoryIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />
            )}
            
            {/* Recurring indicator */}
            {transactionData.isRecurring && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-full",
                  "bg-primary-500 flex items-center justify-center"
                )}
              >
                <Repeat className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.div>

          {/* Transaction details - Mobile optimized */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              {/* Description and category */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm md:text-base">
                  {transactionData.description}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {transactionData.category}
                </p>
              </div>

              {/* Amount - Enhanced mobile design */}
              <div className="flex items-center space-x-2 ml-4">
                <motion.div
                  className={cn(
                    "text-right",
                    transactionData.isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                >
                  <div className="flex items-center">
                    {transactionData.isIncome ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="font-bold text-lg md:text-xl">
                      {transactionData.isIncome ? '+' : '-'}{transactionData.formattedAmount}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Date and meta info */}
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{transactionData.displayDate}</span>
                {transactionData.isRecurring && (
                  <Badge variant="secondary" className="text-xs">
                    {t('labels.recurring')}
                  </Badge>
                )}
              </div>
              
              <span className="text-xs">
                {transactionData.relativeDate}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced action panel - Mobile optimized */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {/* Primary actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  disabled={isProcessing}
                  className="flex items-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('actions.edit')}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('actions.delete')}</span>
                </Button>
              </div>

              {/* Quick actions menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-2"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>

                {/* Quick actions dropdown */}
                <AnimatePresence>
                  {showQuickActions && (
                    <motion.div
                      variants={quickActionsVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={cn(
                        "absolute bottom-full mb-2 z-20",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-200 dark:border-gray-700",
                        "rounded-lg shadow-lg py-1 min-w-[160px]",
                        isRTL ? "left-0" : "right-0"
                      )}
                    >
                      {quickActions.map((action) => (
                        <motion.button
                          key={action.id}
                          whileHover={{ backgroundColor: action.bg }}
                          onClick={() => handleQuickAction(action.id)}
                          disabled={isProcessing}
                          className={cn(
                            "w-full flex items-center space-x-3 px-4 py-2",
                            "text-left text-sm transition-colors",
                            action.color,
                            "hover:bg-gray-50 dark:hover:bg-gray-700",
                            action.dangerous && "hover:bg-red-50 dark:hover:bg-red-900/20"
                          )}
                        >
                          <action.icon className="w-4 h-4" />
                          <span>{action.label}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Expanded recurring options */}
        <AnimatePresence>
          {isExpanded && transactionData.isRecurring && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
            >
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                {t('recurring.editOptions')}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => onEditSingle?.(transaction)}
                  className="justify-start"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t('recurring.editSingle')}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => onEditTemplate?.(transaction)}
                  className="justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('recurring.editTemplate')}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="w-full mt-3"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                {t('actions.collapse')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </motion.div>

      {/* Delete confirmation modal */}
      <DeleteTransaction
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        transaction={transaction}
        onConfirm={onDelete}
      />
    </>
  );
};

export default TransactionCard;
