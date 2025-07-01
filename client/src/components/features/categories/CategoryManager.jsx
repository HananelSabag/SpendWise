/**
 * CategoryManager Component
 * Full CRUD interface for managing categories with premium UI/UX
 * Features: Category creation, editing, deletion, search, and filtering
 * Mobile-optimized with responsive design
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Save, X, Star, Tag, Package,
  TrendingUp, TrendingDown, Crown, Search, Filter,
  MoreVertical, Grid, List
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCategories } from '../../../hooks/useCategory';
import { Card, Button, Input, Badge, Modal, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';
import { useToast } from '../../../hooks/useToast';

import {
  iconCategories,
  getIconComponent,
  getGradientForCategory,
  categoryConfig
} from '../../../config/categoryIcons';

/**
 * Category Manager Component
 * Provides comprehensive category management with search, filtering, and CRUD operations
 * Fully responsive with mobile-first design
 * ✅ UPDATED: Now works as a modal component
 */
const CategoryManager = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const toastService = useToast();
  const {
    categories: allCategories = [],
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    refresh
  } = useCategories();
  
  const isRTL = language === 'he';
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'tag',
    type: 'expense'
  });
  const [errors, setErrors] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState('general');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(false);

  // ✅ NEW: Handle modal close
  const handleClose = () => {
    setShowForm(false);
    resetForm();
    onClose?.();
  };

  // Process and filter categories
  const processedCategories = React.useMemo(() => {
    if (!Array.isArray(allCategories)) {
      return { user: [], default: [] };
    }
    
    // Remove duplicates by ID
    const uniqueCategories = allCategories.filter((category, index, self) => 
      index === self.findIndex(c => c.id === category.id)
    );
    
    const filtered = uniqueCategories.filter(category => {
      // Type filter
      if (filterType !== 'all' && category.type !== filterType) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const name = category.is_default 
          ? (t(`categories.${category.name}`, category.name) || category.name) 
          : category.name;
        return name.toLowerCase().includes(searchLower) ||
               (category.description || '').toLowerCase().includes(searchLower);
      }
      
      return true;
    });
    
    return {
      user: filtered.filter(cat => !cat.is_default),
      default: filtered.filter(cat => cat.is_default)
    };
  }, [allCategories, filterType, searchTerm, t]);

  const userCategories = processedCategories.user;
  const defaultCategories = processedCategories.default;

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'tag',
      type: 'expense'
    });
    setEditingCategory(null);
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validate
    if (!formData.name.trim()) {
      setErrors({ name: t('categories.nameRequired') });
      return;
    }
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toastService.categoryUpdated();
      } else {
        await createCategory(formData);
        toastService.categoryCreated();
      }
      
      setShowForm(false);
      resetForm();
      
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  // Handle edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'tag',
      type: category.type || 'expense'
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;
    
    try {
      await deleteCategory(categoryId);
      toastService.categoryDeleted();
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  // Handle create new category
  const handleCreateNew = () => {
    resetForm();
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold">{t('nav.categoryManager')}</span>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <Package className="w-4 h-4" />
                <span>
                  {userCategories.length} {t('categories.userCategories')} • {defaultCategories.length} {t('categories.default')}
                </span>
              </div>
            </div>
          </div>
        </div>
      }
      size="large"
      className="max-w-4xl max-h-[90vh] overflow-hidden"
    >
      <div className="space-y-4 sm:space-y-6 p-6">
        {/* Header & Controls - Unified Responsive */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-adaptive-lg font-bold text-gray-900 dark:text-white">
              {t('categories.manager')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="small"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 sm:hidden"
              >
                {viewMode === 'grid' ? <List className="icon-adaptive-sm" /> : <Grid className="icon-adaptive-sm" />}
              </Button>
              <Button
                onClick={handleCreateNew}
                size="small"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                <Plus className="icon-adaptive-sm" />
                <span className="hidden sm:inline ml-2">{t('categories.addCategory')}</span>
              </Button>
            </div>
          </div>

          {/* Search and Filter Controls - Unified */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 icon-adaptive-sm text-gray-400" />
              <Input
                placeholder={t('categories.searchCategories')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-12 sm:pr-4"
              />
              <Button
                variant="ghost"
                size="small"
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 sm:hidden"
              >
                <Filter className="icon-adaptive-sm" />
              </Button>
            </div>

            {/* Type Filter */}
            <div className="mobile-stack sm:flex gap-2">
              {['all', 'expense', 'income'].map(type => (
                <Button
                  key={type}
                  variant={filterType === type ? "primary" : "outline"}
                  size="small"
                  onClick={() => {
                    setFilterType(type);
                    setShowFilters(false);
                  }}
                  className="text-adaptive-xs whitespace-nowrap"
                >
                  {type === 'all' ? (
                    <>
                      <Filter className="icon-adaptive-sm mr-1 sm:mr-2" />
                      {t('common.all')}
                    </>
                  ) : type === 'expense' ? (
                    <>
                      <TrendingDown className="icon-adaptive-sm mr-1 sm:mr-2" />
                      {t('transactions.expense')}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="icon-adaptive-sm mr-1 sm:mr-2" />
                      {t('transactions.income')}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile Filter Dropdown */}
          <div className={`${showFilters ? 'block' : 'hidden'} mobile-grid gap-2 adaptive-card`}>
            {['all', 'expense', 'income'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? "primary" : "outline"}
                size="small"
                onClick={() => {
                  setFilterType(type);
                  setShowFilters(false);
                }}
                className="text-xs"
              >
                {type === 'all' ? (
                  <>
                    <Filter className="icon-adaptive-sm mr-1" />
                    {t('common.all')}
                  </>
                ) : type === 'expense' ? (
                  <>
                    <TrendingDown className="icon-adaptive-sm mr-1" />
                    {t('transactions.expense')}
                  </>
                ) : (
                  <>
                    <TrendingUp className="icon-adaptive-sm mr-1" />
                    {t('transactions.income')}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories Display */}
        <div className="space-y-6 sm:space-y-8">
          {/* My Categories Section - Displayed First */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-base sm:text-xl">{t('categories.userCategories')} ({userCategories.length})</span>
            </h3>

            {userCategories.length > 0 ? (
              <div className={cn(
                "grid gap-3 sm:gap-6",
                viewMode === 'grid' 
                  ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                  : "grid-cols-1"
              )}>
                {userCategories.map((category, index) => (
                  viewMode === 'grid' ? (
                    <CategoryCard
                      key={`user-${category.id}`}
                      category={category}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      deleting={isDeleting}
                      isDefault={false}
                      t={t}
                    />
                  ) : (
                    <CategoryListItem
                      key={`user-list-${category.id}`}
                      category={category}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      deleting={isDeleting}
                      isDefault={false}
                      t={t}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800">
                {React.createElement(getIconComponent('tag'), { className: 'w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-3 sm:mb-4' })}
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? t('categories.noResults') : t('categories.noCategories')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                  {searchTerm 
                    ? t('categories.tryDifferentSearch')
                    : t('categories.createFirstCategory')
                  }
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleCreateNew}
                    size="small"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('categories.createFirst')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Default Categories Section - Organized by Theme */}
          {defaultCategories.length > 0 && (
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-base sm:text-xl">{t('categories.defaultCategories')} ({defaultCategories.length})</span>
              </h3>

              {/* Organize default categories by theme */}
              {(() => {
                // Group categories by theme
                const themes = categoryConfig.themes;
                const organizedCategories = {};
                
                // Initialize themes
                Object.keys(themes).forEach(themeKey => {
                  organizedCategories[themeKey] = [];
                });
                
                // Categorize defaults into themes
                defaultCategories.forEach(category => {
                  const categoryName = category.name.toLowerCase();
                  let categoryTheme = 'miscellaneous';
                  
                  // Check which theme this category belongs to
                  Object.entries(themes).forEach(([themeKey, theme]) => {
                    if (theme.categories && theme.categories.some(cat => 
                      cat.toLowerCase() === categoryName ||
                      categoryName.includes(cat.toLowerCase()) ||
                      cat.toLowerCase().includes(categoryName)
                    )) {
                      categoryTheme = themeKey;
                    }
                  });
                  
                  organizedCategories[categoryTheme].push(category);
                });

                return Object.entries(organizedCategories)
                  .filter(([_, categories]) => categories.length > 0)
                  .map(([themeKey, categories]) => {
                    const theme = themes[themeKey];
                    if (!theme) return null;
                    
                    return (
                      <div
                        key={themeKey}
                        className="mb-6"
                      >
                        {/* Theme Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`p-1.5 rounded-lg ${theme.color || 'bg-gray-500'}`}>
                            {React.createElement(getIconComponent(theme.icon || 'tag'), { 
                              className: 'w-3 h-3 text-white' 
                            })}
                          </div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {language === 'he' ? theme.name_he : theme.name} ({categories.length})
                          </h4>
                        </div>
                        
                        {/* Theme Categories */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {categories.map((category, index) => (
                            <div
                              key={`default-${themeKey}-${category.id}`}
                              className="group relative p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {React.createElement(getIconComponent(category.icon || 'tag'), { 
                                    className: 'w-3 h-3 text-gray-600 dark:text-gray-400' 
                                  })}
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                  {category.name}
                                </span>
                              </div>
                              
                              {/* Type indicator */}
                              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                                category.type === 'income' 
                                  ? 'bg-green-500' 
                                  : 'bg-red-500'
                              }`}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('categories.loading')}</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('categories.errorLoading')}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                {error.message || t('categories.errorGeneric')}
              </p>
              <Button
                onClick={refresh}
                variant="outline"
                size="small"
              >
                {t('common.retry')}
              </Button>
            </div>
          )}
        </div>

        {/* Category Form Modal - Mobile Optimized */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title={
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                {React.createElement(getIconComponent('tag'), { className: 'icon-adaptive-sm text-white' })}
              </div>
              <span className="text-base sm:text-lg">
                {editingCategory ? t('categories.edit') : t('categories.create')}
              </span>
            </div>
          }
          size="large"
          className="sm:max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label={t('categories.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
                placeholder={t('categories.namePlaceholder')}
                className="text-base sm:text-sm"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('categories.type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['expense', 'income'].map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.type === type ? "primary" : "outline"}
                      onClick={() => setFormData({ ...formData, type })}
                      className={cn(
                        "justify-center text-sm sm:text-base py-2 sm:py-2",
                        formData.type === type && "ring-2 ring-primary-500 ring-offset-2"
                      )}
                    >
                      {type === 'expense' ? (
                        <>
                          <TrendingDown className="icon-adaptive-sm mr-1 sm:mr-2" />
                          {t('transactions.expense')}
                        </>
                      ) : (
                        <>
                          <TrendingUp className="icon-adaptive-sm mr-1 sm:mr-2" />
                          {t('transactions.income')}
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('categories.description')} 
                <span className="text-gray-500 text-xs">({t('common.optional')})</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('categories.descriptionPlaceholder')}
                rows={2}
                className="w-full px-3 py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            
            {/* Icon Selection - Mobile Optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                {t('categories.icon')}
              </label>
              
              {/* Icon Category Tabs - Mobile Scrollable */}
              <div className="flex gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap">
                {Object.keys(iconCategories).map(categoryKey => (
                  <Button
                    key={categoryKey}
                    type="button"
                    variant={selectedIconCategory === categoryKey ? "primary" : "outline"}
                    size="small"
                    onClick={() => setSelectedIconCategory(categoryKey)}
                    className="whitespace-nowrap text-xs sm:text-sm flex-shrink-0"
                  >
                    {t(`categories.iconCategories.${categoryKey}`)}
                  </Button>
                ))}
              </div>
              
              {/* Icon Grid - Mobile Optimized */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3 max-h-40 sm:max-h-48 overflow-y-auto p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                {iconCategories[selectedIconCategory].map(({ name, icon: IconComponent, label }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: name })}
                    className={cn(
                      'p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all group relative touch-manipulation',
                      formData.icon === name
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 active:scale-95'
                    )}
                    title={label}
                  >
                    <IconComponent className={cn(
                      'w-4 h-4 sm:w-6 sm:h-6 mx-auto transition-colors',
                      formData.icon === name 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 group-hover:text-primary-500'
                    )} />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Actions - Mobile Optimized */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={isCreating || isUpdating}
                className="w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isCreating || isUpdating}
                disabled={isCreating || isUpdating || !formData.name.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCategory ? t('common.save') : t('common.create')}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Modal>
  );
};

// Mobile-Optimized User Category Card Component
const CategoryCard = ({ 
  category, 
  index, 
  onEdit, 
  onDelete, 
  deleting, 
  isDefault, 
  t
}) => {
  const IconComponent = getIconComponent(category.icon || 'tag');
  const displayName = category.is_default 
    ? (t(`categories.${category.name}`, category.name) || category.name) 
    : category.name;

  return (
    <div className="relative overflow-hidden group hover:shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 touch-manipulation">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 opacity-10">
        <div className={cn(
          "w-full h-full rounded-full bg-gradient-to-br",
          getGradientForCategory(category.type)
        )} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={cn(
            "p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br shadow-lg",
            getGradientForCategory(category.type)
          )}>
            <IconComponent className="icon-adaptive-base text-white" />
          </div>
          
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(category);
              }}
            >
              <Edit2 className="icon-adaptive-sm text-blue-600" />
            </button>
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900 touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(category.id);
              }}
              disabled={deleting}
            >
              {deleting ? (
                <div className="animate-spin rounded-full border-2 border-red-500 border-t-transparent h-7 w-7 sm:h-8 sm:w-8"></div>
              ) : (
                <Trash2 className="icon-adaptive-sm text-red-600" />
              )}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div>
          <h4 className="font-bold text-adaptive-base text-gray-900 dark:text-white mb-2 truncate">
            {displayName}
          </h4>
          
          {category.description && (
            <p className="text-adaptive-xs text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
              {category.description}
            </p>
          )}
          
          <Badge 
            variant={category.type === 'income' ? 'success' : 'danger'}
            size="small"
            className="text-xs"
          >
            {category.type === 'income' ? (
              <>
                <TrendingUp className="icon-adaptive-sm mr-1" />
                {t('transactions.income')}
              </>
            ) : (
              <>
                <TrendingDown className="icon-adaptive-sm mr-1" />
                {t('transactions.expense')}
              </>
            )}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Mobile List View Component
const CategoryListItem = ({ 
  category, 
  index, 
  onEdit, 
  onDelete, 
  deleting, 
  isDefault, 
  t 
}) => {
  const [showActions, setShowActions] = useState(false);
  const IconComponent = getIconComponent(category.icon || 'tag');
  const displayName = category.is_default 
    ? (t(`categories.${category.name}`, category.name) || category.name) 
    : category.name;

  return (
    <div className="p-4 transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "p-2 rounded-lg bg-gradient-to-br shadow-sm flex-shrink-0",
            getGradientForCategory(category.type)
          )}>
            <IconComponent className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </h4>
            {category.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {category.description}
              </p>
            )}
          </div>
          
          <Badge 
            variant={category.type === 'income' ? 'success' : 'danger'}
            size="small"
            className="text-xs flex-shrink-0"
          >
            {category.type === 'income' ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <button
            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            onClick={() => onEdit?.(category)}
          >
            <Edit2 className="w-3 h-3 text-blue-600" />
          </button>
          <button
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
            onClick={() => onDelete?.(category.id)}
            disabled={deleting}
          >
            {deleting ? (
              <div className="animate-spin rounded-full border-2 border-red-500 border-t-transparent h-3 w-3"></div>
            ) : (
              <Trash2 className="w-3 h-3 text-red-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile-Optimized Compact Default Category Chip Component
const CompactCategoryChip = ({ category, index, t }) => {
  const IconComponent = getIconComponent(category.icon || 'tag');
  const displayName = category.is_default 
    ? (t(`categories.${category.name}`, category.name) || category.name) 
    : category.name;

  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/60 dark:bg-gray-800/60 rounded-full border border-amber-200 dark:border-amber-800 hover:shadow-sm transition-all duration-200 touch-manipulation">
      {/* Icon */}
      <div className={cn(
        "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br shadow-sm flex items-center justify-center flex-shrink-0",
        getGradientForCategory(category.type)
      )}>
        <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
      </div>
      
      {/* Name */}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-16 sm:max-w-20" title={displayName}>
        {displayName}
      </span>
      
      {/* Type indicator dot */}
      <div className={cn(
        "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0",
        category.type === 'income' ? 'bg-green-400' : 'bg-red-400'
      )} />
    </div>
  );
};

export default React.memo(CategoryManager);