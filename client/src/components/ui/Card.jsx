// components/ui/Card.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  footer,
  variant = 'default',
  padding = 'default',
  hoverable = false,
  clickable = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white shadow-lg dark:bg-gray-800',
    filled: 'bg-gray-50 dark:bg-gray-900'
  };

  const paddings = {
    none: '',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8'
  };

  const cardStyles = cn(
    'rounded-xl transition-all duration-200',
    variants[variant],
    hoverable && 'hover:shadow-lg hover:-translate-y-0.5',
    clickable && 'cursor-pointer',
    className
  );

  const content = (
    <>
      {(title || subtitle || actions) && (
        <div className={cn(
          'border-b border-gray-100 dark:border-gray-700',
          padding !== 'none' && paddings[padding],
          headerClassName
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="ml-4">{actions}</div>}
          </div>
        </div>
      )}
      
      <div className={cn(
        padding !== 'none' && paddings[padding],
        bodyClassName
      )}>
        {children}
      </div>
      
      {footer && (
        <div className={cn(
          'border-t border-gray-100 dark:border-gray-700',
          padding !== 'none' && paddings[padding],
          footerClassName
        )}>
          {footer}
        </div>
      )}
    </>
  );

  if (clickable && onClick) {
    return (
      <div
        onClick={onClick}
        className={cardStyles}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        {...props}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={cardStyles} {...props}>
      {content}
    </div>
  );
};

export default Card;