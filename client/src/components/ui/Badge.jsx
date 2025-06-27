// components/ui/Badge.jsx
import React from 'react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Badge = ({
  children,
  variant = 'default',
  state = null,
  size = 'default',
  dot = false,
  className = '',
  ...props
}) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    recurring: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    secondary: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    outline: 'border border-gray-300 bg-transparent text-gray-700 dark:border-gray-600 dark:text-gray-300',
    'state-success': 'badge-state-success interaction-enhanced',
    'state-warning': 'badge-state-warning interaction-enhanced',
    'state-error': 'badge-state-error interaction-enhanced',
    'state-info': 'badge-state-info interaction-enhanced'
  };

  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    small: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    large: 'text-base px-3 py-1'
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    recurring: 'bg-purple-500',
    secondary: 'bg-gray-400',
    outline: 'bg-gray-500',
    'state-success': 'bg-green-600',
    'state-warning': 'bg-amber-600',
    'state-error': 'bg-red-600',
    'state-info': 'bg-blue-600'
  };

  const getVariant = () => {
    if (state) {
      return `state-${state}`;
    }
    return variant;
  };

  const selectedVariant = getVariant();

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-all duration-200',
        variants[selectedVariant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          isRTL ? 'ml-1.5' : 'mr-1.5',
          dotColors[selectedVariant]
        )} />
      )}
      {children}
    </span>
  );
};

export default Badge;