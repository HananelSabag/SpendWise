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

export const useRecurringTransactions = (type) => {
  return useQuery({
    queryKey: ['recurring', type],
    queryFn: () => transactionAPI.getRecurring(type)
  });
};

export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => transactionAPI.getTemplates()
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