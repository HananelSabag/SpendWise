/**
 * 📋 CATEGORY GRID - Grid Layout Component
 * Clean grid layout for category display with responsive design
 * Features: Responsive columns, Drag & Drop, Selection, Animations
 * @version 3.0.0 - CATEGORY REDESIGN
 */

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'framer-motion';
import { Grid, AlertCircle, Plus } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import CategoryCard from './CategoryCard';
import { Button, LoadingSpinner } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📋 Category Grid Component
 */
const CategoryGrid = ({
  categories = [],
  analytics = {},
  selectedCategories = new Set(),
  loading = false,
  draggable = false,
  columns = 'auto', // auto, 1, 2, 3, 4, 5, 6
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryDuplicate,
  onCategoryReorder,
  onTogglePin,
  onToggleVisibility,
  onCreateNew,
  emptyState = null,
  className = ''
}) => {
  const { t } = useTranslation('categories');

  // ✅ Responsive grid columns
  const gridCols = useMemo(() => {
    if (columns === 'auto') {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
    return `grid-cols-${columns}`;
  }, [columns]);

  // ✅ Get analytics for category
  const getCategoryAnalytics = useCallback((categoryId) => {
    return analytics[categoryId] || null;
  }, [analytics]);

  // ✅ Handle reorder (if draggable)
  const handleReorder = useCallback((newOrder) => {
    if (draggable && onCategoryReorder) {
      onCategoryReorder(newOrder);
    }
  }, [draggable, onCategoryReorder]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className={cn("grid gap-4", gridCols)}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
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
          <Grid className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('grid.empty.title')}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {t('grid.empty.description')}
        </p>
        
        {onCreateNew && (
          <Button
            onClick={onCreateNew}
            variant="primary"
            className="inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('grid.empty.createFirst')}</span>
          </Button>
        )}
      </div>
    );
  }

  // ✅ Render draggable grid
  if (draggable) {
    return (
      <div className={className}>
        <Reorder.Group
          axis="y"
          values={categories}
          onReorder={handleReorder}
          className={cn("grid gap-4", gridCols)}
        >
          <AnimatePresence mode="popLayout">
            {categories.map((category) => (
              <Reorder.Item
                key={category.id}
                value={category}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="cursor-move"
              >
                <CategoryCard
                  category={category}
                  analytics={getCategoryAnalytics(category.id)}
                  selected={selectedCategories.has(category.id)}
                  draggable={true}
                  viewMode="grid"
                  onSelect={onCategorySelect}
                  onEdit={onCategoryEdit}
                  onDelete={onCategoryDelete}
                  onDuplicate={onCategoryDuplicate}
                  onTogglePin={onTogglePin}
                  onToggleVisibility={onToggleVisibility}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    );
  }

  // ✅ Render static grid
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-4", gridCols, className)}
    >
      <AnimatePresence mode="popLayout">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            variants={itemVariants}
            layout
            custom={index}
          >
            <CategoryCard
              category={category}
              analytics={getCategoryAnalytics(category.id)}
              selected={selectedCategories.has(category.id)}
              draggable={false}
              viewMode="grid"
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
    </motion.div>
  );
};

export default CategoryGrid; 