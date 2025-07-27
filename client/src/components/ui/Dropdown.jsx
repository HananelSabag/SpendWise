/**
 * 📋 DROPDOWN COMPONENT - Mobile-First Advanced Dropdown Menu
 * Features: Zustand stores, Touch-optimized, Multiple variants, RTL support
 * @version 2.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation } from '../../stores';

import { cn } from '../../utils/helpers';

const Dropdown = ({
  options = [],
  value,
  onChange,
  placeholder,
  disabled = false,
  searchable = false,
  multiple = false,
  clearable = false,
  className = '',
  size = 'md',
  variant = 'default',
  icon,
  error,
  label,
  fullWidth = false,
  maxHeight = '256px',
  onOpen,
  onClose,
  ...props
}) => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // ✅ Size configurations
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  // ✅ Variant configurations
  const variants = {
    default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700',
    outline: 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700',
    filled: 'border-transparent bg-gray-100 dark:bg-gray-700',
    ghost: 'border-transparent bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
  };

  // ✅ Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        (typeof option === 'string' ? option : option.label)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : options;

  // ✅ Get display value
  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder || t('common.selectOption', { fallback: 'Select option...' });
      if (value.length === 1) {
        const option = options.find(opt => 
          (typeof opt === 'string' ? opt : opt.value) === value[0]
        );
        return typeof option === 'string' ? option : option?.label || value[0];
      }
      return t('common.selectedItems', { count: value.length, fallback: `${value.length} selected` });
    }

    if (!value) return placeholder || t('common.selectOption', { fallback: 'Select option...' });
    
    const option = options.find(opt => 
      (typeof opt === 'string' ? opt : opt.value) === value
    );
    return typeof option === 'string' ? option : option?.label || value;
  };

  // ✅ Handle option selection
  const handleOptionSelect = (option) => {
    const optionValue = typeof option === 'string' ? option : option.value;
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(optionValue);
      
      const newValues = isSelected
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
        
      onChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
    
    setHighlightedIndex(-1);
  };

  // ✅ Handle clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : null);
    setSearchQuery('');
  };

  // ✅ Toggle dropdown
  const toggleDropdown = () => {
    if (disabled) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      onOpen?.();
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    } else {
      onClose?.();
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  // ✅ Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          toggleDropdown();
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
        
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  // ✅ Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // ✅ Check if option is selected
  const isOptionSelected = (option) => {
    const optionValue = typeof option === 'string' ? option : option.value;
    
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    
    return value === optionValue;
  };

  return (
    <div 
      className={cn(
        'relative',
        fullWidth ? 'w-full' : 'w-auto',
        className
      )}
      ref={dropdownRef}
    >
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'relative w-full flex items-center justify-between rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200',
          'text-left cursor-pointer select-none',
          // Touch optimization
          'min-h-[44px] touch-manipulation',
          // Sizes
          sizes[size],
          // Variants
          variants[variant],
          // States
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500 dark:border-red-400',
          isOpen && 'ring-2 ring-primary-500 border-primary-500',
          // RTL support
          isRTL && 'text-right'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <span className={cn(
            'flex-shrink-0',
            isRTL ? 'ml-2' : 'mr-2'
          )}>
            {React.isValidElement(icon) ? React.cloneElement(icon, {
              className: cn(
                size === 'sm' ? 'w-4 h-4' : 
                size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
                'text-gray-400'
              )
            }) : icon}
          </span>
        )}

        {/* Display value */}
        <span className={cn(
          'flex-1 truncate',
          !value && 'text-gray-500 dark:text-gray-400'
        )}>
          {getDisplayValue()}
        </span>

        {/* Actions */}
        <div className={cn(
          'flex items-center',
          isRTL ? 'mr-2' : 'ml-2'
        )}>
          {/* Clear button */}
          {clearable && value && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              aria-label={t('common.clear', { fallback: 'Clear' })}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Dropdown arrow */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex-shrink-0',
              clearable && value ? (isRTL ? 'mr-1' : 'ml-1') : ''
            )}
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden',
              'max-h-64 overflow-y-auto',
              // Mobile optimization
              'touch-manipulation'
            )}
            style={{ maxHeight }}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('common.search', { fallback: 'Search...' })}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(-1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {searchQuery 
                    ? t('common.noResults', { fallback: 'No results found' })
                    : t('common.noOptions', { fallback: 'No options available' })
                  }
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = isOptionSelected(option);
                  const isHighlighted = index === highlightedIndex;
                  const optionLabel = typeof option === 'string' ? option : option.label;
                  const optionValue = typeof option === 'string' ? option : option.value;
                  const optionIcon = typeof option === 'object' ? option.icon : null;
                  const optionDisabled = typeof option === 'object' ? option.disabled : false;

                  return (
                    <motion.button
                      key={optionValue}
                      onClick={() => !optionDisabled && handleOptionSelect(option)}
                      className={cn(
                        'w-full flex items-center px-4 py-3 text-sm text-left transition-colors duration-150',
                        'min-h-[44px] touch-manipulation', // Mobile optimization
                        // States
                        isHighlighted && 'bg-gray-100 dark:bg-gray-700',
                        isSelected && 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
                        optionDisabled && 'opacity-50 cursor-not-allowed',
                        !optionDisabled && !isSelected && 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                        // RTL support
                        isRTL && 'text-right flex-row-reverse'
                      )}
                      disabled={optionDisabled}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {/* Option icon */}
                      {optionIcon && (
                        <span className={cn(
                          'flex-shrink-0',
                          isRTL ? 'ml-3' : 'mr-3'
                        )}>
                          {React.isValidElement(optionIcon) ? React.cloneElement(optionIcon, {
                            className: 'w-4 h-4'
                          }) : optionIcon}
                        </span>
                      )}

                      {/* Option label */}
                      <span className="flex-1 truncate">
                        {optionLabel}
                      </span>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            'flex-shrink-0',
                            isRTL ? 'mr-2' : 'ml-2'
                          )}
                        >
                          <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;