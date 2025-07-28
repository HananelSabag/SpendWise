/**
 * 🔘 SWITCH COMPONENT
 * Toggle switch for boolean values
 * Features: Accessible, Smooth animations, Mobile-friendly
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Switch = ({ 
  checked = false,
  onCheckedChange,
  disabled = false,
  size = 'default', // 'sm', 'default', 'lg'
  variant = 'default', // 'default', 'success', 'warning', 'danger'
  className = '',
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    sm: 'h-4 w-7',
    default: 'h-5 w-9', 
    lg: 'h-6 w-11'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Variant colors
  const variantClasses = {
    default: checked 
      ? 'bg-primary-600 border-primary-600' 
      : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600',
    success: checked 
      ? 'bg-green-600 border-green-600' 
      : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600',
    warning: checked 
      ? 'bg-yellow-600 border-yellow-600' 
      : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600',
    danger: checked 
      ? 'bg-red-600 border-red-600' 
      : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        // Base styles
        'relative inline-flex items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        
        // Size
        sizeClasses[size],
        
        // Variant colors
        variantClasses[variant],
        
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        
        // Custom className
        className
      )}
      {...props}
    >
      <motion.span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
          thumbSizeClasses[size]
        )}
        animate={{
          x: checked ? (size === 'sm' ? 12 : size === 'lg' ? 20 : 16) : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
};

export default Switch; 