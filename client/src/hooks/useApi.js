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
  // ✅ ADD: Get auth status to prevent unnecessary calls
  const isAuthenticated = localStorage.getItem('accessToken');
  
  return useQuery({
    queryKey: ['recurring', type],
    queryFn: () => transactionAPI.getRecurring(type),
    // ✅ ADD: Only run when authenticated
    enabled: !!isAuthenticated,
    staleTime: 60 * 1000, // One minute
    // ✅ ADD: Disable window focus refetch for unauthenticated users
    refetchOnWindowFocus: !!isAuthenticated,
    // ✅ ADD: Disable mount refetch for unauthenticated users  
    refetchOnMount: !!isAuthenticated,
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
  // ✅ ADD: Get auth status to prevent unnecessary calls
  const isAuthenticated = localStorage.getItem('accessToken');
  
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => transactionAPI.getTemplates(),
    // ✅ ADD: Only run when authenticated
    enabled: !!isAuthenticated,
    // ✅ ADD: Disable window focus refetch for unauthenticated users
    refetchOnWindowFocus: !!isAuthenticated,
    // ✅ ADD: Disable mount refetch for unauthenticated users
    refetchOnMount: !!isAuthenticated,
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
  const isAuthenticated = localStorage.getItem('accessToken');
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authAPI.getProfile(),
    // Auth guards
    enabled: !!isAuthenticated,
    refetchOnWindowFocus: false, // Profile rarely changes
    refetchOnMount: !!isAuthenticated,
    staleTime: 60 * 60 * 1000, // 1 hour - profile is stable
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries(['profile']);
      
      // NEW: If email was changed, might need re-verification
      if (response.data?.requiresVerification) {
        toast.info('Please check your email to verify your new email address');
      }
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

/**
 * NEW: Email Verification Hooks
 */
export const useVerifyEmail = (token) => {
  return useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => authAPI.verifyEmail(token),
    enabled: !!token,
    retry: false, // Don't retry failed verifications
    staleTime: Infinity, // Verification result doesn't change
    refetchOnWindowFocus: false, // Prevent accidental re-verification
  });
};

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: (email) => authAPI.resendVerificationEmail(email),
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
    },
    onError: (error) => {
      console.error('📧 [RESEND-VERIFICATION] Error:', error);
      const errorData = error.response?.data?.error;
      
      // Handle rate limiting
      if (errorData?.code === 'VERIFICATION_LIMIT') {
        toast.error('Too many verification attempts. Please wait before trying again.');
      } else {
        const message = errorData?.message || 'Failed to send verification email';
        toast.error(message);
      }
    }
  });
};

/**
 * Password Reset Hooks
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email) => authAPI.forgotPassword(email),
    onSuccess: (response) => {
      // Check if it's development mode with email sent
      const data = response.data;
      if (data.data?.resetUrl && data.data?.note) {
        // Development mode - email was sent but also show URL
        toast.success('Password reset email sent! (Check console for dev link)');
        if (process.env.NODE_ENV === 'development') {
          console.log('🔗 [DEV] Direct reset link:', data.data.resetUrl);
        }
      } else if (data.data?.token) {
        // Development fallback mode
        toast.success('Email service unavailable - check console for reset link');
        console.log('🔗 [DEV] Reset link:', data.data.resetUrl);
      } else {
        // Production mode or normal success
        toast.success('Reset link sent to your email');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to send reset link';
      toast.error(message);
    }
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }) => authAPI.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to reset password';
      toast.error(message);
    }
  });
};

// CRITICAL UPDATE: Add new hooks for categories - FIXES GAP #4
export const useCategories = () => {
  const isAuthenticated = localStorage.getItem('accessToken');
  
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => transactionAPI.getCategories(),
    enabled: !!isAuthenticated,
    refetchOnWindowFocus: false,
    refetchOnMount: !!isAuthenticated,
    staleTime: 5 * 60 * 1000, // ✅ REDUCED: 5 minutes so new categories appear faster
    select: (response) => {
      console.log('📁 [CATEGORIES] Raw response:', response.data); // ✅ ADD: Debug log
      const data = response.data;
      const categories = Array.isArray(data.data) ? data.data : [];
      console.log('📁 [CATEGORIES] Processed categories:', categories); // ✅ ADD: Debug log
      return categories;
    }
  });
};

export const useCreateCategory = () => {
  return useMutation({
    mutationFn: (data) => transactionAPI.createCategory(data),
    onSuccess: (response) => {
      console.log('📁 [CATEGORIES] Created successfully:', response.data); // ✅ ADD: Debug log
      toast.success('Category created successfully');
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      console.error('📁 [CATEGORIES] Create failed:', error); // ✅ ADD: Debug log
      const message = error.response?.data?.error?.message || 'Failed to create category';
      toast.error(message);
    }
  });
};

export const useUpdateCategory = () => {
  return useMutation({
    mutationFn: ({ id, data }) => transactionAPI.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Category updated successfully');
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to update category';
      toast.error(message);
    }
  });
};

export const useDeleteCategory = () => {
  return useMutation({
    mutationFn: (id) => transactionAPI.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to delete category';
      toast.error(message);
    }
  });
};

// CRITICAL UPDATE: Add hook for profile picture upload - FIXES PROFILE IMAGE ISSUE
export const useUploadProfilePicture = () => {
  return useMutation({
    mutationFn: (file) => authAPI.uploadProfilePicture(file),
    onSuccess: (response) => {
      console.log('📸 [UPLOAD] Profile picture uploaded successfully:', response.data);
      
      // Update the profile query data immediately with the new image URL
      queryClient.setQueryData(['profile'], (oldData) => {
        if (!oldData) return oldData;
        
        const newImageUrl = response.data.data.fullUrl || response.data.data.path;
        
        return {
          ...oldData,
          preferences: {
            ...oldData.preferences,
            profilePicture: newImageUrl
          }
        };
      });
      
      // Also invalidate to ensure fresh data
      setTimeout(() => {
        queryClient.invalidateQueries(['profile']);
      }, 500);
      
      toast.success('Profile picture updated successfully');
      return response;
    },
    onError: (error) => {
      console.error('📸 [UPLOAD] Profile picture upload failed:', error);
      const message = error.response?.data?.error?.message || 'Failed to upload image';
      toast.error(message);
      throw error;
    }
  });
};

// Add test email hook for development
export const useTestEmail = () => {
  return useMutation({
    mutationFn: (email) => authAPI.testEmail(email),
    onSuccess: () => {
      toast.success('Test email sent successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Failed to send test email';
      toast.error(message);
    }
  });
};

// Register hook with email verification support
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData) => authAPI.register(userData),
    onSuccess: (data) => {
      console.log('📝 [REGISTER-HOOK] Registration successful:', data);
      
      // Handle email verification requirement
      if (data.requiresVerification) {
        if (data.isExistingUser) {
          toast.info('Account exists but email not verified. Please check your email or resend verification.');
        } else {
          toast.success('Registration successful! Please check your email to verify your account.');
        }
      } else {
        toast.success('Registration successful!');
      }
    },
    onError: (error) => {
      console.error('📝 [REGISTER-HOOK] Registration failed:', error);
      const message = error.response?.data?.error?.message || 'Registration failed';
      toast.error(message);
    }
  });
};