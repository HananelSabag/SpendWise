/**
 * 🔘 SWITCH COMPONENT
 * Toggle switch for boolean values
 * Features: Accessible, Smooth animations, Mobile-friendly
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

console.log('🔘 Switch component loading...');

const Switch = ({ 
  checked = false, 
  onCheckedChange, 
  disabled = false, 
  size = 'md',
  className,
  ...props 
}) => {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      try {
        onCheckedChange(!checked);
      } catch (error) {
        console.error('Switch onCheckedChange error:', error);
      }
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-6' : 'translate-x-0.5'
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2',
        'focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
        sizeClasses[size],
        checked
          ? 'bg-blue-600 dark:bg-blue-500'
          : 'bg-gray-200 dark:bg-gray-700',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-opacity-90',
        className
      )}
      {...props}
    >
      <span className="sr-only">Toggle switch</span>
      <motion.span
        layout
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-lg',
          'transform ring-0 transition duration-200 ease-in-out',
          thumbSizeClasses[size],
          translateClasses[size]
        )}
        animate={{
          x: checked ? 
            (size === 'sm' ? 16 : size === 'md' ? 20 : 24) : 
            2
        }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
      />
    </button>
  );
};

export default Switch; 