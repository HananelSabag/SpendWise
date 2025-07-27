/**
 * 📂 CATEGORIES STEP - MOBILE-FIRST REVOLUTION!
 * Beautiful category selection with mobile-optimized design
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, X, Search, Filter, Grid, List,
  ShoppingCart, Home, Car, Coffee, Gamepad2,
  Briefcase, Heart, Plane, Book, Music,
  DollarSign, TrendingUp, Award, Gift
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores
import { useTranslation, useTheme } from '../../../../stores';

import { Button, Input, Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📂 CategoriesStep - MOBILE-FIRST PERFECTION!
 */
const CategoriesStep = ({ 
  data = {}, 
  onDataUpdate, 
  onNext, 
  onBack 
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { isDark } = useTheme();

  // Enhanced state management
  const [selectedCategories, setSelectedCategories] = useState(data.selected || []);
  const [customCategories, setCustomCategories] = useState(data.custom || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('expense');
  const [viewMode, setViewMode] = useState('grid');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    description: '',
    icon: 'ShoppingCart',
    type: 'expense'
  });

  // Default categories with enhanced data
  const defaultCategories = {
    expense: [
      { id: 'food', name: 'Food & Dining', icon: Coffee, color: 'bg-orange-500', popular: true },
      { id: 'transport', name: 'Transportation', icon: Car, color: 'bg-blue-500', popular: true },
      { id: 'shopping', name: 'Shopping', icon: ShoppingCart, color: 'bg-purple-500', popular: true },
      { id: 'home', name: 'Home & Garden', icon: Home, color: 'bg-green-500', popular: true },
      { id: 'entertainment', name: 'Entertainment', icon: Gamepad2, color: 'bg-red-500', popular: false },
      { id: 'health', name: 'Health & Fitness', icon: Heart, color: 'bg-pink-500', popular: false },
      { id: 'travel', name: 'Travel', icon: Plane, color: 'bg-indigo-500', popular: false },
      { id: 'education', name: 'Education', icon: Book, color: 'bg-yellow-500', popular: false },
      { id: 'music', name: 'Music & Media', icon: Music, color: 'bg-teal-500', popular: false }
    ],
    income: [
      { id: 'salary', name: 'Salary', icon: Briefcase, color: 'bg-green-600', popular: true },
      { id: 'freelance', name: 'Freelance', icon: DollarSign, color: 'bg-blue-600', popular: true },
      { id: 'investments', name: 'Investments', icon: TrendingUp, color: 'bg-purple-600', popular: true },
      { id: 'bonus', name: 'Bonus', icon: Award, color: 'bg-orange-600', popular: false },
      { id: 'gifts', name: 'Gifts', icon: Gift, color: 'bg-pink-600', popular: false }
    ]
  };

  // Available icons for custom categories
  const availableIcons = [
    { name: 'ShoppingCart', icon: ShoppingCart },
    { name: 'Coffee', icon: Coffee },
    { name: 'Car', icon: Car },
    { name: 'Home', icon: Home },
    { name: 'Heart', icon: Heart },
    { name: 'Plane', icon: Plane },
    { name: 'Book', icon: Book },
    { name: 'Music', icon: Music },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'DollarSign', icon: DollarSign },
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'Award', icon: Award }
  ];

  // Filter categories based on search and tab
  const filteredCategories = React.useMemo(() => {
    const categories = [...defaultCategories[activeTab], ...customCategories.filter(c => c.type === activeTab)];
    
    if (!searchQuery) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, searchQuery, customCategories]);

  // Handle category selection
  const handleCategoryToggle = (categoryId) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newSelected);
    onDataUpdate({ selected: newSelected, custom: customCategories });
  };

  // Handle custom category creation
  const handleCustomCategoryCreate = () => {
    if (!customForm.name.trim()) return;
    
    const newCategory = {
      id: `custom_${Date.now()}`,
      name: customForm.name,
      description: customForm.description,
      icon: availableIcons.find(i => i.name === customForm.icon)?.icon || ShoppingCart,
      color: 'bg-gray-500',
      type: customForm.type,
      isCustom: true
    };
    
    const newCustomCategories = [...customCategories, newCategory];
    setCustomCategories(newCustomCategories);
    setSelectedCategories([...selectedCategories, newCategory.id]);
    
    onDataUpdate({ 
      selected: [...selectedCategories, newCategory.id], 
      custom: newCustomCategories 
    });
    
    // Reset form
    setCustomForm({ name: '', description: '', icon: 'ShoppingCart', type: 'expense' });
    setShowCustomForm(false);
  };

  // Check if we have minimum required categories
  const hasMinimumCategories = selectedCategories.length >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full flex flex-col"
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
          {t('categories.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          {t('categories.subtitle')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('categories.description')}
        </p>
      </div>

      {/* Search and controls */}
      <div className="mb-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            type="text"
            placeholder={t('categories.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full py-3 rounded-xl border-gray-200 dark:border-gray-700",
              isRTL ? "pr-10" : "pl-10"
            )}
          />
        </div>

        {/* Tabs and view controls */}
        <div className="flex items-center justify-between">
          {/* Category type tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { key: 'expense', label: t('categories.tabs.expense') },
              { key: 'income', label: t('categories.tabs.income') }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid'
                  ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list'
                  ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-400"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories grid/list */}
      <div className="flex-1 mb-6">
        <div className={cn(
          "grid gap-3",
          viewMode === 'grid' 
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
            : "grid-cols-1"
        )}>
          {filteredCategories.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            const IconComponent = category.icon;
            
            return (
              <motion.div
                key={category.id}
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryToggle(category.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                  "bg-white dark:bg-gray-800",
                  isSelected
                    ? "border-primary-500 shadow-lg shadow-primary-500/25"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                  viewMode === 'list' && "flex items-center space-x-4"
                )}
              >
                {/* Category icon */}
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  category.color,
                  viewMode === 'list' ? "flex-shrink-0" : "mb-3 mx-auto"
                )}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* Category info */}
                <div className={cn(
                  viewMode === 'list' ? "flex-1" : "text-center"
                )}>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.description}
                    </p>
                  )}
                  {category.popular && (
                    <Badge variant="secondary" className="mt-2">
                      Popular
                    </Badge>
                  )}
                </div>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={cn(
                        "absolute bg-primary-500 rounded-full p-1",
                        "top-2 text-white",
                        isRTL ? "left-2" : "right-2"
                      )}
                    >
                      <Check className="w-3 h-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Add custom category button */}
          <motion.div
            layout
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCustomForm(true)}
            className={cn(
              "p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600",
              "bg-gray-50 dark:bg-gray-800/50 cursor-pointer transition-all",
              "hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20",
              "flex items-center justify-center",
              viewMode === 'list' ? "h-20" : "aspect-square"
            )}
          >
            <div className="text-center">
              <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('categories.customCategories.add')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Selection summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('categories.selectedCount', { count: selectedCategories.length })}
          </p>
          {!hasMinimumCategories && (
            <p className="text-sm text-orange-600 dark:text-orange-400">
              {t('categories.minRequired')}
            </p>
          )}
        </div>
      </div>

      {/* Custom category form modal */}
      <AnimatePresence>
        {showCustomForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowCustomForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('categories.customCategories.title')}
              </h3>

              <div className="space-y-4">
                <Input
                  placeholder={t('categories.customCategories.namePlaceholder')}
                  value={customForm.name}
                  onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
                />

                <Input
                  placeholder={t('categories.customCategories.descriptionPlaceholder')}
                  value={customForm.description}
                  onChange={(e) => setCustomForm(prev => ({ ...prev, description: e.target.value }))}
                />

                <div className="flex space-x-2">
                  <Button
                    variant={customForm.type === 'expense' ? 'primary' : 'outline'}
                    onClick={() => setCustomForm(prev => ({ ...prev, type: 'expense' }))}
                    className="flex-1"
                  >
                    {t('categories.customCategories.typeOptions.expense')}
                  </Button>
                  <Button
                    variant={customForm.type === 'income' ? 'primary' : 'outline'}
                    onClick={() => setCustomForm(prev => ({ ...prev, type: 'income' }))}
                    className="flex-1"
                  >
                    {t('categories.customCategories.typeOptions.income')}
                  </Button>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomForm(false)}
                  >
                    {t('modal.close')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCustomCategoryCreate}
                    disabled={!customForm.name.trim()}
                  >
                    {t('categories.customCategories.add')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoriesStep; 