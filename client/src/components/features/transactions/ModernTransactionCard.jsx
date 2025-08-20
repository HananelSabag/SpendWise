/**
 * 🎨 MODERN TRANSACTION CARD - Revolutionary Design
 * Features: Stunning visuals, Recurring vs One-time distinction, Perfect animations
 * Mobile-first, Accessibility compliant, Premium UX
 * @version 1.0.0 - REVOLUTIONARY DESIGN
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, Edit, Trash2, Copy, Repeat, Clock, 
  Calendar, ArrowUpRight, ArrowDownRight, Sparkles,
  Zap, Target, Star, Bookmark, Eye, DollarSign,
  CreditCard, Wallet, PiggyBank, Receipt, Tag
} from 'lucide-react';

import { useTranslation, useCurrency, useTheme } from '../../../stores';
import { getIconComponent } from '../../../config/categoryIcons';
import { cn, dateHelpers } from '../../../utils/helpers';
import { Button, Badge, Tooltip } from '../../ui';

// ✨ Enhanced Animation Variants
const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
    rotateX: -10
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  hover: { 
    y: -8,
    scale: 1.02,
    rotateX: 2,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const iconVariants = {
  initial: { scale: 0.8, rotate: -10 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  hover: { 
    scale: 1.1,
    rotate: 5,
    transition: { duration: 0.2 }
  }
};

const amountVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      delay: 0.1,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

const menuVariants = {
  initial: { opacity: 0, scale: 0.8, y: -10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -10,
    transition: { duration: 0.15 }
  }
};

// ✨ Recurring Transaction Indicator
const RecurringIndicator = ({ transaction, className = '' }) => {
  const { t } = useTranslation();
  const isRecurring = transaction?.template_id || transaction?.is_recurring;
  
  if (!isRecurring) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg",
        "border-2 border-white dark:border-gray-800",
        className
      )}
    >
      <Tooltip content={t('transactions.recurring.tooltip', 'Recurring Transaction')}>
        <Repeat className="w-4 h-4" />
      </Tooltip>
    </motion.div>
  );
};

// ✨ Transaction Type Badge
const TransactionTypeBadge = ({ isIncome, isRecurring, className = '' }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
        isIncome 
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
        className
      )}
    >
      {isIncome ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      <span>
        {isIncome 
          ? t('transactions.types.income', 'Income')
          : t('transactions.types.expense', 'Expense')
        }
      </span>
      {isRecurring && (
        <Repeat className="w-3 h-3 ml-1 text-purple-500" />
      )}
    </motion.div>
  );
};

// ✨ Enhanced Action Menu
const ActionMenu = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isOpen, 
  onToggle,
  className = '' 
}) => {
  const { t } = useTranslation();
  
  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          "w-8 h-8 p-0 rounded-lg transition-all duration-200",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          isOpen && "bg-gray-100 dark:bg-gray-700"
        )}
      >
        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={onToggle}
            />
            
            {/* Menu */}
            <motion.div
              variants={menuVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                "absolute right-0 top-10 z-50 w-48 p-1",
                "bg-white dark:bg-gray-800 rounded-xl shadow-2xl",
                "border border-gray-200 dark:border-gray-700",
                "backdrop-blur-xl"
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Edit clicked for transaction:', transaction.id);
                  onEdit?.(transaction);
                  onToggle();
                }}
                className="w-full justify-start text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <Edit className="w-4 h-4 mr-3" />
                {t('actions.edit', 'Edit')}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📋 Duplicate clicked for transaction:', transaction.id);
                  onDuplicate?.(transaction);
                  onToggle();
                }}
                className="w-full justify-start text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <Copy className="w-4 h-4 mr-3" />
                {t('actions.duplicate', 'Duplicate')}
              </Button>
              
              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🗑️ Delete clicked for transaction:', transaction.id);
                  onDelete?.(transaction);
                  onToggle();
                }}
                className="w-full justify-start text-left text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                {t('actions.delete', 'Delete')}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// 🎨 MAIN MODERN TRANSACTION CARD COMPONENT
