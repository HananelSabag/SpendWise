/**
 * 🃏 CARD COMPONENT - Mobile-First Content Container
 * Features: Zustand stores, Multiple variants, Touch-optimized
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Card = React.forwardRef(({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  hover = false,
  clickable = false,
  onClick,
  ...props
}, ref) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { isRTL } = useTranslation();

  // ✅ Variant configurations
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
    outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
    glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg',
    gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm'
  };

  // ✅ Padding configurations
  const paddings = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8'
  };

  // ✅ Interactive states
  const interactiveClasses = cn(
    hover && 'hover:shadow-md transition-shadow duration-200',
    clickable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200',
    onClick && 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
  );

  // Use div for clickable to avoid nesting <button> inside <button> issues
  const CardComponent = motion.div;

  return (
    <CardComponent
      ref={ref}
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      className={cn(
        'rounded-lg overflow-hidden',
        variants[variant],
        paddings[padding],
        interactiveClasses,
        // RTL support
        isRTL && 'text-right',
        // Mobile touch optimization
        clickable && 'touch-manipulation select-none',
        className
      )}
      role={clickable || onClick ? 'button' : undefined}
      tabIndex={clickable || onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </CardComponent>
  );
});

Card.displayName = 'Card';

// ✅ Card header component
export const CardHeader = ({ children, className = '', ...props }) => {
  const { isRTL } = useTranslation();
  
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
        isRTL && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ✅ Card body component
export const CardBody = ({ children, className = '', ...props }) => {
  const { isRTL } = useTranslation();
  
  return (
    <div
      className={cn(
        'p-6',
        isRTL && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ✅ Card footer component
export const CardFooter = ({ children, className = '', ...props }) => {
  const { isRTL } = useTranslation();
  
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50',
        isRTL && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;