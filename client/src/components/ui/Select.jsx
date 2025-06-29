// components/ui/Select.jsx
import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useLanguage } from '../../context/LanguageContext';

const Select = forwardRef(({
  label,
  options = [],
  error,
  helper,
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const { language, t } = useLanguage();
  const isRTL = language === 'he';
  
  // Use translation for default placeholder
  const defaultPlaceholder = placeholder || t('common.select');

  const baseSelectStyles = `
    w-full px-4 py-3 pr-10 rounded-xl border bg-white
    appearance-none cursor-pointer
    transition-all duration-200
    disabled:bg-gray-50 disabled:cursor-not-allowed
    dark:bg-gray-800 dark:text-white
  `;

  const selectStyles = cn(
    baseSelectStyles,
    error 
      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
      : 'border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:border-gray-700',
    isRTL ? 'pr-4 pl-10' : 'pl-4 pr-10',
    className
  );

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
        <select
          ref={ref}
          disabled={disabled}
          className={selectStyles}
          dir={isRTL ? 'rtl' : 'ltr'}
          {...props}
        >
          {defaultPlaceholder && (
            <option value="" disabled>
              {defaultPlaceholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <ChevronDown className={cn(
          'absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none',
          isRTL ? 'left-3' : 'right-3'
        )} />
      </div>
      
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-500" dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helper && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400" dir={isRTL ? 'rtl' : 'ltr'}>
          {helper}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;