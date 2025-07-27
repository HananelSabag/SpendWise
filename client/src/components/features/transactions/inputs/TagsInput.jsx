/**
 * 🏷️ TAGS INPUT - Enhanced Tag Management
 * New clean architecture component - eliminates duplication
 * Features: Tag suggestions, Auto-complete, Mobile-first, Accessibility
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Plus, Hash, Sparkles } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { cn } from '../../../../utils/helpers';

/**
 * 🏷️ Tags Input Component
 */
const TagsInput = ({
  value = [],
  onChange,
  suggestions = [],
  maxTags = 10,
  disabled = false,
  placeholder,
  className = ''
}) => {
  const { t } = useTranslation('transactions');
  
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // ✅ Common tag suggestions
  const commonTags = useMemo(() => [
    'food', 'transport', 'shopping', 'bills', 'entertainment',
    'health', 'education', 'work', 'travel', 'family',
    'investment', 'emergency', 'gift', 'subscription', 'maintenance'
  ], []);

  // ✅ Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return commonTags.slice(0, 6);
    
    const query = inputValue.toLowerCase().trim();
    const allSuggestions = [...suggestions, ...commonTags];
    
    // Filter out already selected tags and match query
    const filtered = allSuggestions.filter(tag => 
      !value.includes(tag) && 
      tag.toLowerCase().includes(query)
    );
    
    return filtered.slice(0, 8);
  }, [inputValue, suggestions, commonTags, value]);

  // ✅ Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Add tag
  const addTag = useCallback((tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (!trimmedTag || value.includes(trimmedTag) || value.length >= maxTags) {
      return;
    }
    
    onChange?.([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  }, [value, onChange, maxTags]);

  // ✅ Remove tag
  const removeTag = useCallback((tagToRemove) => {
    onChange?.(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  // ✅ Handle input key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag if input is empty
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsInputFocused(false);
      inputRef.current?.blur();
    }
  }, [inputValue, addTag, removeTag, value]);

  // ✅ Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    setShowSuggestions(true);
  }, []);

  // ✅ Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    addTag(suggestion);
    inputRef.current?.focus();
  }, [addTag]);

  // ✅ Tag color generator
  const getTagColor = useCallback((tag) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    ];
    
    // Generate consistent color based on tag
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, []);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.tags.label')}
      </label>

      {/* Tags Container */}
      <div className={cn(
        "min-h-[48px] p-3 border rounded-lg transition-all duration-200",
        "bg-white dark:bg-gray-800",
        
        // Focus styles
        isInputFocused && "ring-2 ring-blue-500 ring-opacity-50 border-blue-500",
        
        // Default styles
        !isInputFocused && "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
        
        // Disabled styles
        disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
      )}>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Existing Tags */}
          <AnimatePresence>
            {value.map((tag, index) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                  getTagColor(tag)
                )}
              >
                <Hash className="w-3 h-3" />
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Input */}
          {!disabled && value.length < maxTags && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={handleInputFocus}
              placeholder={value.length === 0 ? (placeholder || t('fields.tags.placeholder')) : ''}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          )}

          {/* Add Icon */}
          {!disabled && value.length < maxTags && (
            <div className="text-gray-400">
              <Tag className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && !disabled && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 mb-1">
                {inputValue.trim() ? t('fields.tags.suggestions') : t('fields.tags.popular')}
              </div>
              
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-medium">
                    {suggestion}
                  </span>
                  <Plus className="w-3 h-3 text-gray-400 ml-auto" />
                </button>
              ))}
              
              {/* Add custom tag option */}
              {inputValue.trim() && !filteredSuggestions.includes(inputValue.toLowerCase().trim()) && (
                <button
                  onClick={() => addTag(inputValue)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 mt-1 pt-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {t('fields.tags.addCustom', { tag: inputValue.trim() })}
                  </span>
                  <Plus className="w-3 h-3 text-blue-500 ml-auto" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {t('fields.tags.helper')}
        </span>
        <span>
          {value.length}/{maxTags}
        </span>
      </div>
    </div>
  );
};

export default TagsInput; 