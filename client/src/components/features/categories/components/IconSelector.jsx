/**
 * 🎨 ICON SELECTOR - Enhanced Icon Picker with AI Suggestions
 * Extracted from massive CategoryManager.jsx for reusability
 * Features: AI suggestions, Category tabs, Search, Mobile-first
 * @version 3.0.0 - EXTRACTED & ENHANCED
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Sparkles, Grid, List } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Input, Button, Card } from '../../../ui';
import { getIconComponent } from '../../../../config/categoryIcons';
import { ICON_CATEGORIES, getIconSuggestions } from '../forms/CategoryHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 🎨 Icon Selector Component
 */
const IconSelector = ({ 
  selectedIcon = 'Tag', 
  onIconSelect, 
  categoryName = '',
  showAISuggestions = true,
  size = 'default', // sm, default, lg
  className = '' 
}) => {
  const { t } = useTranslation('categories');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // ✅ AI-suggested icons based on category name
  const aiSuggestedIcons = useMemo(() => {
    if (!categoryName || !showAISuggestions) return [];
    return getIconSuggestions(categoryName);
  }, [categoryName, showAISuggestions]);

  // ✅ Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    const categoryData = ICON_CATEGORIES.find(cat => cat.id === selectedCategory);
    let icons = categoryData?.icons || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(icon => 
        icon.toLowerCase().includes(query)
      );
    }

    return icons;
  }, [selectedCategory, searchQuery]);

  // ✅ Size configuration
  const sizeConfig = {
    sm: { 
      iconSize: 'w-4 h-4', 
      buttonSize: 'p-2', 
      gridCols: 'grid-cols-6',
      containerSize: 'max-h-48' 
    },
    default: { 
      iconSize: 'w-5 h-5', 
      buttonSize: 'p-3', 
      gridCols: 'grid-cols-8',
      containerSize: 'max-h-64' 
    },
    lg: { 
      iconSize: 'w-6 h-6', 
      buttonSize: 'p-4', 
      gridCols: 'grid-cols-6',
      containerSize: 'max-h-80' 
    }
  }[size];

  // ✅ Handle icon selection
  const handleIconSelect = useCallback((iconName) => {
    onIconSelect?.(iconName);
  }, [onIconSelect]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Suggestions */}
      {aiSuggestedIcons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('iconSelector.aiSuggestions')}
            </span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          
          <div className={cn("grid gap-2", sizeConfig.gridCols)}>
            {aiSuggestedIcons.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              return (
                <motion.button
                  key={`ai-${iconName}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleIconSelect(iconName)}
                  className={cn(
                    "rounded-lg border-2 transition-all relative",
                    sizeConfig.buttonSize,
                    selectedIcon === iconName
                      ? "border-blue-500 bg-blue-100 dark:bg-blue-800 shadow-lg"
                      : "border-blue-300 dark:border-blue-600 hover:border-blue-400 bg-white dark:bg-gray-800"
                  )}
                  title={iconName}
                >
                  <IconComponent className={cn(
                    sizeConfig.iconSize,
                    selectedIcon === iconName
                      ? "text-blue-600 dark:text-blue-300"
                      : "text-blue-500 dark:text-blue-400"
                  )} />
                  
                  {selectedIcon === iconName && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t('iconSelector.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs + View Mode */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {ICON_CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {t(`iconCategories.${category.id}`)}
            </Button>
          ))}
        </div>

        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? "primary" : "ghost"}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="p-1"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? "primary" : "ghost"}
            size="sm"
            onClick={() => setViewMode('list')}
            className="p-1"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Icons Display */}
      <Card className="p-3">
        {filteredIcons.length > 0 ? (
          <div className={cn(
            "overflow-y-auto",
            sizeConfig.containerSize,
            viewMode === 'grid' 
              ? `grid gap-2 ${sizeConfig.gridCols}` 
              : 'space-y-2'
          )}>
            {filteredIcons.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              
              if (viewMode === 'list') {
                return (
                  <motion.button
                    key={iconName}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleIconSelect(iconName)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-lg border transition-all text-left",
                      selectedIcon === iconName
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    <IconComponent className={cn(
                      sizeConfig.iconSize,
                      selectedIcon === iconName
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400"
                    )} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {iconName}
                    </span>
                    {selectedIcon === iconName && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              }

              return (
                <motion.button
                  key={iconName}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleIconSelect(iconName)}
                  className={cn(
                    "rounded-lg border transition-all relative group",
                    sizeConfig.buttonSize,
                    selectedIcon === iconName
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                  title={iconName}
                >
                  <IconComponent className={cn(
                    sizeConfig.iconSize,
                    selectedIcon === iconName
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-blue-500"
                  )} />
                  
                  {selectedIcon === iconName && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery 
                ? t('iconSelector.noResults', { query: searchQuery })
                : t('iconSelector.noIcons')
              }
            </p>
          </div>
        )}
      </Card>

      {/* Selected Icon Display */}
      {selectedIcon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700"
        >
          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
            {React.createElement(getIconComponent(selectedIcon), {
              className: "w-5 h-5 text-green-600 dark:text-green-400"
            })}
          </div>
          <div>
            <div className="text-sm font-medium text-green-900 dark:text-green-100">
              {t('iconSelector.selected')}: {selectedIcon}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">
              {t('iconSelector.selectedDescription')}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IconSelector; 