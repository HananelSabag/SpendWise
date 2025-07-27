/**
 * 🔘 BUTTON COMPONENT - Mobile-First Responsive Button
 * Features: Zustand stores, RTL support, Touch-optimized, Loading states
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { isRTL } = useTranslation();

  // ✅ Mobile-first size configurations
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs font-medium min-h-[32px]',
    sm: 'px-3 py-2 text-sm font-medium min-h-[36px]',
    md: 'px-4 py-2.5 text-sm font-medium min-h-[40px]',
    lg: 'px-6 py-3 text-base font-medium min-h-[44px]',
    xl: 'px-8 py-4 text-lg font-semibold min-h-[48px]'
  };

  // ✅ Enhanced variant configurations with mobile touch targets
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white shadow-sm hover:shadow-md active:bg-primary-800',
    secondary: 'bg-gray-100 hover:bg-gray-200 focus:ring-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-sm hover:shadow-md active:bg-green-800',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm hover:shadow-md active:bg-red-800',
    warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-white shadow-sm hover:shadow-md active:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm hover:shadow-md active:bg-blue-800',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-600',
    link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300'
  };

  // ✅ Handle click with loading state
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // ✅ Icon positioning based on RTL
  const showIconLeft = icon && (iconPosition === 'left' && !isRTL) || (iconPosition === 'right' && isRTL);
  const showIconRight = icon && (iconPosition === 'right' && !isRTL) || (iconPosition === 'left' && isRTL);

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={cn(
        // Base styles with mobile-first approach
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Mobile touch optimizations
        'touch-manipulation select-none',
        'active:transform active:transition-transform',
        // Enhanced hover and focus states for better UX
        'hover:transform hover:transition-transform',
        // RTL support
        isRTL && 'flex-row-reverse',
        // Size configuration
        sizes[size],
        // Variant styling
        variants[variant],
        // Full width option
        fullWidth && 'w-full',
        className
      )}
      // ✅ Enhanced accessibility
      aria-disabled={disabled || loading}
      data-loading={loading}
      {...props}
    >
      {/* ✅ Loading spinner */}
      {loading && (
        <Loader2 className={cn(
          'animate-spin',
          size === 'xs' ? 'w-3 h-3' : 
          size === 'sm' ? 'w-4 h-4' : 
          size === 'md' ? 'w-4 h-4' : 
          size === 'lg' ? 'w-5 h-5' : 'w-6 h-6',
          children && (isRTL ? 'ml-2' : 'mr-2')
        )} />
      )}

      {/* ✅ Left icon (respects RTL) */}
      {!loading && showIconLeft && (
        <span className={cn(
          'flex-shrink-0',
          children && 'mr-2',
          size === 'xs' ? 'w-3 h-3' : 
          size === 'sm' ? 'w-4 h-4' : 
          size === 'md' ? 'w-4 h-4' : 
          size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'
        )}>
          {React.isValidElement(icon) ? React.cloneElement(icon, {
            className: cn(
              size === 'xs' ? 'w-3 h-3' : 
              size === 'sm' ? 'w-4 h-4' : 
              size === 'md' ? 'w-4 h-4' : 
              size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'
            )
          }) : icon}
        </span>
      )}

      {/* ✅ Button content */}
      {children && (
        <span className={cn(
          'truncate',
          // Ensure text doesn't interfere with loading spinner or icons
          loading && 'opacity-0',
          !loading && (showIconLeft || showIconRight) && 'flex-1'
        )}>
          {children}
        </span>
      )}

      {/* ✅ Right icon (respects RTL) */}
      {!loading && showIconRight && (
        <span className={cn(
          'flex-shrink-0',
          children && 'ml-2',
          size === 'xs' ? 'w-3 h-3' : 
          size === 'sm' ? 'w-4 h-4' : 
          size === 'md' ? 'w-4 h-4' : 
          size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'
        )}>
          {React.isValidElement(icon) ? React.cloneElement(icon, {
            className: cn(
              size === 'xs' ? 'w-3 h-3' : 
              size === 'sm' ? 'w-4 h-4' : 
              size === 'md' ? 'w-4 h-4' : 
              size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'
            )
          }) : icon}
        </span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

// ✅ Button variants for easy import
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const DangerButton = (props) => <Button variant="danger" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;
export const InfoButton = (props) => <Button variant="info" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const LinkButton = (props) => <Button variant="link" {...props} />;

export default Button;