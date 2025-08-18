/**
 * 🏷️ CATEGORY SELECTOR - Enhanced Category Picker
 * New clean architecture component - eliminates duplication
 * Features: Inline creation, Search, Icons, Mobile-first, Accessibility
 * @version 3.0.0 - TRANSACTION REDESIGN
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Search, Plus, Check, AlertCircle, 
  Tag, Palette, X, Sparkles 
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

// ✅ Import category hook
import { useCategory } from '../../../../hooks/useCategory';

import { Button } from '../../../ui';
import { cn } from '../../../../utils/helpers';
import { getIconComponent } from '../../../../config/categoryIcons';

/**
 * 🏷️ Category Selector Component
 */
const CategorySelector = ({
  value = '',
  onChange,
  transactionType = 'expense',
  error = null,
  required = false,
  disabled = false,
  placeholder,
  className = ''
}) => {
  const { t, currentLanguage } = useTranslation('transactions');
  const { categories, createCategory, isLoading } = useCategory();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // ✅ Filter categories by transaction type and search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    
    const detectLanguage = (name) => /[\u0590-\u05FF]/.test(name) ? 'he' : 'en';

    let filtered = categories.filter(category => {
      // Filter by transaction type if category has type preference
      if (category.type && category.type !== transactionType) return false;
      // Language-specific: prefer categories matching UI language
      const lang = category.language || detectLanguage(category.name || '');
      if (lang !== currentLanguage) return false;
      
      // Filter by search query
      if (searchQuery) {
        const name = category.localized_name?.[currentLanguage] || category.name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      return true;
    });

    return filtered.map(cat => ({
      ...cat,
      displayName: cat.localized_name?.[currentLanguage] || cat.name
    }));
  }, [categories, transactionType, searchQuery, currentLanguage]);

  // ✅ Selected category
  const selectedCategory = useMemo(() => {
    return categories?.find(cat => cat.id === value);
  }, [categories, value]);

  // ✅ Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ✅ Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    console.log('🏷️ CategorySelector: Category selected:', { categoryId, transactionType });
    onChange?.(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange, transactionType]);

  // ✅ Handle create new category
  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        type: transactionType
      });

      onChange?.(newCategory.id);
      setShowCreateForm(false);
      setIsOpen(false);
      setNewCategoryName('');
      setNewCategoryIcon('Tag');
      setNewCategoryColor('#3B82F6');
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  }, [newCategoryName, newCategoryIcon, newCategoryColor, transactionType, createCategory, onChange]);

  // ✅ Available colors for new categories
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  // ✅ Available icons for new categories
  const iconOptions = [
    'Tag', 'Home', 'Car', 'Coffee', 'Gift', 'Heart',
    'Music', 'Book', 'Gamepad2', 'Palette', 'Plane', 'Smartphone'
  ];

  return (
    <div className={cn("space-y-2 relative", className)} ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.category.label')}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 md:py-5 text-left min-h-[70px] md:min-h-[80px]",
          "border-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md",
          "bg-white dark:bg-gray-800",
          "text-gray-900 dark:text-white",
          
          // Focus/active styles
          isOpen && "ring-2 ring-blue-500 ring-opacity-50 border-blue-500",
          
          // Error styles
          error ? [
            "border-red-300 dark:border-red-600",
            "bg-red-50 dark:bg-red-900/10"
          ] : [
            "border-gray-300 dark:border-gray-600",
            "hover:border-gray-400 dark:hover:border-gray-500"
          ],
          
          // Disabled styles
          disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
        )}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedCategory ? (
            <>
              {/* Category Icon */}
              <div 
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ backgroundColor: selectedCategory.color }}
              >
                {React.createElement(
                  getIconComponent(selectedCategory.icon),
                  { className: "w-6 h-6 md:w-7 md:h-7 text-white" }
                )}
              </div>
              
              {/* Enhanced Category Name */}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-lg md:text-xl truncate block">
                  {selectedCategory.localized_name?.[currentLanguage] || selectedCategory.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedCategory.type === 'income' ? t('types.income') : t('types.expense')}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Enhanced Placeholder Icon */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Tag className="w-6 h-6 md:w-7 md:h-7 text-gray-400" />
              </div>
              
              {/* Enhanced Placeholder Text */}
              <div className="flex-1 min-w-0">
                <span className="text-gray-500 dark:text-gray-400 truncate text-lg md:text-xl font-medium block">
                  {placeholder || t('fields.category.placeholder')}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {t('fields.category.helper', { fallback: 'Choose a category from the list or create a new one' })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Dropdown Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown - Mobile Optimized */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden",
                // Mobile: Full screen modal
                "fixed inset-x-4 top-20 bottom-20 sm:relative sm:inset-auto sm:top-auto sm:bottom-auto",
                // Desktop: Dropdown anchored to field
                "sm:absolute sm:left-0 sm:right-auto sm:w-full sm:mt-1 sm:max-h-80"
              )}
            >
            {!showCreateForm ? (
              <>
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 sm:hidden">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('fields.category.label')}</h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('fields.category.search')}
                      className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Categories List */}
                <div className="flex-1 overflow-y-auto sm:max-h-48">
                  {filteredCategories.length > 0 ? (
                    <div className="p-2">
                      {filteredCategories.map((category) => {
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategorySelect(category.id)}
                            className={cn(
                              "w-full flex items-center space-x-3 px-3 py-4 sm:py-2 rounded-lg transition-colors text-left",
                              "hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
                              "touch-manipulation min-h-[60px] sm:min-h-auto",
                              value === category.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            )}
                          >
                            <div 
                              className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            >
                              {React.createElement(getIconComponent(category.icon), { className: "w-5 h-5 sm:w-4 sm:h-4 text-white" })}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate text-base sm:text-sm">
                                {category.displayName || category.name}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 block sm:hidden">
                                {category.type === 'income' ? t('types.income') : t('types.expense')}
                              </span>
                            </div>
                            
                            {value === category.id && (
                              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? t('fields.category.noResults') : t('fields.category.empty')}
                    </div>
                  )}
                </div>

                {/* Create New Button - Mobile Optimized */}
                <div className="p-3 sm:p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-4 sm:py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors touch-manipulation min-h-[56px] sm:min-h-auto"
                  >
                    <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="font-medium text-base sm:text-sm">
                      {t('fields.category.createNew')}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              /* Create Category Form */
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {t('fields.category.newCategory')}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Category Name */}
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('fields.category.namePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fields.category.color')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={cn(
                          "w-8 h-8 rounded-lg border-2 transition-all",
                          newCategoryColor === color 
                            ? "border-gray-900 dark:border-white scale-110" 
                            : "border-gray-300 dark:border-gray-600 hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('fields.category.icon')}
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {iconOptions.map((iconName) => {
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setNewCategoryIcon(iconName)}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all",
                            newCategoryIcon === iconName 
                              ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-700" 
                              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}
                        >
                          {React.createElement(getIconComponent(iconName), { className: "w-5 h-5 text-gray-600 dark:text-gray-400" })}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? t('actions.creating') : t('actions.create')}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.p>
      )}
    </div>
  );
};

export default CategorySelector; 