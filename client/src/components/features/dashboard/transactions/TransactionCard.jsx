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
import { getIconComponent } from '../../../../config/categoryIcons';

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
  const [buttonRef, setButtonRef] = useState(null);
  const dragControls = useDragControls();

  // Transaction data processing
  const isIncome = transaction.type === 'income' || transaction.amount > 0;
  const amount = Math.abs(transaction.amount || 0);
  const formattedDate = dateHelpers.fromNow(transaction.date);
  const isRecurring = transaction.template_id || transaction.is_recurring;
  
  // Get proper icon component using the mapping function
  const iconName = transaction.category_icon || transaction.category?.icon || 'Receipt';
  
  // Get the icon component - this will always return a valid React component
  const IconComponent = React.useMemo(() => {
    return getIconComponent(iconName);
  }, [iconName]);

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
        "p-5 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-2xl relative",
        // עיצוב שונה לעסקאות חוזרות
        isRecurring ? [
          "bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10",
          "border-l-4 border-l-purple-500 dark:border-l-purple-400",
          "border border-purple-200 dark:border-purple-700",
          "hover:bg-purple-100/70 dark:hover:bg-purple-800/30"
        ] : [
          "border border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-750/50"
        ],
        isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600",
        isExpanded && "shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10"
      )}>
        {/* Main transaction content */}
        <div className="flex items-start gap-3 w-full">
          {/* Left side - Selection & Icon */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {onSelect && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSelect}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                  "hover:shadow-sm active:shadow-inner",
                  isSelected 
                    ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                )}
              >
                {isSelected && <span className="text-xs font-bold">✓</span>}
              </motion.button>
            )}

            {/* Category icon with recurring indicator */}
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border",
                  "transition-all duration-200",
                  isRecurring ? [
                    // עיצוב מיוחד לעסקאות חוזרות
                    isIncome 
                      ? "bg-gradient-to-br from-green-100 to-purple-100 dark:from-green-900/40 dark:to-purple-900/40 text-green-600 dark:text-green-400 border-purple-300 dark:border-purple-600"
                      : "bg-gradient-to-br from-red-100 to-purple-100 dark:from-red-900/40 dark:to-purple-900/40 text-red-600 dark:text-red-400 border-purple-300 dark:border-purple-600"
                  ] : [
                    isIncome 
                      ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                      : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                  ]
                )}
              >
                {React.createElement(IconComponent, { className: "w-6 h-6" })}
              </motion.div>
              
              {/* סמל חוזרת בפינה */}
              {isRecurring && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 dark:bg-purple-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800"
                >
                  <Repeat className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Center - Transaction details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between w-full">
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={cn(
                    "font-semibold text-base truncate",
                    isRecurring 
                      ? "text-purple-900 dark:text-purple-100" 
                      : "text-gray-900 dark:text-white"
                  )}>
                    {transaction.description || t('transaction.noDescription')}
                  </h4>
                  
                  {isRecurring && (
                    <Badge 
                      variant="secondary" 
                      size="xs" 
                      className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600"
                    >
                      <Repeat className="w-3 h-3 mr-1" />
                      {t('labels.recurring', { fallback: 'חוזר' })}
                    </Badge>
                  )}
                  
                  {aiInsights.length > 0 && (
                    <Tooltip content={aiInsights[0].text}>
                      <Brain className="w-4 h-4 text-blue-500 cursor-help" />
                    </Tooltip>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="truncate">{transaction.category_name || transaction.category?.name || t('category.uncategorized')}</span>
                  <span className="text-gray-400">•</span>
                  <span className="flex-shrink-0">{formattedDate}</span>
                </div>

                {transaction.location && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{transaction.location}</span>
                  </div>
                )}
              </div>

              {/* Right side - Amount & Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Amount */}
                <div className="text-right">
                  <div className={cn(
                    "font-bold text-lg leading-tight",
                    isIncome 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(amount)}
                  </div>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex items-center gap-1">
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleToggleExpand}
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>

                    <div className="relative">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          ref={setButtonRef}
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowActionsMenu(!showActionsMenu)}
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </motion.div>

                      {/* Actions dropdown - Portal-style positioning */}
                      <AnimatePresence>
                        {showActionsMenu && (
                          <>
                            {/* Full-screen backdrop */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-40 bg-transparent"
                              onClick={() => setShowActionsMenu(false)}
                            />
                            
                            {/* Dropdown menu - Fixed positioned portal */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="fixed z-50 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-md bg-white/95 dark:bg-gray-800/95"
                              style={{
                                top: 'auto',
                                left: 'auto', 
                                right: '1rem',
                                transform: 'translateY(0.5rem)'
                              }}
                              ref={(el) => {
                                if (el && buttonRef) {
                                  // Get the trigger button position using direct ref
                                  const rect = buttonRef.getBoundingClientRect();
                                  const viewportWidth = window.innerWidth;
                                  const viewportHeight = window.innerHeight;
                                  const dropdownWidth = 176; // w-44 in pixels
                                  const dropdownHeight = 120; // Approximate height
                                  
                                  let top = rect.bottom + 8;
                                  let left = rect.right - dropdownWidth;
                                  
                                  // Adjust if dropdown would go off-screen
                                  if (left < 8) left = 8;
                                  if (left + dropdownWidth > viewportWidth - 8) {
                                    left = viewportWidth - dropdownWidth - 8;
                                  }
                                  if (top + dropdownHeight > viewportHeight - 8) {
                                    top = rect.top - dropdownHeight - 8;
                                  }
                                  
                                  el.style.top = `${top}px`;
                                  el.style.left = `${left}px`;
                                  el.style.right = 'auto';
                                  el.style.transform = 'none';
                                }
                              }}
                            >
                              <div className="p-1.5">
                                {swipeActions.map((action) => {
                                  const Icon = action.icon;
                                  return (
                                    <motion.button
                                      key={action.id}
                                      whileHover={{ scale: 1.02, x: 2 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        action.action();
                                        setShowActionsMenu(false);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
                                    >
                                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                        {action.label}
                                      </span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                    {dateHelpers.format(transaction.date, 'PPPP')}
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