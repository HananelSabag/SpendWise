/**
 * 📝 INPUT COMPONENT - Mobile-First Form Input
 * Features: Zustand stores, RTL support, Touch-optimized, Validation states
 * @version 2.0.0
 */

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  success,
  hint,
  required = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  variant = 'default',
  icon,
  iconPosition = 'left',
  endIcon,
  className = '',
  containerClassName = '',
  labelClassName = '',
  showPasswordToggle = false,
  autoComplete,
  ...props
}, ref) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // ✅ Determine actual input type
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const isPassword = type === 'password';

  // ✅ Mobile-first size configurations
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-4 text-base'
  };

  // ✅ Variant configurations
  const variants = {
    default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
    filled: 'border-0 bg-gray-100 dark:bg-gray-700',
    underlined: 'border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent rounded-none'
  };

  // ✅ State-based styling
  const getStateStyles = () => {
    if (error) {
      return 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20';
    }
    if (success) {
      return 'border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-500/20';
    }
    return 'focus:border-primary-500 focus:ring-primary-500/20 dark:focus:border-primary-400';
  };

  // ✅ Icon positioning based on RTL
  const showLeftIcon = icon && (iconPosition === 'left' && !isRTL) || (iconPosition === 'right' && isRTL);
  const showRightIcon = icon && (iconPosition === 'right' && !isRTL) || (iconPosition === 'left' && isRTL);

  // ✅ Handle password toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ✅ Determine if input has right-side elements
  const hasRightElements = showRightIcon || endIcon || isPassword || error || success;
  const hasLeftElements = showLeftIcon;

  return (
    <div className={cn('relative', fullWidth && 'w-full', containerClassName)}>
      {/* ✅ Label */}
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

      {/* ✅ Input container */}
      <div className="relative">
        {/* ✅ Left icon */}
        {showLeftIcon && (
          <div className={cn(
            'absolute inset-y-0 flex items-center pointer-events-none',
            isRTL ? 'right-0 pr-3' : 'left-0 pl-3'
          )}>
            {React.isValidElement(icon) ? React.cloneElement(icon, {
              className: cn('w-5 h-5 text-gray-400', icon.props.className)
            }) : icon}
          </div>
        )}

        {/* ✅ Input field */}
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            // Base styles
            'block w-full rounded-lg transition-all duration-200',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2',
            // Mobile optimizations
            'touch-manipulation',
            // Size
            sizes[size],
            // Variant
            variants[variant],
            // State styling
            getStateStyles(),
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
            // Padding adjustments for icons
            hasLeftElements && (isRTL ? 'pr-10' : 'pl-10'),
            hasRightElements && (isRTL ? 'pl-10' : 'pr-10'),
            // RTL support
            isRTL && 'text-right',
            className
          )}
          {...props}
        />

        {/* ✅ Right side elements */}
        {hasRightElements && (
          <div className={cn(
            'absolute inset-y-0 flex items-center',
            isRTL ? 'left-0 pl-3' : 'right-0 pr-3'
          )}>
            <div className="flex items-center space-x-2">
              {/* Success icon */}
              {success && !error && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}

              {/* Error icon */}
              {error && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}

              {/* Right icon */}
              {showRightIcon && !isPassword && (
                <div>
                  {React.isValidElement(icon) ? React.cloneElement(icon, {
                    className: cn('w-5 h-5 text-gray-400', icon.props.className)
                  }) : icon}
                </div>
              )}

              {/* End icon */}
              {endIcon && (
                <div>
                  {React.isValidElement(endIcon) ? React.cloneElement(endIcon, {
                    className: cn('w-5 h-5 text-gray-400', endIcon.props.className)
                  }) : endIcon}
                </div>
              )}

              {/* Password toggle */}
              {isPassword && (showPasswordToggle || props.showPasswordToggle !== false) && (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300 p-1 rounded transition-colors"
                  aria-label={showPassword ? t('common.hidePassword', { fallback: 'Hide password' }) : t('common.showPassword', { fallback: 'Show password' })}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ✅ Focus ring for better mobile accessibility */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-lg ring-2 ring-primary-500/20 pointer-events-none"
          />
        )}
      </div>

      {/* ✅ Helper text, error, or success message */}
      <AnimatePresence>
        {(error || success || hint) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'mt-2 flex items-start space-x-2 text-sm',
              isRTL && 'text-right space-x-reverse'
            )}
          >
            {/* Message icon */}
            {error && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
            {success && !error && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
            {hint && !error && !success && <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}

            {/* Message text */}
            <span className={cn(
              'leading-5',
              error && 'text-red-600 dark:text-red-400',
              success && !error && 'text-green-600 dark:text-green-400',
              hint && !error && !success && 'text-gray-500 dark:text-gray-400'
            )}>
              {error || success || hint}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;