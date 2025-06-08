/**
 * CategoryManager Component
 * Full CRUD interface for managing categories with premium UI/UX
 * Features: Category creation, editing, deletion, search, and filtering
 * Mobile-optimized with responsive design
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Save, X, Star,
  TrendingUp, TrendingDown, Crown, Search, Filter,
  MoreVertical, Grid, List
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCategories } from '../../../hooks/useCategory';
import { Card, Button, Input, Badge, Modal, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';
import toast from 'react-hot-toast';

import {
  iconCategories,
  getIconComponent,
  getGradientForCategory
} from '../../../config/categoryIcons';

/**
 * Category Manager Component
 * Provides comprehensive category management with search, filtering, and CRUD operations
 * Fully responsive with mobile-first design
 */
const CategoryManager = () => {
  const { t, language } = useLanguage();
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
          ? t(`categories.${category.name}`) 
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
        toast.success(t('categories.updated'), {
          icon: '✨',
          duration: 3000
        });
      } else {
        await createCategory(formData);
        toast.success(t('categories.created'), {
          icon: '🎉',
          duration: 3000
        });
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
      toast.success(t('categories.deleted'), {
        icon: '🗑️',
        duration: 3000
      });
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
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="flex items-center justify-between sm:hidden">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('categories.title')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="small"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button
            onClick={handleCreateNew}
            size="small"
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-3 sm:space-y-0">
        {/* Mobile Search */}
        <div className="relative sm:hidden">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('categories.searchCategories')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-12"
          />
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden sm:hidden"
            >
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                        <Filter className="w-3 h-3 mr-1" />
                        {t('common.all')}
                      </>
                    ) : type === 'expense' ? (
                      <>
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {t('transactions.expense')}
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {t('transactions.income')}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Controls */}
        <div className="hidden sm:flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('categories.searchCategories')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {['all', 'expense', 'income'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? "primary" : "outline"}
                size="small"
                onClick={() => setFilterType(type)}
                className="whitespace-nowrap"
              >
                {type === 'all' ? (
                  <>
                    <Filter className="w-4 h-4 mr-2" />
                    {t('common.all')}
                  </>
                ) : type === 'expense' ? (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    {t('transactions.expense')}
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {t('transactions.income')}
                  </>
                )}
              </Button>
            ))}
          </div>
          
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('categories.addCategory')}
          </Button>
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
            <motion.div
              className={cn(
                "grid gap-3 sm:gap-6",
                viewMode === 'grid' 
                  ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
                  : "grid-cols-1"
              )}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
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
                      isMobile={true}
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
              </AnimatePresence>
            </motion.div>
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

        {/* Default Categories Section - Compact Single Row */}
        {defaultCategories.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-900/10 dark:to-yellow-900/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-200/50 dark:border-amber-800/50">
            <h4 className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 mb-3 sm:mb-4 flex items-center gap-2">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
              {t('categories.defaultCategories')} ({defaultCategories.length})
            </h4>
            
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <AnimatePresence>
                {defaultCategories.map((category, index) => (
                  <CompactCategoryChip
                    key={`default-${category.id}`}
                    category={category}
                    index={index}
                    t={t}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading categories...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error loading categories
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              {error.message || 'Something went wrong'}
            </p>
            <Button
              onClick={refresh}
              variant="outline"
              size="small"
            >
              Try Again
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
              {React.createElement(getIconComponent('tag'), { className: 'w-4 h-4 sm:w-5 sm:h-5 text-white' })}
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
              placeholder="למשל: קפה וארוחות"
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
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {t('transactions.expense')}
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
                  {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
                </Button>
              ))}
            </div>
            
            {/* Icon Grid - Mobile Optimized */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3 max-h-40 sm:max-h-48 overflow-y-auto p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              {iconCategories[selectedIconCategory].map(({ name, icon: IconComponent, label }) => (
                <motion.button
                  key={name}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: name })}
                  className={cn(
                    'p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all group relative touch-manipulation',
                    formData.icon === name
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 active:scale-95'
                  )}
                  whileTap={{ scale: 0.9 }}
                  title={label}
                >
                  <IconComponent className={cn(
                    'w-4 h-4 sm:w-6 sm:h-6 mx-auto transition-colors',
                    formData.icon === name 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-500 group-hover:text-primary-500'
                  )} />
                  
                  {/* Selection indicator */}
                  {formData.icon === name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
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
  t,
  isMobile = false
}) => {
  const IconComponent = getIconComponent(category.icon || 'tag');
  const displayName = category.is_default 
    ? t(`categories.${category.name}`) 
    : category.name;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.8, y: 10 },
        visible: { 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: {
            delay: index * 0.05,
            type: "spring",
            stiffness: 300,
            damping: 25
          }
        }
      }}
      whileHover={{ scale: isMobile ? 1.02 : 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card className="p-4 sm:p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:shadow-lg sm:hover:shadow-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 touch-manipulation">
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
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            
            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(category);
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900 touch-manipulation"
              >
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(category.id);
                }}
                disabled={deleting}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900 touch-manipulation"
              >
                {deleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-500 border-t-transparent rounded-full"
                  />
                ) : (
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div>
            <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2 truncate">
              {displayName}
            </h4>
            
            {category.description && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">
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
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  {t('transactions.income')}
                </>
              ) : (
                <>
                  <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  {t('transactions.expense')}
                </>
              )}
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
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
    ? t(`categories.${category.name}`) 
    : category.name;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { 
          opacity: 1, 
          x: 0,
          transition: {
            delay: index * 0.05,
            type: "spring",
            stiffness: 300,
            damping: 25
          }
        }
      }}
      layout
    >
      <Card className="p-4 transition-all duration-200 border border-gray-200 dark:border-gray-700">
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
            <Button
              variant="ghost"
              size="small"
              onClick={() => onEdit?.(category)}
              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <Edit2 className="w-3 h-3 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => onDelete?.(category.id)}
              disabled={deleting}
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
            >
              {deleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full"
                />
              ) : (
                <Trash2 className="w-3 h-3 text-red-600" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Mobile-Optimized Compact Default Category Chip Component
const CompactCategoryChip = ({ category, index, t }) => {
  const IconComponent = getIconComponent(category.icon || 'tag');
  const displayName = category.is_default 
    ? t(`categories.${category.name}`) 
    : category.name;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: {
            delay: index * 0.02,
            type: "spring",
            stiffness: 400,
            damping: 25
          }
        }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
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
    </motion.div>
  );
};

export default CategoryManager;