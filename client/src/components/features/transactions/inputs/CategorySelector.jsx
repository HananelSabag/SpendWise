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
  const { t } = useTranslation('transactions');
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
    
    let filtered = categories.filter(category => {
      // Filter by transaction type if category has type preference
      if (category.type && category.type !== transactionType) return false;
      
      // Filter by search query
      if (searchQuery) {
        return category.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      
      return true;
    });

    return filtered;
  }, [categories, transactionType, searchQuery]);

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
    onChange?.(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

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
    <div className={cn("space-y-2", className)} ref={dropdownRef}>
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
          "w-full flex items-center justify-between px-4 py-3 text-left",
          "border rounded-lg transition-all duration-200",
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
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: selectedCategory.color }}
              >
                {React.createElement(
                  getIconComponent(selectedCategory.icon),
                  { className: "w-4 h-4 text-white" }
                )}
              </div>
              
              {/* Category Name */}
              <span className="font-medium truncate">
                {selectedCategory.name}
              </span>
            </>
          ) : (
            <>
              {/* Placeholder Icon */}
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-gray-400" />
              </div>
              
              {/* Placeholder Text */}
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {placeholder || t('fields.category.placeholder')}
              </span>
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

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden"
          >
            {!showCreateForm ? (
              <>
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Categories List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCategories.length > 0 ? (
                    <div className="p-2">
                      {filteredCategories.map((category) => {
                        const CategoryIcon = getIconComponent(category.icon);
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id)}
                            className={cn(
                              "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                              "hover:bg-gray-100 dark:hover:bg-gray-700",
                              value === category.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            )}
                          >
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            >
                              <CategoryIcon className="w-4 h-4 text-white" />
                            </div>
                            
                            <span className="font-medium truncate">
                              {category.name}
                            </span>
                            
                            {value === category.id && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto flex-shrink-0" />
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

                {/* Create New Button */}
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">
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
                      const IconComponent = getIconComponent(iconName);
                      return (
                        <button
                          key={iconName}
                          onClick={() => setNewCategoryIcon(iconName)}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all",
                            newCategoryIcon === iconName 
                              ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-700" 
                              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}
                        >
                          <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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