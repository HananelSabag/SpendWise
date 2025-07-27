/**
 * 🎯 TRANSACTION CARD - Smart Transaction Display Component
 * Extracted from RecentTransactions.jsx for better performance and maintainability
 * Features: AI insights, Swipe actions, Expandable details, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Edit, Trash2, Copy, 
  ChevronDown, ChevronUp, Star, Tag, MapPin, 
  Calendar, Clock, Receipt, Sparkles, Brain,
  AlertCircle, Info, Target
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency,
  useTheme
} from '../../../../stores';

import { Card, Badge, Button, Tooltip } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';

/**
 * 🎯 Smart Transaction Card
 */
const TransactionCard = ({ 
  transaction, 
  index = 0,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  viewMode = 'card',
  showActions = true,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const dragControls = useDragControls();

  // Transaction data processing
  const isIncome = transaction.type === 'income' || transaction.amount > 0;
  const amount = Math.abs(transaction.amount || 0);
  const formattedDate = dateHelpers.fromNow(transaction.date);
  const categoryIcon = transaction.category?.icon || Receipt;

  // AI-powered insights
  const aiInsights = useMemo(() => {
    const insights = [];
    
    if (amount > 500) {
      insights.push({ 
        type: 'warning', 
        text: t('insights.largeTransaction'),
        icon: AlertCircle,
        color: 'text-orange-600'
      });
    }
    
    if (transaction.is_recurring) {
      insights.push({ 
        type: 'info', 
        text: t('insights.recurringPattern'),
        icon: Target,
        color: 'text-blue-600'
      });
    }
    
    if (transaction.tags?.includes('business')) {
      insights.push({ 
        type: 'success', 
        text: t('insights.businessExpense'),
        icon: Star,
        color: 'text-green-600'
      });
    }

    return insights;
  }, [transaction, amount, t]);

  // Swipe actions
  const swipeActions = [
    { 
      id: 'edit', 
      icon: Edit, 
      label: t('actions.edit'),
      color: 'bg-blue-500 hover:bg-blue-600', 
      action: () => onEdit?.(transaction) 
    },
    { 
      id: 'duplicate', 
      icon: Copy, 
      label: t('actions.duplicate'),
      color: 'bg-green-500 hover:bg-green-600', 
      action: () => onDuplicate?.(transaction) 
    },
    { 
      id: 'delete', 
      icon: Trash2, 
      label: t('actions.delete'),
      color: 'bg-red-500 hover:bg-red-600', 
      action: () => onDelete?.(transaction) 
    }
  ];

  // Handle selection
  const handleSelect = () => {
    onSelect?.(transaction.id, !isSelected);
  };

  // Handle expand toggle
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={cn("group relative", className)}
    >
      <Card className={cn(
        "p-4 hover:shadow-md transition-all cursor-pointer",
        isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20",
        isExpanded && "shadow-lg"
      )}>
        {/* Main transaction content */}
        <div className="flex items-center justify-between">
          {/* Left side - Selection & Icon */}
          <div className="flex items-center space-x-3">
            {onSelect && (
              <button
                onClick={handleSelect}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-blue-500 border-blue-500 text-white" 
                    : "border-gray-300 hover:border-blue-400"
                )}
              >
                {isSelected && <span className="text-xs">✓</span>}
              </button>
            )}

            {/* Category icon */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isIncome 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            )}>
              {React.createElement(categoryIcon, { className: "w-5 h-5" })}
            </div>

            {/* Transaction details */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {transaction.description || t('transaction.noDescription')}
                </h4>
                
                {transaction.is_recurring && (
                  <Badge variant="outline" size="xs">
                    {t('labels.recurring')}
                  </Badge>
                )}
                
                {aiInsights.length > 0 && (
                  <Tooltip content={aiInsights[0].text}>
                    <Brain className="w-4 h-4 text-blue-500" />
                  </Tooltip>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{transaction.category?.name || t('category.uncategorized')}</span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Right side - Amount & Actions */}
          <div className="flex items-center space-x-3">
            {/* Amount */}
            <div className="text-right">
              <div className={cn(
                "font-bold text-lg",
                isIncome 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(amount)}
              </div>
              
              {transaction.location && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  {transaction.location}
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleExpand}
                  className="p-2"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  {/* Actions dropdown */}
                  <AnimatePresence>
                    {showActionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10"
                      >
                        <div className="p-2">
                          {swipeActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.id}
                                onClick={() => {
                                  action.action();
                                  setShowActionsMenu(false);
                                }}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {action.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Transaction ID */}
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {t('labels.transactionId')}:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white font-mono">
                    {transaction.id}
                  </span>
                </div>

                {/* Date details */}
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {t('labels.fullDate')}:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {dateHelpers.format(transaction.date, 'full')}
                  </span>
                </div>

                {/* Tags */}
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {t('labels.tags')}:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {transaction.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {transaction.notes && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {t('labels.notes')}:
                    </span>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {transaction.notes}
                    </p>
                  </div>
                )}

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {t('labels.aiInsights')}:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {aiInsights.map((insight, index) => {
                        const Icon = insight.icon;
                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <Icon className={cn("w-4 h-4", insight.color)} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {insight.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Created/Updated timestamps */}
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    {t('labels.created')}:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {dateHelpers.format(transaction.created_at)}
                  </span>
                </div>
                
                {transaction.updated_at && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {t('labels.updated')}:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {dateHelpers.format(transaction.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default TransactionCard; 