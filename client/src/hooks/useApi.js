// src/hooks/useApi.js
import { useQuery, useMutation } from '@tanstack/react-query';
import { transactionAPI, authAPI } from '../utils/api';
import { invalidateQueries, queryClient } from '../config/queryClient';
import toast from 'react-hot-toast';

/**
 * Transaction Hooks
 */
export const useTransactions = (filters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionAPI.getAll(filters),
    enabled: !!filters
  });
};

// Add new hook for transaction list
export const useTransactionsQuery = (filters) => {
  return useQuery({
    queryKey: ['transactions-query', filters],
    queryFn: () => transactionAPI.getAll(filters),
    enabled: !!filters,
    select: (response) => {
      const data = response.data;
      return {
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        pagination: data.pagination || {},
        totalCount: data.pagination?.total || 0
      };
    }
  });
};

export const useRecurringTransactions = (type) => {
  return useQuery({
    queryKey: ['recurring', type],
    queryFn: () => transactionAPI.getRecurring(type),
    staleTime: 60 * 1000, // One minute
    // Improve data handling
    select: (response) => {
      const data = response.data;
      // Ensure we always return an array
      return Array.isArray(data.data) ? data.data : [];
    }
  });
};

// Hook for transaction search
export const useTransactionSearch = (searchTerm, enabled = true) => {
  return useQuery({
    queryKey: ['transaction-search', searchTerm],
    queryFn: () => transactionAPI.search(searchTerm),
    enabled: enabled && searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000,
    select: (response) => {
      return Array.isArray(response.data) ? response.data : [];
    }
  });
};

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => transactionAPI.getTemplates(),
    // Improve data handling
    select: (response) => {
      const data = response.data;
      return Array.isArray(data.data) ? data.data : [];
    }
  });
};

export const useStats = (months = 12) => {
  return useQuery({
    queryKey: ['stats', months],
    queryFn: () => transactionAPI.getStats(months)
  });
};

/**
 * Transaction Mutations
 */
export const useCreateTransaction = () => {
  return useMutation({
    mutationFn: ({ type, data }) => transactionAPI.create(type, data),
    onSuccess: (data, variables) => {
      toast.success(`${variables.type === 'expense' ? 'Expense' : 'Income'} added successfully`);
      invalidateQueries.transactions();
      invalidateQueries.dashboard();
    }
  });
};

export const useUpdateTransaction = () => {
  return useMutation({
    mutationFn: ({ type, id, data }) => transactionAPI.update(type, id, data),
    onSuccess: (data, variables) => {
      toast.success(`${variables.type === 'expense' ? 'Expense' : 'Income'} updated successfully`);
      invalidateQueries.transactions();
      invalidateQueries.dashboard();
    }
  });
};

export const useDeleteTransaction = () => {
  return useMutation({
    mutationFn: ({ type, id, deleteFuture }) => transactionAPI.delete(type, id, deleteFuture),
    onSuccess: (data, variables) => {
      toast.success(`${variables.type === 'expense' ? 'Expense' : 'Income'} deleted successfully`);
      invalidateQueries.transactions();
      invalidateQueries.dashboard();
    }
  });
};

export const useSkipOccurrence = () => {
  return useMutation({
    mutationFn: ({ type, id, skipDate }) => transactionAPI.skipOccurrence(type, id, skipDate),
    onSuccess: () => {
      toast.success('Transaction occurrence skipped');
      invalidateQueries.transactions();
    }
  });
};

/**
 * Template Mutations
 */
export const useUpdateTemplate = () => {
  return useMutation({
    mutationFn: ({ id, data }) => transactionAPI.updateTemplate(id, data),
    onSuccess: () => {
      toast.success('Recurring template updated');
      invalidateQueries.transactions();
      queryClient.invalidateQueries(['templates']);
    }
  });
};

export const useDeleteTemplate = () => {
  return useMutation({
    mutationFn: ({ id, deleteFuture }) => transactionAPI.deleteTemplate(id, deleteFuture),
    onSuccess: () => {
      toast.success('Recurring template deleted');
      invalidateQueries.transactions();
      queryClient.invalidateQueries(['templates']);
    }
  });
};

/**
 * Auth Hooks
 */
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile(),
    staleTime: 10 * 60 * 1000, // Profile data fresh for 10 minutes
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to update profile';
      toast.error(message);
    }
  });
};

export const useUpdatePreferences = () => {
  return useMutation({
    mutationFn: (preferences) => authAPI.updatePreferences(preferences),
    onSuccess: () => {
      toast.success('Preferences updated');
      queryClient.invalidateQueries(['profile']);
    }
  });
};

// Add new hook for categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => transactionAPI.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    select: (response) => {
      const data = response.data;
      return Array.isArray(data.data) ? data.data : [];
    }
  });
};

// Add category mutations
export const useCreateCategory = () => {
  return useMutation({
    mutationFn: (data) => transactionAPI.createCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries(['categories']);
    }
  });
};

export const useUpdateCategory = () => {
  return useMutation({
    mutationFn: ({ id, data }) => transactionAPI.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries(['categories']);
    }
  });
};

export const useDeleteCategory = () => {
  return useMutation({
    mutationFn: (id) => transactionAPI.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries(['categories']);
    }
  });
};

// Add hook for profile picture upload
export const useUploadProfilePicture = () => {
  return useMutation({
    mutationFn: (file) => authAPI.uploadProfilePicture(file),
    onSuccess: (data) => {
      toast.success('Profile picture updated successfully');
      queryClient.invalidateQueries(['profile']);
      return data;
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to upload image';
      toast.error(message);
      throw error;
    }
  });
};