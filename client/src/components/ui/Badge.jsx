/**
 * 🏷️ BADGE COMPONENT - Mobile-First Status Badge
 * Features: Zustand stores, Multiple variants, RTL support
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  removable = false,
  onRemove,
  ...props
}) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { isRTL } = useTranslation();

  // ✅ Size configurations
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  };

  // ✅ Variant configurations
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-100',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors',
        'select-none',
        sizes[size],
        variants[variant],
        isRTL && 'flex-row-reverse',
        className
      )}
      {...props}
    >
      {/* Icon */}
      {icon && (
        <span className={cn(
          'flex-shrink-0',
          children && (isRTL ? 'ml-1' : 'mr-1'),
          size === 'xs' ? 'w-3 h-3' :
          size === 'sm' ? 'w-3 h-3' :
          size === 'md' ? 'w-4 h-4' : 'w-4 h-4'
        )}>
          {React.isValidElement(icon) ? React.cloneElement(icon, {
            className: cn(
              size === 'xs' ? 'w-3 h-3' :
              size === 'sm' ? 'w-3 h-3' :
              size === 'md' ? 'w-4 h-4' : 'w-4 h-4'
            )
          }) : icon}
        </span>
      )}

      {/* Content */}
      <span className="truncate">{children}</span>

      {/* Remove button */}
      {removable && (
        <button
          onClick={onRemove}
          className={cn(
            'flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
            children && (isRTL ? 'mr-1' : 'ml-1')
          )}
          aria-label="Remove"
        >
          <X className={cn(
            size === 'xs' ? 'w-2.5 h-2.5' :
            size === 'sm' ? 'w-3 h-3' :
            size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'
          )} />
        </button>
      )}
    </motion.span>
  );
};

// ✅ Preset badge variants
export const SuccessBadge = (props) => <Badge variant="success" {...props} />;
export const DangerBadge = (props) => <Badge variant="danger" {...props} />;
export const WarningBadge = (props) => <Badge variant="warning" {...props} />;
export const InfoBadge = (props) => <Badge variant="info" {...props} />;
export const PrimaryBadge = (props) => <Badge variant="primary" {...props} />;

export default Badge;