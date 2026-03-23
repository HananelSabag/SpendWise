/**
 * 🏷️ CATEGORY MANAGER - MOBILE-FIRST MODAL
 * COMPLETELY REFACTORED for mobile compatibility and RTL support
 * Features: Modal overlay, Mobile-first, RTL support, Clean UI
 * @version 5.0.0 - MOBILE & RTL OPTIMIZED! 🎉
 */

import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, Grid, List,
  BarChart3, Eye, EyeOff
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useNotifications } from '../../../stores';

// ✅ Import our NEW clean components
import CategoryForm from './forms/CategoryForm';
import CategoryGrid from './components/CategoryGrid';
import CategoryList from './components/CategoryList';
import CategoryAnalytics from './analytics/CategoryAnalytics';

// ✅ Import UI components
import { Button, Input, Card, Modal, Dropdown, Badge } from '../../ui';

// ✅ Import hooks
import { useCategory } from '../../../hooks/useCategory';
import { useCategoryAnalytics } from '../../../hooks/useCategoryAnalytics';
import { useCategorySelection } from '../../../hooks/useCategorySelection';

// ✅ Import utilities
import { filterCategoriesByText, sortCategories } from './forms/CategoryHelpers';
import { cn } from '../../../utils/helpers';

/**
 * 🏷️ Category Manager - Clean Orchestrator
 */
const CategoryManager = ({ 
  isOpen = false, 
  onClose = () => {}, 
  className = '' 
}) => {
  const { t, isRTL } = useTranslation('categories');
  const { addNotification } = useNotifications();

  // ✅ View and UI state
  const [viewMode, setViewMode] = useState('grid'); // grid, list, analytics
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // ✅ Data hooks
  const {
    categories,
    analytics,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    togglePin,
    toggleVisibility
  } = useCategory();

  const { analytics: categoryAnalytics } = useCategoryAnalytics();

  // ✅ Selection hook
  const {
    selectedCategories,
    selectionStats,
    toggleCategory,
    clearSelection,
    selectByCriteria
  } = useCategorySelection(categories);

  // ✅ Filtered and sorted categories
  const processedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) {
      return [];
    }
    
    let filtered = categories;
    
    // Filter by search
    if (searchQuery) {
      filtered = filterCategoriesByText(filtered, searchQuery);
    }
    
    // Filter by visibility
    if (!showHidden) {
      filtered = filtered.filter(cat => !cat.isHidden);
    }
    
    // Sort
    return sortCategories(filtered, sortBy, sortOrder);
  }, [categories, searchQuery, showHidden, sortBy, sortOrder]);

  // ✅ View mode options
  const viewModeOptions = [
    { value: 'grid', label: t('viewModes.grid'), icon: Grid },
    { value: 'list', label: t('viewModes.list'), icon: List },
    { value: 'analytics', label: t('viewModes.analytics'), icon: BarChart3 }
  ];

  // ✅ Sort options
  const sortOptions = [
    { value: 'name', label: t('sort.name') },
    { value: 'type', label: t('sort.type') },
    { value: 'usage', label: t('sort.usage') },
    { value: 'created', label: t('sort.created') }
  ];

  // ✅ Handle category actions
  const handleCreateCategory = async (categoryData) => {
    try {
      await createCategory(categoryData);
      setShowCreateModal(false);
      addNotification({
        type: 'success',
        message: t('notifications.createSuccess'),
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (categoryData) => {
    if (!editingCategory) return;
    
    try {
      await updateCategory(editingCategory.id, categoryData);
      setShowEditModal(false);
      setEditingCategory(null);
      addNotification({
        type: 'success',
        message: t('notifications.updateSuccess'),
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(
      t('confirmations.delete', { name: category.name })
    );
    
    if (confirmed) {
      try {
        await deleteCategory(category.id);
        addNotification({
          type: 'success',
          message: t('notifications.deleteSuccess'),
          duration: 3000
        });
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleDuplicateCategory = (category) => {
    setEditingCategory({ ...category, name: `Copy of ${category.name}` });
    setShowCreateModal(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('title')}
        sheet
        drawerWidth={780}
      >
        <div className={cn('p-4 space-y-4', className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
          {/* Quick Actions */}
          <div className="flex items-center justify-end">
            <Button onClick={() => setShowCreateModal(true)} variant="primary" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>{t('actions.create')}</span>
            </Button>
          </div>

          {/* Controls */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400', isRTL ? 'right-3' : 'left-3')} />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn('w-full', isRTL ? 'pr-10' : 'pl-10')}
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Dropdown
                  trigger={
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('sort.label')}</span>
                    </Button>
                  }
                  items={sortOptions.map(option => ({
                    label: option.label,
                    onClick: () => setSortBy(option.value),
                    selected: sortBy === option.value,
                  }))}
                />
                <Button
                  variant={showHidden ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowHidden(!showHidden)}
                  className="flex items-center space-x-2"
                >
                  {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{t('filters.showHidden')}</span>
                </Button>
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-auto">
                  {viewModeOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={viewMode === option.value ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode(option.value)}
                      className="flex items-center space-x-1"
                    >
                      <option.icon className="w-4 h-4" />
                      <span className="hidden md:inline text-xs">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selection Summary */}
            {selectionStats.hasSelection && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="primary">{t('selection.count', { count: selectionStats.count })}</Badge>
                    <span className="text-sm text-blue-900 dark:text-blue-100">{t('selection.summary')}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="text-blue-600 hover:text-blue-700">
                    {t('selection.clear')}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Categories Content */}
          <div className="min-h-[300px]">
            {viewMode === 'grid' && (
              <CategoryGrid
                categories={processedCategories}
                analytics={analytics?.categories || {}}
                selectedCategories={new Set(selectedCategories.map(cat => cat.id))}
                loading={isLoading}
                onCategorySelect={toggleCategory}
                onCategoryEdit={handleEditCategory}
                onCategoryDelete={handleDeleteCategory}
                onCategoryDuplicate={handleDuplicateCategory}
                onTogglePin={togglePin}
                onToggleVisibility={toggleVisibility}
              />
            )}
            {viewMode === 'list' && (
              <CategoryList
                categories={processedCategories}
                analytics={analytics?.categories || {}}
                selectedCategories={new Set(selectedCategories.map(cat => cat.id))}
                loading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onCategorySelect={toggleCategory}
                onCategoryEdit={handleEditCategory}
                onCategoryDelete={handleDeleteCategory}
                onCategoryDuplicate={handleDuplicateCategory}
                onTogglePin={togglePin}
                onToggleVisibility={toggleVisibility}
                onCreateNew={() => setShowCreateModal(true)}
              />
            )}
            {viewMode === 'analytics' && (
              <CategoryAnalytics categories={processedCategories} analytics={categoryAnalytics} />
            )}
          </div>
        </div>
      </Modal>

      {/* Inner modals — rendered outside main Modal to avoid z-index nesting */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('form.addCategory')}
        sheet
        drawerWidth={640}
        size="4xl"
      >
        <CategoryForm
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCategory}
          mode="create"
        />
      </Modal>

      <Modal
        isOpen={showEditModal && !!editingCategory}
        onClose={() => { setShowEditModal(false); setEditingCategory(null); }}
        title={t('form.editCategory')}
        sheet
        drawerWidth={640}
        size="4xl"
      >
        <CategoryForm
          onClose={() => { setShowEditModal(false); setEditingCategory(null); }}
          onSubmit={handleUpdateCategory}
          mode="edit"
          initialData={editingCategory}
        />
      </Modal>
    </>
  );
};

export default CategoryManager;