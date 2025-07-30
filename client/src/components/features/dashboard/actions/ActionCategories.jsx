/**
 * 📋 ACTION CATEGORIES - Category Management Component
 * Extracted from QuickActionsBar.jsx for better performance and maintainability
 * Features: Category tabs, Search functionality, Action filtering, Mobile-first
 * @version 2.0.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, X, Star, Clock, TrendingUp,
  Plus, BarChart3, Target, Globe, Grid, List
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Button, Input, Badge, Dropdown } from '../../../ui';
import { cn } from '../../../../utils/helpers';
import { getIconComponent } from '../../../../config/categoryIcons';

/**
 * 🏷️ Category Tab Button
 */
const CategoryTab = ({ 
  category, 
  isActive = false, 
  count = 0,
  onClick,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(category.id)}
      className={cn(
        "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "bg-blue-500 text-white shadow-md" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
        className
      )}
    >
                  {category.icon && React.createElement(getIconComponent(category.icon), { className: "w-4 h-4" })}
      <span>{category.label}</span>
      {count > 0 && (
        <Badge 
          variant={isActive ? "secondary" : "outline"} 
          size="xs"
          className={isActive ? "bg-white/20 text-white border-white/30" : ""}
        >
          {count}
        </Badge>
      )}
    </motion.button>
  );
};

/**
 * 🔍 Search Bar Component
 */
const ActionSearchBar = ({ 
  value = '', 
  onChange, 
  onClear,
  placeholder,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        placeholder={placeholder || t('quickActions.searchPlaceholder')}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-10 pr-10"
      />
      
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * 🎛️ Filter Controls Component
 */
const FilterControls = ({ 
  filters = {},
  onFiltersChange,
  availableFilters = [],
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  const filterOptions = {
    popular: { label: t('filters.popular'), icon: Star },
    recent: { label: t('filters.recent'), icon: Clock },
    trending: { label: t('filters.trending'), icon: TrendingUp }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Quick filter buttons */}
      <div className="flex items-center space-x-2">
        {availableFilters.map((filterId) => {
          const filter = filterOptions[filterId];
          if (!filter) return null;

          const Icon = filter.icon;
          const isActive = filters[filterId];

          return (
            <Button
              key={filterId}
              variant={isActive ? "primary" : "outline"}
              size="sm"
              onClick={() => onFiltersChange?.({ ...filters, [filterId]: !isActive })}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span>{filter.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Filter dropdown for more options */}
      {activeFiltersCount > 0 && (
        <Badge variant="primary" size="sm">
          {t('filters.active', { count: activeFiltersCount })}
        </Badge>
      )}

      {/* Clear all filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange?.({})}
          className="text-xs"
        >
          {t('filters.clear')}
        </Button>
      )}
    </div>
  );
};

/**
 * 📋 Action Categories Main Component
 */
const ActionCategories = ({
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  searchQuery = '',
  onSearchChange,
  filters = {},
  onFiltersChange,
  actionCounts = {},
  showSearch = true,
  showFilters = true,
  layout = 'tabs', // 'tabs', 'dropdown', 'grid'
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');

  // Default categories if none provided
  const defaultCategories = useMemo(() => [
    { id: 'all', label: t('categories.all'), icon: Grid },
    { id: 'transactions', label: t('categories.transactions'), icon: Plus },
    { id: 'analytics', label: t('categories.analytics'), icon: BarChart3 },
    { id: 'goals', label: t('categories.goals'), icon: Target },
    { id: 'tools', label: t('categories.tools'), icon: Globe }
  ], [t]);

  const activeCategories = categories.length > 0 ? categories : defaultCategories;

  // Available filters
  const availableFilters = ['popular', 'recent', 'trending'];

  // Handle search
  const handleSearchChange = useCallback((value) => {
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleSearchClear = useCallback(() => {
    onSearchChange?.('');
  }, [onSearchChange]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    onCategoryChange?.(categoryId);
  }, [onCategoryChange]);

  // Render category tabs
  const renderTabs = () => (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {activeCategories.map((category) => (
        <CategoryTab
          key={category.id}
          category={category}
          isActive={selectedCategory === category.id}
          count={actionCounts[category.id] || 0}
          onClick={handleCategorySelect}
          className="flex-shrink-0"
        />
      ))}
    </div>
  );

  // Render category dropdown
  const renderDropdown = () => (
    <Dropdown
      trigger={
        <Button variant="outline" className="flex items-center space-x-2">
          <span>
            {activeCategories.find(c => c.id === selectedCategory)?.label || t('categories.select')}
          </span>
          <Badge variant="outline" size="xs">
            {actionCounts[selectedCategory] || 0}
          </Badge>
        </Button>
      }
    >
      <div className="p-2 w-48">
        {activeCategories.map((category) => {
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                selectedCategory === category.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              )}
            >
              {category.icon && React.createElement(getIconComponent(category.icon), { className: "w-4 h-4" })}
              <span className="text-sm">{category.label}</span>
              {actionCounts[category.id] > 0 && (
                <Badge variant="outline" size="xs" className="ml-auto">
                  {actionCounts[category.id]}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </Dropdown>
  );

  // Render category grid
  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {activeCategories.map((category) => (
        <CategoryTab
          key={category.id}
          category={category}
          isActive={selectedCategory === category.id}
          count={actionCounts[category.id] || 0}
          onClick={handleCategorySelect}
          className="justify-center"
        />
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Search and filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        {showSearch && (
          <div className="flex-1">
            <ActionSearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <FilterControls
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableFilters={availableFilters}
          />
        )}
      </div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {layout === 'tabs' && renderTabs()}
        {layout === 'dropdown' && renderDropdown()}
        {layout === 'grid' && renderGrid()}
      </motion.div>

      {/* Active filters display */}
      {Object.keys(filters).some(key => filters[key]) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <Filter className="w-4 h-4" />
          <span>{t('filters.applied')}:</span>
          <div className="flex items-center space-x-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Badge key={key} variant="outline" size="xs">
                  {t(`filters.${key}`)}
                </Badge>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ActionCategories;
export { CategoryTab, ActionSearchBar, FilterControls }; 