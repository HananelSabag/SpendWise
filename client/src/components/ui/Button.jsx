// components/ui/Button.jsx
import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Button = React.forwardRef(({ 
  children,
  type = 'button',
  variant = 'primary',
  state = null,
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}, ref) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 rounded-xl
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    interaction-enhanced
  `;

  const variants = {
    primary: `
      bg-primary-500 text-white hover:bg-primary-600 
      focus:ring-primary-500 active:bg-primary-700
      dark:bg-primary-600 dark:hover:bg-primary-700
      btn-premium micro-bounce
    `,
    secondary: `
      bg-gray-100 text-gray-900 hover:bg-gray-200
      focus:ring-gray-500 active:bg-gray-300
      dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
      micro-scale transition-spring
    `,
    outline: `
      border-2 border-gray-300 bg-transparent hover:bg-gray-50
      focus:ring-gray-500 active:bg-gray-100
      dark:border-gray-600 dark:hover:bg-gray-800
      micro-lift transition-bounce
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 
      focus:ring-gray-500 active:bg-gray-200
      dark:hover:bg-gray-800 dark:active:bg-gray-700
      micro-scale transition-premium
    `,
    danger: `
      bg-red-500 text-white hover:bg-red-600
      focus:ring-red-500 active:bg-red-700
      dark:bg-red-600 dark:hover:bg-red-700
      btn-premium micro-bounce sparkle-hover
    `,
    success: `
      bg-green-500 text-white hover:bg-green-600
      focus:ring-green-500 active:bg-green-700
      dark:bg-green-600 dark:hover:bg-green-700
      btn-premium micro-bounce
    `,
    gradient: `
      bg-gradient-to-r from-primary-500 to-primary-700 text-white
      hover:from-primary-600 hover:to-primary-800
      focus:ring-primary-500
      btn-gradient-enhanced
    `,
    'state-success': 'btn-state-success transition-spring micro-bounce',
    'state-warning': 'btn-state-warning transition-spring micro-bounce',
    'state-error': 'btn-state-error transition-spring micro-bounce',
    'state-info': 'btn-state-info transition-spring micro-bounce',
    'brand-primary': 'brand-primary brand-element btn-premium micro-lift',
    'brand-secondary': 'brand-secondary brand-element btn-premium micro-scale'
  };

  const sizes = {
    small: 'px-3 py-1.5 typo-button-small',
    default: 'px-4 py-2.5 typo-button',
    large: 'px-6 py-3 typo-button-large'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const getVariant = () => {
    if (state) {
      return `state-${state}`;
    }
    return variant;
  };

  const LoadingIcon = () => (
    <Loader className={cn(iconSizes[size], 'animate-spin')} />
  );

  const renderIcon = () => {
    if (loading) return <LoadingIcon />;
    if (Icon) return <Icon className={iconSizes[size]} />;
    return null;
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        baseStyles,
        variants[getVariant()],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children && (
        <span className={cn(
          (loading || Icon) && iconPosition === 'left' && (isRTL ? 'mr-2' : 'ml-2'),
          (loading || Icon) && iconPosition === 'right' && (isRTL ? 'ml-2' : 'mr-2')
        )}>
          {children}
        </span>
      )}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;