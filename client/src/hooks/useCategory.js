/**
 * useCategories Hook - Complete Category Management
 * Handles all category operations with caching and optimistic updates
 */

import { useCallback, useMemo } from 'react';
import { useApiQuery, useApiMutation } from './useApi';
import { categoryAPI, queryKeys, mutationKeys } from '../utils/api';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

// ✅ UPDATED: Import ONLY from centralized icon system
import {
  getIconForCategory,
  getColorForCategory,
  getIconComponent,
  getGradientForCategory
} from '../config/categoryIcons';

/**
 * Main categories hook
 */
export const useCategories = (type = null) => {
  const { isAuthenticated } = useAuth();
  const toastService = useToast();
  
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
  
  // ✅ ADD: Debug logging to see what API returns (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [CATEGORIES-DEBUG] Raw API response:', categoriesQuery.data);
  }
  
  // ✅ FIXED: Process categories with proper data structure handling and initial state
  const processedCategories = useMemo(() => {
    // ✅ FIXED: Handle initial loading state properly
    if (!categoriesQuery.data) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [CATEGORIES] No data yet - returning empty state');
      }
      return { all: [], user: [], system: [] };
    }
    
    // ✅ Add detailed logging for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [CATEGORIES-DEBUG] Processing categories:', {
        hasData: !!categoriesQuery.data,
        dataType: typeof categoriesQuery.data,
        dataKeys: categoriesQuery.data ? Object.keys(categoriesQuery.data) : null,
        isArray: Array.isArray(categoriesQuery.data),
        dataContent: categoriesQuery.data
      });
    }
    
    // ✅ FIXED: Handle axios response structure properly
    let categoriesData = null;
    
    // First check if this is an axios response (has data, status, headers etc.)
    if (categoriesQuery.data.data && typeof categoriesQuery.data.status === 'number') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [CATEGORIES] Detected axios response structure');
      }
      
      // Check if the inner data has the expected API response structure
      if (categoriesQuery.data.data.data && Array.isArray(categoriesQuery.data.data.data)) {
        // Case: axios.data.data.data (API wraps in { success, data, timestamp })
        categoriesData = categoriesQuery.data.data.data;
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CATEGORIES] Found axios.data.data.data array with', categoriesData.length, 'items');
        }
      } else if (Array.isArray(categoriesQuery.data.data)) {
        // Case: axios.data.data (direct array)
        categoriesData = categoriesQuery.data.data;
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CATEGORIES] Found axios.data.data array with', categoriesData.length, 'items');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('❌ [CATEGORIES] Axios response data is not in expected format:', categoriesQuery.data.data);
        }
        categoriesData = [];
      }
    }
    // Handle direct API response (if axios interceptor already extracted data)
    else if (categoriesQuery.data.data && Array.isArray(categoriesQuery.data.data)) {
      categoriesData = categoriesQuery.data.data;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [CATEGORIES] Found response.data.data array');
      }
    } 
    // Direct array (shouldn't happen with current setup)
    else if (Array.isArray(categoriesQuery.data)) {
      categoriesData = categoriesQuery.data;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [CATEGORIES] Found direct array');
      }
    } 
    // Other possible structures
    else if (categoriesQuery.data.categories && Array.isArray(categoriesQuery.data.categories)) {
      categoriesData = categoriesQuery.data.categories;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [CATEGORIES] Found data.categories array');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('❌ [CATEGORIES] Unexpected data structure:', categoriesQuery.data);
        console.log('❌ [CATEGORIES] Available keys:', Object.keys(categoriesQuery.data));
      }
      
      // Try to find any array in the response
      const allValues = Object.values(categoriesQuery.data);
      const arrayValue = allValues.find(val => Array.isArray(val));
      if (arrayValue) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [CATEGORIES] Found array in response values:', arrayValue.length, 'items');
        }
        categoriesData = arrayValue;
      } else {
        categoriesData = [];
      }
    }
    
    // ✅ FIXED: Ensure we always have an array
    if (!Array.isArray(categoriesData)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('❌ [CATEGORIES] Categories data is not an array:', typeof categoriesData, categoriesData);
      }
      return { all: [], user: [], system: [] };
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [CATEGORIES] Processing array with', categoriesData.length, 'items:', categoriesData);
    }
    
    const categories = categoriesData.map(category => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [CATEGORIES] Processing category:', category);
      }
      return {
        ...category,
        // ✅ Ensure icon is properly mapped from server data
        icon: category.icon || getIconForCategory(category.name),
        // ✅ Add display properties using centralized functions
        iconComponent: getIconComponent(category.icon || getIconForCategory(category.name)),
        colorClass: getColorForCategory(category.type),
        gradientClass: getGradientForCategory(category.type)
      };
    });
    
    const result = {
      all: categories,
      user: categories.filter(c => !c.is_default),
      system: categories.filter(c => c.is_default),
      byType: {
        income: categories.filter(c => c.type === 'income'),
        expense: categories.filter(c => c.type === 'expense'),
        neutral: categories.filter(c => !c.type)
      }
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [CATEGORIES] Final processed result:', {
        allCount: result.all.length,
        userCount: result.user.length,
        systemCount: result.system.length,
        categories: result.all
      });
    }
    
    return result;
  }, [categoriesQuery.data]);
  
  // ✅ UPDATED: Create category with proper icon handling
  const createCategoryMutation = useApiMutation(
    (data) => {
      // Ensure icon is set properly before sending to server
      const categoryData = {
        ...data,
        icon: data.icon || getIconForCategory(data.name)
      };
      return categoryAPI.create(categoryData);
    },
    {
      mutationKey: mutationKeys.createCategory,
      invalidateKeys: [queryKeys.categories()],
      showSuccessToast: false, // Use toastService directly
      optimisticUpdate: {
        queryKey: queryKeys.categories(type),
        updater: (old, variables) => {
          if (!old) return old;
          
          const newCategory = {
            id: Date.now(),
            ...variables,
            icon: variables.icon || getIconForCategory(variables.name),
            is_default: false,
            created_at: new Date().toISOString()
          };
          
          // ✅ Handle different data structures for optimistic updates
          if (Array.isArray(old)) {
            return [...old, newCategory];
          } else if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: [...old.data, newCategory]
            };
          } else if (old.categories && Array.isArray(old.categories)) {
            return {
              ...old,
              categories: [...old.categories, newCategory]
            };
          }
          
          return old;
        }
      },
      onSuccess: () => {
        toastService.success('toast.success.categoryCreated');
      }
    }
  ); // ✅ FIX: Added missing closing parenthesis and semicolon

  // ✅ UPDATED: Update category with proper icon handling
  const updateCategoryMutation = useApiMutation(
    ({ id, data }) => {
      const categoryData = {
        ...data,
        icon: data.icon || getIconForCategory(data.name)
      };
      return categoryAPI.update(id, categoryData);
    },
    {
      mutationKey: mutationKeys.updateCategory,
      invalidateKeys: [queryKeys.categories()],
      showSuccessToast: false, // Use toastService directly
      optimisticUpdate: {
        queryKey: queryKeys.categories(type),
        updater: (old, variables) => {
          if (!old) return old;
          
          const updateCategory = (categories) => 
            categories.map(cat => 
              cat.id === variables.id 
                ? { 
                    ...cat, 
                    ...variables.data,
                    icon: variables.data.icon || getIconForCategory(variables.data.name || cat.name)
                  }
                : cat
            );
          
          // ✅ Handle different data structures for optimistic updates
          if (Array.isArray(old)) {
            return updateCategory(old);
          } else if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: updateCategory(old.data)
            };
          } else if (old.categories && Array.isArray(old.categories)) {
            return {
              ...old,
              categories: updateCategory(old.categories)
            };
          }
          
          return old;
        }
      },
      onSuccess: () => {
        toastService.success('toast.success.categoryUpdated');
      }
    }
  ); // ✅ FIX: Added missing closing parenthesis and semicolon
  
  // Delete category mutation
  const deleteCategoryMutation = useApiMutation(
    (id) => categoryAPI.delete(id),
    {
      mutationKey: mutationKeys.deleteCategory,
      invalidateKeys: [queryKeys.categories()],
      showSuccessToast: false, // Use toastService directly
      optimisticUpdate: {
        queryKey: queryKeys.categories(type),
        updater: (old, variables) => {
          if (!old) return old;
          
          const filterCategories = (categories) => 
            categories.filter(cat => cat.id !== variables);
          
          // ✅ Handle different data structures for optimistic updates
          if (Array.isArray(old)) {
            return filterCategories(old);
          } else if (old.data && Array.isArray(old.data)) {
            return {
              ...old,
              data: filterCategories(old.data)
            };
          } else if (old.categories && Array.isArray(old.categories)) {
            return {
              ...old,
              categories: filterCategories(old.categories)
            };
          }
          
          return old;
        }
      },
      onSuccess: () => {
        toastService.success('toast.success.categoryDeleted');
      },
      onError: (error) => {
        if (error.response?.data?.error?.code === 'CATEGORY_IN_USE') {
          toastService.error('toast.error.categoryInUse');
        }
      }
    }
  );
  
  // Helper functions
  const createCategory = useCallback(async (data) => {
    // Validate data
    if (!data.name?.trim()) {
      toastService.error('toast.error.categoryNameRequired');
      return;
    }
    
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      toastService.error('toast.error.categoryTypeRequired');
      return;
    }
    
    // ✅ Ensure icon is properly set
    const categoryData = {
      ...data,
      icon: data.icon || getIconForCategory(data.name)
    };
    
    return createCategoryMutation.mutateAsync(categoryData);
  }, [createCategoryMutation]);
  
  const updateCategory = useCallback(async (id, data) => {
    // ✅ Ensure icon is properly set for updates
    const categoryData = {
      ...data,
      icon: data.icon || getIconForCategory(data.name)
    };
    return updateCategoryMutation.mutateAsync({ id, data: categoryData });
  }, [updateCategoryMutation]);
  
  const deleteCategory = useCallback(async (id) => {
    // Check if it's a default category
    const category = processedCategories.all.find(c => c.id === id);
    if (category?.is_default) {
      toastService.error('toast.error.cannotDeleteDefault');
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
 * ✅ UPDATED: Hook for category icon management - Pure centralized system
 */
export const useCategoryIcons = () => {
  return {
    getIconForCategory,
    getColorForCategory,
    getIconComponent,
    getGradientForCategory
  };
};

// Export for components
export default useCategories;