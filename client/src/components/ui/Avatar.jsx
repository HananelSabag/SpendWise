/**
 * 👤 AVATAR COMPONENT - Mobile-First User Avatar
 * Features: Zustand stores, Responsive sizing, Fallback handling
 * @version 2.0.0
 */

import React from 'react';
import { User } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Avatar = ({
  src,
  alt,
  size = 'md',
  fallback,
  name,
  className = '',
  ...props
}) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t } = useTranslation();

  // ✅ Size configurations
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  // ✅ Generate initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = fallback || getInitials(name || alt || '');

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden',
        'flex-shrink-0 select-none',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || t('common.avatar', { fallback: 'Avatar' })}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : initials ? (
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {initials}
        </span>
      ) : (
        <User className={cn(
          'text-gray-400 dark:text-gray-500',
          size === 'xs' ? 'w-3 h-3' :
          size === 'sm' ? 'w-4 h-4' :
          size === 'md' ? 'w-5 h-5' :
          size === 'lg' ? 'w-6 h-6' :
          size === 'xl' ? 'w-8 h-8' : 'w-10 h-10'
        )} />
      )}
    </div>
  );
};

export default Avatar;