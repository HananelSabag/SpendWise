/**
 * useCategories Hook - Complete Category Management
 * Handles all category operations with caching and optimistic updates
 */

import { useCallback, useMemo } from 'react';
import { useApiQuery, useApiMutation } from './useApi';
import { categoryAPI, queryKeys, mutationKeys } from '../utils/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

/**
 * Main categories hook
 */
export const useCategories = (type = null) => {
  const { isAuthenticated } = useAuth();
  
  // Categories query with long cache
  const categoriesQuery = useApiQuery(
    queryKeys.categories(type),
    () => categoryAPI.getAll(type),
    {
      config: 'static', // Categories rarely change
      enabled: isAuthenticated,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 48 * 60 * 60 * 1000 // 48 hours
    }
  );
  
  // Process categories data
  const processedCategories = useMemo(() => {
    if (!categoriesQuery.data?.data) return { all: [], user: [], system: [] };
    
    const categories = categoriesQuery.data.data;
    
    return {
      all: categories,
      user: categories.filter(c => !c.is_default),
      system: categories.filter(c => c.is_default),
      byType: {
        income: categories.filter(c => c.type === 'income'),
        expense: categories.filter(c => c.type === 'expense'),
        neutral: categories.filter(c => !c.type)
      }
    };
  }, [categoriesQuery.data]);
  
  // Create category mutation
  const createCategoryMutation = useApiMutation(
    (data) => categoryAPI.create(data),
    {
      mutationKey: mutationKeys.createCategory,
      invalidateKeys: [queryKeys.categories()],
      successMessage: 'Category created successfully',
      optimisticUpdate: {
        queryKey: queryKeys.categories(type),
        updater: (old, variables) => {
          if (!old?.data) return old;
          
          const newCategory = {
            id: Date.now(),
            ...variables,
            is_default: false,
            created_at: new Date().toISOString()
          };
          
          return {
            ...old,
            data: [...old.data, newCategory]
          };
        }
      }
    }
  );
  
  // Update category mutation
  const updateCategoryMutation = useApiMutation(
    ({ id, data }) => categoryAPI.update(id, data),
    {
      mutationKey: mutationKeys.updateCategory,
      invalidateKeys: [queryKeys.categories()],
      successMessage: 'Category updated successfully',
      optimisticUpdate: {
        queryKey: queryKeys.categories(type),
        updater: (old, variables) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: old.data.map(cat => 
              cat.id === variables.id 
                ? { ...cat, ...variables.data }
                : cat
            )
          };
        }
      }
    }
  );
  
  // Delete category mutation
  const deleteCategoryMutation = useApiMutation(
    (id) => categoryAPI.delete(id),
    {
      mutationKey: mutationKeys.deleteCategory,
      invalidateKeys: [queryKeys.categories()],
      successMessage: 'Category deleted successfully',
      optimisticUpdate: {
        queryKey: queryKeys.categories(type),
        updater: (old, variables) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: old.data.filter(cat => cat.id !== variables)
          };
        }
      },
      onError: (error) => {
        if (error.response?.data?.error?.code === 'CATEGORY_IN_USE') {
          toast.error('Cannot delete category that has transactions');
        }
      }
    }
  );
  
  // Helper functions
  const createCategory = useCallback(async (data) => {
    // Validate data
    if (!data.name?.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      toast.error('Category type must be income or expense');
      return;
    }
    
    return createCategoryMutation.mutateAsync(data);
  }, [createCategoryMutation]);
  
  const updateCategory = useCallback(async (id, data) => {
    return updateCategoryMutation.mutateAsync({ id, data });
  }, [updateCategoryMutation]);
  
  const deleteCategory = useCallback(async (id) => {
    // Check if it's a default category
    const category = processedCategories.all.find(c => c.id === id);
    if (category?.is_default) {
      toast.error('Cannot delete default categories');
      return;
    }
    
    return deleteCategoryMutation.mutateAsync(id);
  }, [deleteCategoryMutation, processedCategories.all]);
  
  // Find category by ID
  const getCategoryById = useCallback((id) => {
    return processedCategories.all.find(c => c.id === parseInt(id));
  }, [processedCategories.all]);
  
  // Get categories for select options
  const getCategoryOptions = useCallback((transactionType) => {
    if (!transactionType) return processedCategories.all;
    
    return processedCategories.all.filter(cat => 
      cat.type === transactionType || cat.type === null
    );
  }, [processedCategories.all]);
  
  return {
    // Data
    categories: processedCategories.all,
    userCategories: processedCategories.user,
    systemCategories: processedCategories.system,
    categoriesByType: processedCategories.byType,
    
    // Loading states
    isLoading: categoriesQuery.isLoading,
    isCreating: createCategoryMutation.isLoading,
    isUpdating: updateCategoryMutation.isLoading,
    isDeleting: deleteCategoryMutation.isLoading,
    
    // Error states
    error: categoriesQuery.error,
    
    // CRUD operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Utility functions
    getCategoryById,
    getCategoryOptions,
    
    // Refresh
    refresh: categoriesQuery.refetch
  };
};

