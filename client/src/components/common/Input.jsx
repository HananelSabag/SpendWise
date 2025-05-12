// components/common/Input.jsx
import React, { useState } from 'react';
import FormError from './FormError';

const Input = ({ 
  // Base props
  label, 
  type = 'text', 
  value, 
  onChange,
  name,
  
  // Validation & State
  error,
  required = false,
  disabled = false,
  readOnly = false,
  
  // UI/UX
  placeholder,
  icon: Icon,
  direction = 'ltr',
  className = '',
  
  // Extra features
  onBlur,
  onFocus,
  autoComplete,
  min,
  max,
  step,
  
  // Rest props
  ...props 
 }) => {
  // Generate unique ID for accessibility
  const inputId = name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const [isFocused, setIsFocused] = useState(false);
 
  // Handle input change with validation
  const handleChange = (e) => {
    if (disabled) return;
 
    const value = e.target.value;
    
    // Number type validation
    if (type === 'number') {
      const numValue = parseFloat(value);
      if (min !== undefined && !isNaN(numValue) && numValue < min) return;
      if (max !== undefined && !isNaN(numValue) && numValue > max) return;
    }
 
    onChange?.(e);
  };

  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Determine icon position based on direction
  const iconPosition = direction === 'rtl' ? 'right-0 pr-3' : 'left-0 pl-3';
  const inputPadding = Icon 
    ? (direction === 'rtl' ? 'pr-10' : 'pl-10') 
    : '';
 
  return (
    <div className={`flex flex-col w-full ${className}`} dir={direction}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          className={`
            block text-sm font-medium mb-1.5 transition-colors
            ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}
            ${error ? 'text-error' : ''}
            ${isFocused && !error ? 'text-primary-600 dark:text-primary-400' : ''}
          `}
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
 
      {/* Input Container */}
      <div className="relative w-full">
        {/* Icon */}
        {Icon && (
          <div className={`
            absolute inset-y-0 ${iconPosition} flex items-center pointer-events-none
            transition-colors duration-200
            ${error ? 'text-error' : (isFocused ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500')}
          `}>
            <Icon className="h-5 w-5" />
          </div>
        )}
 
        {/* Input Element */}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          className={`
            w-full
            px-4
            py-3
            rounded-xl
            border
            outline-none
            transition-all
            duration-200
            ${inputPadding}
            ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' : ''}
            ${readOnly ? 'bg-gray-50 cursor-default dark:bg-gray-700' : ''}
            ${error 
              ? 'border-error focus:ring-2 focus:ring-error/50 focus:border-error' 
              : 'border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:focus:ring-primary-400'
            }
            ${isFocused && !error ? 'shadow-sm' : ''}
            dark:bg-gray-800 dark:text-white
          `}
          {...props}
        />
 
        {/* Error Message - Using our FormError component */}
        <FormError message={error} />
      </div>
    </div>
  );
};
 
export default Input;