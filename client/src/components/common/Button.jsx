// components/common/Button.jsx
// Custom button component with full translation support
// Enhanced button with loading states and ripple effects
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Button Component
 * Custom button with multiple variants, sizes, and states
 * Full translation support for loading states and accessibility labels
 * 
 * @param {ReactNode} children - Button content
 * @param {string} type - Button type (button, submit, reset)
 * @param {string} variant - Button variant (primary, secondary, danger, ghost)
 * @param {string} size - Button size (small, default, large)
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {Function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} loading - Whether button is in loading state
 * @param {string} className - Additional CSS classes
 * @param {Component} icon - Icon component to display
 */
const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  icon: Icon = null,
}) => {
  const { t } = useLanguage();
  
  // Base button styling
  const baseClasses = 'relative flex items-center justify-center transition-all duration-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 overflow-hidden';
 
  // Size variations
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2.5',
    large: 'px-6 py-3 text-lg'
  };
 
  // Variant styling with enhanced states
  const variants = {
    primary: `bg-primary-500 text-white hover:bg-primary-600 
              hover:shadow-md hover:-translate-y-0.5 
              active:bg-primary-700 active:translate-y-0 active:shadow-sm
              disabled:bg-primary-300 disabled:hover:transform-none disabled:hover:shadow-none
              dark:bg-primary-600 dark:hover:bg-primary-700 dark:disabled:bg-primary-800/50`,
    
    secondary: `bg-white text-primary-600 border border-primary-300 
                hover:bg-primary-50 hover:border-primary-400 hover:shadow-sm hover:-translate-y-0.5
                active:bg-primary-100 active:translate-y-0 active:shadow-none
                disabled:bg-gray-50 disabled:border-gray-200 disabled:text-primary-300 
                disabled:hover:transform-none disabled:hover:shadow-none
                dark:bg-gray-700 dark:border-gray-600 dark:text-primary-400 
                dark:hover:bg-gray-600 dark:disabled:bg-gray-800`,
    
    danger: `bg-error text-white
             hover:bg-error-dark hover:shadow-md hover:-translate-y-0.5
             active:bg-error-darker active:translate-y-0 active:shadow-sm
             disabled:bg-error-light disabled:hover:transform-none disabled:hover:shadow-none
             dark:bg-red-700 dark:hover:bg-red-800`,
    
    ghost: `bg-transparent text-primary-600 
            hover:bg-primary-50 hover:-translate-y-0.5
            active:bg-primary-100 active:translate-y-0
            disabled:text-primary-300 disabled:hover:bg-transparent disabled:hover:transform-none
            dark:text-primary-400 dark:hover:bg-gray-800`
  };
 
  // Handle click with ripple effect
  const handleClick = (e) => {
    if (loading || disabled) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'absolute rounded-full bg-white/20 animate-ripple';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.transform = 'translate(-50%, -50%)';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 700);
    
    onClick?.(e);
  };

  // Determine loading text based on variant
  const getLoadingText = () => {
    switch (variant) {
      case 'primary':
        return t('common.loading');
      case 'secondary':
        return t('common.processing');
      case 'danger':
        return t('common.deleting');
      default:
        return t('common.loading');
    }
  };
 
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'cursor-not-allowed opacity-60' : ''}
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
    >
      {/* Loading Spinner */}
      {loading && (
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-label={getLoadingText()}
        >
          <svg 
            className="animate-spin h-5 w-5" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}
 
      {/* Icon + Content Container */}
      <div className={`flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </div>
    </button>
  );
};
 
export default Button;