const ModernTransactionCard = ({
  transaction,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  viewMode = 'list',
  className = ''
}) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ✅ Transaction properties with enhanced logic
  const isIncome = transaction?.type === 'income';
  const isRecurring = transaction?.template_id || transaction?.is_recurring;
  const amount = Math.abs(transaction?.amount || 0);
  const categoryKey = transaction?.category_name?.toLowerCase() || 'other';
  
  // ✅ TIMEZONE-AWARE date handling - Use user's intended transaction time
  const getTransactionDateTime = () => {
    // Prioritize transaction_datetime (user's intended time) over created_at (server time)
    const datetime = transaction?.transaction_datetime || transaction?.created_at || transaction?.date;
    return new Date(datetime);
  };

  const date = getTransactionDateTime();
  const isToday = date.toDateString() === new Date().toDateString();
  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
  
  const getDateLabel = () => {
    if (isToday) return t('date.today', 'Today');
    if (isYesterday) return t('date.yesterday', 'Yesterday');
    return date.toLocaleDateString();
  };

  const getTimeLabel = () => {
    if (isToday) {
      // ✅ NEW: Show user's intended time in 24-hour format
      const timeString = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false // Use 24-hour format
      });
      
      return timeString;
    }
    return dateHelpers.fromNow(date);
  };

  const getTimezoneDisplay = () => {
    // ✅ NEW: Show timezone in requested format like "israel 21:23"
    if (transaction?.transaction_datetime) {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timeString = date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
        
        // Convert timezone to friendly name
        const timezoneName = userTimezone.split('/').pop()?.toLowerCase() || 'local';
        const friendlyName = timezoneName === 'jerusalem' ? 'israel' : timezoneName;
        
        return `${friendlyName} ${timeString}`;
      } catch (error) {
        return getTimeLabel();
      }
    }
    return getTimeLabel();
  };

  // ✅ Category icon with fallback
  const Icon = useMemo(() => {
    try {
      return getIconComponent(
        transaction?.category_icon || 
        transaction?.category?.icon || 
        'Receipt'
      );
    } catch {
      return Receipt;
    }
  }, [transaction]);

  // ✅ Enhanced card styling based on type and mode
  const cardClasses = cn(
    // Base styles
    "relative group transition-all duration-300 ease-out",
    "bg-gradient-to-br border-2 shadow-lg hover:shadow-2xl",
    "transform-gpu perspective-1000",
    
    // Responsive sizing
    viewMode === 'grid' 
      ? "rounded-2xl p-6" 
      : "rounded-xl p-4 md:p-5",
    
    // Theme and selection states
    isSelected 
      ? "ring-4 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600"
      : isDark
        ? "from-gray-800 to-gray-850 border-gray-700 hover:border-gray-600"
        : "from-white to-gray-50 border-gray-200 hover:border-gray-300",
    
    // Recurring transaction special styling
    isRecurring && !isSelected && cn(
      "border-purple-200 dark:border-purple-800",
      isDark 
        ? "from-purple-900/10 to-violet-900/10" 
        : "from-purple-50 to-violet-50"
    ),
    
    // Income/Expense accent
    !isSelected && !isRecurring && cn(
      isIncome 
        ? "border-l-4 border-l-green-400 dark:border-l-green-500"
        : "border-l-4 border-l-red-400 dark:border-l-red-500"
    ),
    
    className
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(cardClasses, "overflow-visible", isMenuOpen && "z-50")}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* ✨ Recurring Transaction Indicator */}
      <RecurringIndicator transaction={transaction} />

      {/* ✨ Selection Indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10"
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✨ Main Content */}
      <div className={cn(
        "flex items-center gap-3",
        viewMode === 'grid' && "flex-col text-center",
        isRTL && "flex-row-reverse"
      )}>
        
        {/* ✨ Category Icon */}
        <motion.div
          variants={iconVariants}
          className="relative flex-shrink-0"
        >
          <div
            className={cn(
              "relative rounded-2xl flex items-center justify-center shadow-lg border-2",
              "transition-all duration-300",
              isIncome
                ? "bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                : "bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300",
              isHovered && "scale-110 shadow-xl"
            )}
          >
            <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center">
              <Icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2} />
            </div>
            
            {/* ✨ Income/Expense Indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs",
                isIncome 
                  ? "bg-green-600 dark:bg-green-500" 
                  : "bg-red-600 dark:bg-red-500"
              )}
            >
              {isIncome ? '+' : '-'}
            </motion.div>
          </div>
        </motion.div>

        {/* ✨ Transaction Details */}
        <div className={cn(
          "flex-1 min-w-0",
          viewMode === 'grid' && "text-center"
        )}>
          {/* Description and Type */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h4 className={cn(
                "font-semibold text-gray-900 dark:text-white truncate",
                viewMode === 'grid' ? "text-center" : "text-left"
              )}>
                {transaction?.description || t('transactions.noDescription', 'No description')}
              </h4>
              
              {/* Category and Type */}
              <div className={cn(
                "flex items-center gap-2 mt-1",
                viewMode === 'grid' && "justify-center"
              )}>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {transaction?.category_name || transaction?.category?.name || t('categories.uncategorized', 'Uncategorized')}
                </span>
                <span className="text-gray-400">•</span>
                <TransactionTypeBadge isIncome={isIncome} isRecurring={isRecurring} />
              </div>
            </div>

            {/* Action Menu */}
            {viewMode !== 'grid' && (
              <ActionMenu
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                isOpen={isMenuOpen}
                onToggle={() => setIsMenuOpen(!isMenuOpen)}
              />
            )}
          </div>

          {/* Date, Time and Amount */}
          <div className={cn(
            "flex items-center justify-between gap-3 flex-wrap",
            viewMode === 'grid' && "flex-col gap-2"
          )}>
            {/* Date and Time */}
            <div className={cn(
              "flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400",
              viewMode === 'grid' && "justify-center"
            )}>
              <Calendar className="w-4 h-4" />
              <span>{getDateLabel()}</span>
              <span className="text-gray-400">•</span>
              <Clock className="w-4 h-4" />
              <span>{transaction?.transaction_datetime ? getTimezoneDisplay() : getTimeLabel()}</span>
            </div>

            {/* Amount */}
            <motion.div
              variants={amountVariants}
              className={cn(
                "flex items-center gap-2",
                viewMode === 'grid' && "justify-center"
              )}
            >
              <div className={cn(
                "font-bold text-base md:text-lg leading-tight tabular-nums tracking-tight",
                "whitespace-nowrap",
                isIncome 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(amount)}
              </div>
              
              {/* Selection Checkbox */}
              {onSelect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(transaction.id, !isSelected);
                  }}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    isSelected
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                  )}
                  aria-label={t('actions.select', 'Select')}
                >
                  {isSelected && <span className="text-xs leading-none">✓</span>}
                </button>
              )}
            </motion.div>
          </div>

          {/* Grid View Action Menu */}
          {viewMode === 'grid' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <ActionMenu
                transaction={transaction}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                isOpen={isMenuOpen}
                onToggle={() => setIsMenuOpen(!isMenuOpen)}
                className="mx-auto"
              />
            </div>
          )}
        </div>
      </div>

      {/* ✨ Recurring Pattern Overlay */}
      {isRecurring && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              currentColor,
              currentColor 1px,
              transparent 1px,
              transparent 10px
            )`,
            color: isIncome ? '#10b981' : '#f59e0b'
          }}
        />
      )}

      {/* ✨ Hover Glow Effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "absolute inset-0 rounded-xl pointer-events-none",
          isIncome 
            ? "bg-green-400" 
            : "bg-red-400"
        )}
      />
    </motion.div>
  );
};

export default ModernTransactionCard;
