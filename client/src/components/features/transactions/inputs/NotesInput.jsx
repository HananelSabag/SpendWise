/**
 * 📝 NOTES INPUT - Auto-Expanding Notes Field
 * New clean architecture component - eliminates duplication
 * Features: Auto-expand, Character count, Mobile-first, Accessibility
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, AlertCircle } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { cn } from '../../../../utils/helpers';

/**
 * 📝 Notes Input Component
 */
const NotesInput = ({
  value = '',
  onChange,
  maxLength = 500,
  minRows = 2,
  maxRows = 6,
  disabled = false,
  placeholder,
  showCharCount = true,
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // ✅ Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the number of lines
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const lines = Math.max(minRows, Math.min(maxRows, Math.ceil(textarea.scrollHeight / lineHeight)));
    
    // Set the height based on number of lines
    textarea.style.height = `${lines * lineHeight}px`;
  }, [minRows, maxRows]);

  // ✅ Adjust height when value changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  // ✅ Handle change
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Enforce max length
    if (newValue.length <= maxLength) {
      onChange?.(newValue);
    }
  }, [onChange, maxLength]);

  // ✅ Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // ✅ Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // ✅ Character count color
  const getCharCountColor = useCallback(() => {
    const percentage = (value.length / maxLength) * 100;
    
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    return 'text-gray-500 dark:text-gray-400';
  }, [value.length, maxLength]);

  // ✅ Quick suggestions
  const quickSuggestions = [
    t('notes.suggestions.receipt'),
    t('notes.suggestions.business'),
    t('notes.suggestions.personal'),
    t('notes.suggestions.gift'),
    t('notes.suggestions.emergency')
  ];

  // ✅ Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    const currentValue = value.trim();
    const newValue = currentValue ? `${currentValue}. ${suggestion}` : suggestion;
    
    if (newValue.length <= maxLength) {
      onChange?.(newValue);
      textareaRef.current?.focus();
    }
  }, [value, onChange, maxLength]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.notes.label')}
      </label>

      {/* Textarea Container */}
      <div className="relative">
        {/* Icon */}
        <div className={cn(
          "absolute left-3 top-3 pointer-events-none transition-colors",
          isFocused ? "text-blue-500" : "text-gray-400"
        )}>
          <FileText className="w-5 h-5" />
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder || t('fields.notes.placeholder')}
          className={cn(
            "w-full pl-11 pr-4 py-3 border rounded-lg transition-all duration-200 resize-none",
            "bg-white dark:bg-gray-800",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500 dark:placeholder-gray-400",
            
            // Focus styles
            isFocused && "ring-2 ring-blue-500 ring-opacity-50 border-blue-500",
            
            // Default styles
            !isFocused && "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
            
            // Disabled styles
            disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
          )}
          style={{ 
            minHeight: `${minRows * 1.5}rem`,
            maxHeight: `${maxRows * 1.5}rem`
          }}
        />
      </div>

      {/* Quick Suggestions */}
      {!disabled && !value && isFocused && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-2"
        >
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('fields.notes.quickSuggestions')}
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs">
        {/* Helper Text */}
        <span className="text-gray-500 dark:text-gray-400">
          {t('fields.notes.helper')}
        </span>

        {/* Character Count */}
        {showCharCount && (
          <span className={cn("font-medium", getCharCountColor())}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {/* Warning for near limit */}
      {value.length >= maxLength * 0.9 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400"
        >
          <AlertCircle className="w-3 h-3" />
          <span>
            {t('fields.notes.nearLimit', { 
              remaining: maxLength - value.length 
            })}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default NotesInput; 