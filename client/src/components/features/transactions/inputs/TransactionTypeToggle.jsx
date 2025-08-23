/**
 * 🔄 TRANSACTION TYPE TOGGLE - Income/Expense Switcher
 * New clean architecture component - eliminates duplication
 * Features: Animated toggle, Mobile-first, Accessibility, Visual feedback
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { cn } from '../../../../utils/helpers';
import { TRANSACTION_TYPES } from '../forms/TransactionHelpers';

/**
 * 🔄 Transaction Type Toggle Component
 */
const TransactionTypeToggle = ({
  value = TRANSACTION_TYPES.EXPENSE,
  onChange,
  error = null,
  disabled = false,
  className = '',
  size = 'default' // sm, default, lg
}) => {
  const { t, isRTL } = useTranslation('transactions');

  // ✅ Handle toggle
  const handleToggle = useCallback(() => {
    if (disabled) return;
    
    const newType = value === TRANSACTION_TYPES.EXPENSE 
      ? TRANSACTION_TYPES.INCOME 
      : TRANSACTION_TYPES.EXPENSE;
    
    onChange?.(newType);
  }, [value, onChange, disabled]);

  // ✅ Size configuration
  const sizeConfig = {
    sm: {
      container: 'h-10',
      button: 'h-8 px-3 text-sm',
      icon: 'w-4 h-4'
    },
    default: {
      container: 'h-12',
      button: 'h-10 px-4 text-base',
      icon: 'w-5 h-5'
    },
    lg: {
      container: 'h-14',
      button: 'h-12 px-6 text-lg',
      icon: 'w-6 h-6'
    }
  }[size];

  // ✅ Type configurations - Enhanced mobile support
  const typeConfigs = {
    [TRANSACTION_TYPES.EXPENSE]: {
      label: t('types.expense'),
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500',
      bgColorLight: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      activeTextColor: 'text-white',
      inactiveTextColor: 'text-red-600 dark:text-red-400'
    },
    [TRANSACTION_TYPES.INCOME]: {
      label: t('types.income'),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500',
      bgColorLight: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      activeTextColor: 'text-white',
      inactiveTextColor: 'text-green-600 dark:text-green-400'
    }
  };

  const currentConfig = typeConfigs[value];
  const otherType = value === TRANSACTION_TYPES.EXPENSE ? TRANSACTION_TYPES.INCOME : TRANSACTION_TYPES.EXPENSE;
  const otherConfig = typeConfigs[otherType];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.type.label')}
      </label>

      {/* Toggle Container - Enhanced Mobile Support */}
      <div className={cn(
        "relative flex items-center border-2 rounded-lg overflow-hidden transition-all duration-200 touch-manipulation",
        sizeConfig.container,
        error ? "border-red-300 dark:border-red-600" : "border-gray-200 dark:border-gray-700",
        disabled && "opacity-50 cursor-not-allowed",
        // Enhanced mobile support
        "select-none"
      )} style={{ direction: 'ltr' }}>
        {/* Background Slider - Enhanced Mobile Animation */}
        <motion.div
          layout
          className={cn(
            "absolute top-1 bottom-1 w-1/2 rounded-md shadow-sm",
            currentConfig.bgColor,
            // Enhanced mobile performance
            "will-change-transform"
          )}
          initial={false}
          animate={{
            x: value === TRANSACTION_TYPES.EXPENSE ? '2px' : 'calc(100% - 2px)'
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
            mass: 0.8
          }}
        />

        {/* Expense Button - Enhanced Mobile Support */}
        <button
          type="button"
          onClick={() => onChange?.(TRANSACTION_TYPES.EXPENSE)}
          disabled={disabled}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center space-x-2 font-medium transition-all duration-200",
            sizeConfig.button,
            // Enhanced color logic for mobile
            value === TRANSACTION_TYPES.EXPENSE 
              ? "text-white font-semibold" 
              : cn(
                  typeConfigs[TRANSACTION_TYPES.EXPENSE].inactiveTextColor,
                  !disabled && "hover:bg-red-50 dark:hover:bg-red-900/10 active:bg-red-100 dark:active:bg-red-900/20"
                ),
            !disabled && "cursor-pointer touch-manipulation",
            // Mobile-specific enhancements
            "tap-highlight-transparent focus:outline-none focus:ring-2 focus:ring-red-500/50"
          )}
        >
          <TrendingDown className={cn(sizeConfig.icon, "flex-shrink-0")} />
          <span className="truncate">{typeConfigs[TRANSACTION_TYPES.EXPENSE].label}</span>
        </button>

        {/* Income Button - Enhanced Mobile Support */}
        <button
          type="button"
          onClick={() => onChange?.(TRANSACTION_TYPES.INCOME)}
          disabled={disabled}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center space-x-2 font-medium transition-all duration-200",
            sizeConfig.button,
            // Enhanced color logic for mobile
            value === TRANSACTION_TYPES.INCOME 
              ? "text-white font-semibold" 
              : cn(
                  typeConfigs[TRANSACTION_TYPES.INCOME].inactiveTextColor,
                  !disabled && "hover:bg-green-50 dark:hover:bg-green-900/10 active:bg-green-100 dark:active:bg-green-900/20"
                ),
            !disabled && "cursor-pointer touch-manipulation",
            // Mobile-specific enhancements
            "tap-highlight-transparent focus:outline-none focus:ring-2 focus:ring-green-500/50"
          )}
        >
          <TrendingUp className={cn(sizeConfig.icon, "flex-shrink-0")} />
          <span className="truncate">{typeConfigs[TRANSACTION_TYPES.INCOME].label}</span>
        </button>

        {/* Switch Icon (shows on hover) */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200"
          whileHover={{ opacity: 1 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
            <ArrowRightLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        </motion.div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Helper Text - Enhanced Mobile Readability */}
      {!error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {t('fields.type.helper', { 
            current: currentConfig.label,
            other: otherConfig.label 
          })}
        </p>
      )}
    </div>
  );
};

export default TransactionTypeToggle; 