/**
 * Hook for category statistics
 */
export const useCategoryStats = (categoryId) => {
  const { isAuthenticated } = useAuth();
  
  const statsQuery = useApiQuery(
    queryKeys.categoryStats(categoryId),
    () => categoryAPI.getStats(categoryId),
    {
      config: 'user',
      enabled: isAuthenticated && !!categoryId,
      staleTime: 30 * 60 * 1000 // 30 minutes
    }
  );
  
  const processedStats = useMemo(() => {
    if (!statsQuery.data?.data) return null;
    
    const stats = statsQuery.data.data;
    
    return {
      totalTransactions: stats.total_transactions || 0,
      totalAmount: parseFloat(stats.total_amount) || 0,
      averageAmount: parseFloat(stats.average_amount) || 0,
      lastUsed: stats.last_used ? new Date(stats.last_used) : null,
      monthlyAverage: parseFloat(stats.monthly_average) || 0,
      percentageOfTotal: parseFloat(stats.percentage_of_total) || 0,
      trend: stats.trend || 'stable' // 'increasing', 'decreasing', 'stable'
    };
  }, [statsQuery.data]);
  
  return {
    stats: processedStats,
    isLoading: statsQuery.isLoading,
    error: statsQuery.error,
    refresh: statsQuery.refetch
  };
};

/**
 * Hook for categories with transaction counts
 */
export const useCategoriesWithCounts = (startDate, endDate) => {
  const { isAuthenticated } = useAuth();
  
  const countsQuery = useApiQuery(
    queryKeys.categoriesWithCounts(startDate, endDate),
    () => categoryAPI.getWithCounts(startDate, endDate),
    {
      config: 'dynamic',
      enabled: isAuthenticated && startDate && endDate,
      staleTime: 10 * 60 * 1000 // 10 minutes
    }
  );
  
  const processedData = useMemo(() => {
    if (!countsQuery.data?.data) return [];
    
    return countsQuery.data.data
      .map(category => ({
        ...category,
        transactionCount: parseInt(category.transaction_count) || 0,
        totalAmount: parseFloat(category.total_amount) || 0,
        hasTransactions: (parseInt(category.transaction_count) || 0) > 0
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount);
  }, [countsQuery.data]);
  
  return {
    categoriesWithCounts: processedData,
    isLoading: countsQuery.isLoading,
    error: countsQuery.error,
    refresh: countsQuery.refetch
  };
};

/**
 * Hook for category icon management
 */
export const useCategoryIcons = () => {
  // Predefined category icons
  const icons = {
    // Income icons
    salary: 'wallet',
    freelance: 'briefcase',
    investment: 'trending-up',
    gift: 'gift',
    bonus: 'award',
    rental: 'home',
    business: 'building',
    
    // Expense icons
    food: 'utensils',
    transport: 'car',
    shopping: 'shopping-cart',
    bills: 'file-text',
    entertainment: 'tv',
    health: 'heart',
    education: 'book',
    travel: 'plane',
    rent: 'home',
    utilities: 'zap',
    insurance: 'shield',
    
    // General icons
    general: 'tag',
    other: 'more-horizontal',
    default: 'circle'
  };
  
  const getIconForCategory = useCallback((categoryName) => {
    const name = categoryName.toLowerCase();
    
    // Find matching icon
    for (const [key, icon] of Object.entries(icons)) {
      if (name.includes(key)) {
        return icon;
      }
    }
    
    return icons.default;
  }, []);
  
  const getColorForCategory = useCallback((categoryType) => {
    switch (categoryType) {
      case 'income':
        return 'text-green-600 bg-green-100';
      case 'expense':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }, []);
  
  return {
    icons,
    getIconForCategory,
    getColorForCategory
  };
};

// Export for components
export default useCategories;