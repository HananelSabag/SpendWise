/**
 * 📋 SELECT COMPONENT - Mobile-First Dropdown Select
 * Features: Zustand stores, RTL support, Touch-optimized
 * @version 2.0.0
 */

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Select = forwardRef(({
  label,
  options = [],
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();

  // ✅ Size configurations
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-4 text-base'
  };

  // ✅ State-based styling
  const getStateStyles = () => {
    if (error) {
      return 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20';
    }
    if (success) {
      return 'border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-500/20';
    }
    return 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20';
  };

  return (
    <div className={cn('relative', fullWidth && 'w-full', containerClassName)}>
      {/* Label */}
      {label && (
        <label
          className={cn(
            'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
            disabled && 'opacity-50',
            isRTL && 'text-right',
            labelClassName
          )}
          htmlFor={props.id}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Select container */}
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            // Base styles
            'block w-full rounded-lg appearance-none transition-all duration-200',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'border focus:outline-none focus:ring-2',
            // Mobile optimizations
            'touch-manipulation',
            // Size
            sizes[size],
            // State styling
            getStateStyles(),
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
            // RTL support
            isRTL && 'text-right',
            // Icon padding
            isRTL ? 'pl-10' : 'pr-10',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option key={option.value || index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown icon */}
        <div className={cn(
          'absolute inset-y-0 flex items-center pointer-events-none',
          isRTL ? 'left-0 pl-3' : 'right-0 pr-3'
        )}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Error/Success message */}
      {(error || success) && (
        <p className={cn(
          'mt-2 text-sm',
          error && 'text-red-600 dark:text-red-400',
          success && 'text-green-600 dark:text-green-400',
          isRTL && 'text-right'
        )}>
          {error || success}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;