/**
 * 📃 CATEGORY LIST - List Layout Component
 * Clean list layout for category display with sorting and grouping
 * Features: Grouping, Sorting, Virtual scrolling, Bulk selection
 * @version 3.0.0 - CATEGORY REDESIGN
 */

import React, { useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  List, ChevronDown, ChevronRight, SortAsc, SortDesc,
  Plus, AlertCircle, CheckSquare, Square
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import CategoryCard from './CategoryCard';
import { Button, Checkbox, Badge } from '../../../ui';
import { sortCategories } from '../forms/CategoryHelpers';
import { cn } from '../../../../utils/helpers';

/**
 * 📃 Category List Component
 */
const CategoryList = ({
  categories = [],
  analytics = {},
  selectedCategories = new Set(),
  loading = false,
  groupBy = null, // null, 'type', 'pinned'
  sortBy = 'name',
  sortOrder = 'asc',
  showBulkActions = false,
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryDuplicate,
  onTogglePin,
  onToggleVisibility,
  onBulkSelect,
  onCreateNew,
  emptyState = null,
  className = ''
}) => {
  const { t } = useTranslation('categories');
  
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // ✅ Process and group categories
  const processedCategories = useMemo(() => {
    // Sort categories
    const sorted = sortCategories(categories, sortBy, sortOrder);
    
    // Group if specified
    if (!groupBy) {
      return [{ 
        key: 'all', 
        label: t('groups.all'), 
        categories: sorted,
        count: sorted.length
      }];
    }

    const groups = {};
    
    sorted.forEach(category => {
      let groupKey;
      let groupLabel;
      
      switch (groupBy) {
        case 'type':
          groupKey = category.type;
          groupLabel = t(`types.${category.type}`);
          break;
        case 'pinned':
          groupKey = category.isPinned ? 'pinned' : 'unpinned';
          groupLabel = category.isPinned ? t('groups.pinned') : t('groups.unpinned');
          break;
        default:
          groupKey = 'all';
          groupLabel = t('groups.all');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: groupLabel,
          categories: [],
          count: 0
        };
      }
      
      groups[groupKey].categories.push(category);
      groups[groupKey].count++;
    });

    return Object.values(groups);
  }, [categories, groupBy, sortBy, sortOrder, t]);

  // ✅ Get analytics for category
  const getCategoryAnalytics = useCallback((categoryId) => {
    return analytics[categoryId] || null;
  }, [analytics]);

  // ✅ Toggle group collapse
  const toggleGroup = useCallback((groupKey) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // ✅ Select all in group
  const selectAllInGroup = useCallback((groupCategories) => {
    const categoryIds = groupCategories.map(cat => cat.id);
    const allSelected = categoryIds.every(id => selectedCategories.has(id));
    
    if (allSelected) {
      // Deselect all in group
      categoryIds.forEach(id => onCategorySelect?.(id, false));
    } else {
      // Select all in group
      categoryIds.forEach(id => onCategorySelect?.(id, true));
    }
  }, [selectedCategories, onCategorySelect]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2 }
    }
  };

  const groupVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.3, delay: 0.1 }
      }
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // ✅ Empty state
  if (categories.length === 0) {
    if (emptyState) {
      return <div className={className}>{emptyState}</div>;
    }

    return (
      <div className={cn("text-center py-12", className)}>
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <List className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('list.empty.title')}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {t('list.empty.description')}
        </p>
        
        {onCreateNew && (
          <Button
            onClick={onCreateNew}
            variant="primary"
            className="inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('list.empty.createFirst')}</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
    >
      {processedCategories.map((group) => {
        const isCollapsed = collapsedGroups.has(group.key);
        const groupSelectedCount = group.categories.filter(cat => 
          selectedCategories.has(cat.id)
        ).length;
        const allGroupSelected = groupSelectedCount === group.categories.length;
        const someGroupSelected = groupSelectedCount > 0 && !allGroupSelected;

        return (
          <motion.div
            key={group.key}
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {/* Group Header */}
            {groupBy && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {/* Collapse Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.key)}
                    className="p-1"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Group Selection */}
                  {showBulkActions && (
                    <div className="relative">
                      <Checkbox
                        checked={allGroupSelected}
                        indeterminate={someGroupSelected}
                        onCheckedChange={() => selectAllInGroup(group.categories)}
                      />
                    </div>
                  )}

                  {/* Group Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {group.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('list.groupCount', { 
                        count: group.count,
                        selected: groupSelectedCount 
                      })}
                    </p>
                  </div>
                </div>

                {/* Group Badge */}
                <Badge variant="outline">
                  {group.count}
                </Badge>
              </div>
            )}

            {/* Group Content */}
            <motion.div
              variants={groupVariants}
              animate={isCollapsed ? 'collapsed' : 'expanded'}
              style={{ overflow: 'hidden' }}
            >
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence mode="popLayout">
                  {group.categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      variants={itemVariants}
                      layout
                      custom={index}
                      className="px-4 py-2"
                    >
                      <CategoryCard
                        category={category}
                        analytics={getCategoryAnalytics(category.id)}
                        selected={selectedCategories.has(category.id)}
                        viewMode="list"
                        onSelect={onCategorySelect}
                        onEdit={onCategoryEdit}
                        onDelete={onCategoryDelete}
                        onDuplicate={onCategoryDuplicate}
                        onTogglePin={onTogglePin}
                        onToggleVisibility={onToggleVisibility}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default CategoryList; 