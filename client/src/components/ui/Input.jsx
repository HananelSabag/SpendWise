// components/ui/Input.jsx
import React, { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helper,
  icon: Icon,
  required = false,
  disabled = false,
  fullWidth = true,
  className = '',
  containerClassName = '',
  labelClassName = '',
  onBlur,
  onFocus,
  dir: dirProp,
  ...props
}, ref) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const dir = dirProp || (isRTL ? 'rtl' : 'ltr');

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const baseInputStyles = `
    w-full px-4 py-3 rounded-xl border bg-white
    transition-all duration-200
    placeholder:text-gray-400
    disabled:bg-gray-50 disabled:cursor-not-allowed
    dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500
  `;

  const inputStyles = cn(
    baseInputStyles,
    error 
      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
      : 'border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:border-gray-700',
    Icon && 'pl-11',
    isPassword && 'pr-11',
    className
  );

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full', containerClassName)}>
      {label && (
        <label className={cn(
          'block text-sm font-medium text-gray-700 dark:text-gray-300',
          labelClassName
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className={cn(
            'absolute top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none',
            error ? 'text-red-500' : isFocused ? 'text-primary-500' : 'text-gray-400',
            isRTL ? 'right-3' : 'left-3'
          )} />
        )}
        
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          dir={dir}
          className={inputStyles}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;