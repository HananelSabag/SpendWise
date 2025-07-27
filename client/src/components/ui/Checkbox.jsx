/**
 * 🔲 CHECKBOX COMPONENT - Mobile-First Interactive Checkbox
 * Features: Zustand integration, Accessible, Animated, Theme-aware
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation, useTheme } from '../../stores';
import { cn } from '../../utils/helpers';

const Checkbox = forwardRef(({
  id,
  name,
  checked = false,
  indeterminate = false,
  disabled = false,
  onChange,
  onFocus,
  onBlur,
  className = '',
  size = 'md',
  variant = 'primary',
  label,
  description,
  error,
  required = false,
  ...props
}, ref) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();
  const { isDark } = useTheme();

  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Variant classes
  const variantClasses = {
    primary: {
      base: 'border-gray-300 dark:border-gray-600',
      checked: 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500',
      hover: 'hover:border-primary-500 dark:hover:border-primary-400'
    },
    secondary: {
      base: 'border-gray-300 dark:border-gray-600',
      checked: 'bg-gray-600 border-gray-600 dark:bg-gray-500 dark:border-gray-500',
      hover: 'hover:border-gray-500 dark:hover:border-gray-400'
    },
    success: {
      base: 'border-gray-300 dark:border-gray-600',
      checked: 'bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500',
      hover: 'hover:border-green-500 dark:hover:border-green-400'
    }
  };

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  const checkboxId = id || name;

  return (
    <div className={cn(
      'flex items-start gap-3',
      isRTL && 'flex-row-reverse',
      className
    )}>
      {/* Checkbox Input */}
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className="sr-only"
          {...props}
        />
        
        <motion.label
          htmlFor={checkboxId}
          className={cn(
            'relative flex items-center justify-center rounded border-2 cursor-pointer transition-all duration-200',
            sizeClasses[size],
            disabled && 'cursor-not-allowed opacity-50',
            !disabled && variantClasses[variant].hover,
            checked || indeterminate 
              ? variantClasses[variant].checked 
              : cn(
                  variantClasses[variant].base,
                  'bg-white dark:bg-gray-800'
                ),
            error && 'border-red-500 dark:border-red-400'
          )}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <AnimatePresence>
            {(checked || indeterminate) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center text-white"
              >
                {indeterminate ? (
                  <Minus className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.label>
      </div>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'block text-sm font-medium cursor-pointer',
                disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-900 dark:text-white',
                error && 'text-red-900 dark:text-red-300'
              )}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label={t('form.required', { fallback: 'Required' })}>
                  *
                </span>
              )}
            </label>
          )}
          
          {description && (
            <p className={cn(
              'mt-1 text-xs',
              disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400',
              error && 'text-red-600 dark:text-red-400'
            )}>
              {description}
            </p>
          )}
          
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox; 