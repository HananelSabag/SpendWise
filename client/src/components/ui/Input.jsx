// components/ui/Input.jsx
import React, { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helper,
  icon: Icon,
  state = null, // NEW: success, warning, info
  required = false,
  disabled = false,
  fullWidth = true,
  className = '',
  containerClassName = '',
  labelClassName = '',
  onBlur,
  onFocus,
  ...props
}, ref) => {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  
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

  // 🎯 PHASE 15: Enhanced state system
  const getStateStyles = () => {
    if (error) return 'input-state-error';
    if (state === 'success') return 'input-state-success';
    if (state === 'warning') return 'input-state-warning';
    if (state === 'info') return 'input-state-info';
    return 'input-state-default';
  };

  const getStateIcon = () => {
    if (error) return AlertCircle;
    if (state === 'success') return CheckCircle;
    if (state === 'warning') return AlertTriangle;
    if (state === 'info') return Info;
    return null;
  };

  const getStateMessage = () => {
    if (error) return error;
    if (state === 'success' && helper) return helper;
    if (state === 'warning' && helper) return helper;
    if (state === 'info' && helper) return helper;
    return helper;
  };

  const getStateColor = () => {
    if (error) return 'text-red-500';
    if (state === 'success') return 'text-green-600';
    if (state === 'warning') return 'text-amber-600';
    if (state === 'info') return 'text-blue-600';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getIconColor = () => {
    if (error) return 'text-red-500';
    if (state === 'success') return 'text-green-500';
    if (state === 'warning') return 'text-amber-500';
    if (state === 'info') return 'text-blue-500';
    if (isFocused) return 'text-primary-500';
    return 'text-gray-400';
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
    getStateStyles(),
    Icon && (isRTL ? 'pr-11' : 'pl-11'),
    isPassword && (isRTL ? 'pl-11' : 'pr-11'),
    className
  );

  const StateIcon = getStateIcon();
  const stateMessage = getStateMessage();
  const stateColor = getStateColor();

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full', containerClassName)}>
      {label && (
        <label 
          className={cn(
            'block text-sm font-medium text-gray-700 dark:text-gray-300',
            labelClassName
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {label}
          {required && <span className="text-red-500 mx-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className={cn(
            'absolute top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none',
            getIconColor(),
            isRTL ? 'right-3' : 'left-3'
          )} />
        )}
        
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={inputStyles}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              isRTL ? 'left-3' : 'right-3'
            )}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      
      {(stateMessage && (error || state)) && (
        <div className={cn(
          "flex items-center gap-1.5 text-sm transition-all duration-200",
          stateColor
        )} dir={isRTL ? 'rtl' : 'ltr'}>
          {StateIcon && <StateIcon className="w-4 h-4 flex-shrink-0" />}
          <span>{stateMessage}</span>
        </div>
      )}
      
      {helper && !error && !state && (
        <p className="text-sm text-gray-500 dark:text-gray-400" dir={isRTL ? 'rtl' : 'ltr'}>
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;