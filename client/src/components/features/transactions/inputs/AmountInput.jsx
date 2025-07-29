/**
 * 💰 AMOUNT INPUT - Enhanced Currency-Aware Input
 * New clean architecture component - eliminates duplication
 * Features: Currency formatting, Validation, Mobile-first, Accessibility
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency
} from '../../../../stores';

import { cn } from '../../../../utils/helpers';
import { parseAmountInput } from '../forms/TransactionHelpers';
import { getCurrencySymbol } from '../../../../utils/currencyAPI';

/**
 * 💰 Amount Input Component
 */
const AmountInput = ({
  value = '',
  onChange,
  type = 'expense', // expense, income
  error = null,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  autoFocus = false,
  ...props
}) => {
  const { t } = useTranslation('transactions');
  const { currency, formatCurrency } = useCurrency();
  
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // ✅ Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // ✅ Currency symbol
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  // ✅ Type configuration
  const typeConfig = useMemo(() => {
    return type === 'income' 
      ? {
          icon: TrendingUp,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-700',
          focusColor: 'focus:ring-green-500 focus:border-green-500'
        }
      : {
          icon: TrendingDown,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-700',
          focusColor: 'focus:ring-red-500 focus:border-red-500'
        };
  }, [type]);

  const TypeIcon = typeConfig.icon;

  // ✅ Handle input change
  const handleChange = useCallback((e) => {
    const rawValue = e.target.value;
    const cleanValue = parseAmountInput(rawValue);
    
    setLocalValue(cleanValue);
    onChange?.(cleanValue);
  }, [onChange]);

  // ✅ Handle focus
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (autoFocus) {
      // Select all text on focus for easy editing
      e.target.select();
    }
  }, [autoFocus]);

  // ✅ Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // ✅ Format display value
  const displayValue = useMemo(() => {
    if (!localValue || localValue === '') return '';
    
    // If focused, show raw input for editing
    if (isFocused) return localValue;
    
    // If not focused, show formatted currency
    const numValue = parseFloat(localValue);
    if (isNaN(numValue)) return localValue;
    
    return formatCurrency(numValue);
  }, [localValue, isFocused, formatCurrency]);

  // ✅ Handle key press
  const handleKeyPress = useCallback((e) => {
    // Allow only numbers, decimal point, and control keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(e.key)) return;
    
    // Allow numbers and one decimal point
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
      return;
    }
    
    // Prevent multiple decimal points
    if (e.key === '.' && localValue.includes('.')) {
      e.preventDefault();
    }
  }, [localValue]);

  // ✅ Handle paste
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const cleanValue = parseAmountInput(pastedData);
    setLocalValue(cleanValue);
    onChange?.(cleanValue);
  }, [onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.amount.label')}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Currency Symbol */}
        <div className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 pointer-events-none z-10",
          isFocused ? typeConfig.color : "text-gray-500 dark:text-gray-400"
        )}>
          <span className="text-lg font-medium">
            {currencySymbol}
          </span>
          <TypeIcon className="w-4 h-4" />
        </div>

        {/* Input Field */}
        <motion.input
          ref={inputRef}
          type="text"
          value={isFocused ? localValue : displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          onPaste={handlePaste}
          placeholder={placeholder || t('fields.amount.placeholder')}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "w-full pl-16 pr-4 py-3 text-lg font-medium",
            "border rounded-lg transition-all duration-200",
            "bg-white dark:bg-gray-800",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500 dark:placeholder-gray-400",
            
            // Focus styles
            isFocused && [
              "ring-2 ring-opacity-50",
              typeConfig.focusColor,
              typeConfig.borderColor
            ],
            
            // Error styles
            error ? [
              "border-red-300 dark:border-red-600",
              "bg-red-50 dark:bg-red-900/10"
            ] : [
              "border-gray-300 dark:border-gray-600",
              "hover:border-gray-400 dark:hover:border-gray-500"
            ],
            
            // Disabled styles
            disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
          )}
          {...props}
        />

        {/* Amount Preview */}
        {localValue && !isFocused && !error && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <div className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              typeConfig.bgColor,
              typeConfig.color
            )}>
              {type === 'income' ? t('types.income') : t('types.expense')}
            </div>
          </motion.div>
        )}

        {/* Error Icon */}
        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.p>
      )}

      {/* Helper Text */}
      {!error && localValue && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {t('fields.amount.helper', { 
            currency,
            type: type === 'income' ? t('types.income') : t('types.expense')
          })}
        </motion.p>
      )}
    </div>
  );
};

export default AmountInput; 