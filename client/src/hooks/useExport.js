/**
 * 📤 useExport Hook - Enhanced Data Export Management
 * Features: CSV/PDF export, Progress tracking, Background processing
 * NOW WITH UNIFIED API INTEGRATION! 🚀
 * @version 2.0.0
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ NEW: Import unified API instead of old utils/api
import { api } from '../api';

// ✅ NEW: Import from Zustand stores instead of Context
import { useAuth, useTranslation, useNotifications } from '../stores';

import { useToast } from './useToast';

// ✅ Query keys for export operations
export const exportQueryKeys = {
  exportHistory: ['export', 'history'],
  exportStatus: (id) => ['export', 'status', id]
};

export const useExport = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { toastService } = useToast();
  const queryClient = useQueryClient();
  
  const [exportProgress, setExportProgress] = useState({});
  const [activeExports, setActiveExports] = useState(new Set());

  // ✅ ENHANCED: Export mutation with unified API
  const exportMutation = useMutation({
    mutationFn: async ({ type, format, filters, options = {} }) => {
      // Use unified API for export
      const result = await api.export.generateExport({
        type,
        format,
        filters,
        options,
        userId: user?.id
      });
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Export failed');
      }
    },
    onMutate: ({ type, format }) => {
      const exportId = `${type}_${format}_${Date.now()}`;
      setActiveExports(prev => new Set([...prev, exportId]));
      setExportProgress(prev => ({
        ...prev,
        [exportId]: { progress: 0, status: 'preparing' }
      }));
      return { exportId };
    },
    onSuccess: (data, variables, context) => {
      const { exportId } = context;
      
      setExportProgress(prev => ({
        ...prev,
        [exportId]: { progress: 100, status: 'completed', downloadUrl: data.downloadUrl }
      }));
      
      // Show success notification
      addNotification({
        type: 'success',
        title: t('export.exportComplete'),
        description: t('export.exportReady'),
        duration: 5000
      });
      
      // Auto-download if requested
      if (data.downloadUrl && !variables.options?.skipAutoDownload) {
        triggerDownload(data.downloadUrl, data.filename);
      }
      
      // Invalidate export history
      queryClient.invalidateQueries(exportQueryKeys.exportHistory);
    },
    onError: (error, variables, context) => {
      const { exportId } = context || {};
      
      if (exportId) {
        setExportProgress(prev => ({
          ...prev,
          [exportId]: { progress: 0, status: 'failed', error: error.message }
        }));
        setActiveExports(prev => {
          const newSet = new Set(prev);
          newSet.delete(exportId);
          return newSet;
        });
      }
      
      // Show error notification
      addNotification({
        type: 'error',
        title: t('export.exportFailed'),
        description: error.message || t('export.exportError'),
        duration: 8000
      });
    },
    onSettled: (data, error, variables, context) => {
      const { exportId } = context || {};
      
      if (exportId) {
        setTimeout(() => {
          setActiveExports(prev => {
            const newSet = new Set(prev);
            newSet.delete(exportId);
            return newSet;
          });
          
          setExportProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[exportId];
            return newProgress;
          });
        }, 5000); // Clean up after 5 seconds
      }
    }
  });

  // Helper function to trigger download
  const triggerDownload = useCallback((url, filename) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'export.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      toastService.error('Download failed');
    }
  }, [toastService]);

  // ✅ ENHANCED: Export transactions with progress tracking
  const exportTransactions = useCallback(async (filters = {}, options = {}) => {
    const { format = 'csv', dateRange, categories, ...otherFilters } = filters;
    
    try {
      await exportMutation.mutateAsync({
        type: 'transactions',
        format,
        filters: {
          dateRange,
          categories,
          ...otherFilters
        },
        options: {
          includeMetadata: true,
          includeAnalytics: options.includeAnalytics || false,
          ...options
        }
      });
    } catch (error) {
      console.error('Transaction export failed:', error);
      throw error;
    }
  }, [exportMutation]);

  // ✅ ENHANCED: Export categories
  const exportCategories = useCallback(async (options = {}) => {
    const { format = 'csv' } = options;
    
    try {
      await exportMutation.mutateAsync({
        type: 'categories',
        format,
        filters: {},
        options: {
          includeUsageStats: true,
          ...options
        }
      });
    } catch (error) {
      console.error('Category export failed:', error);
      throw error;
    }
  }, [exportMutation]);

  // ✅ ENHANCED: Export financial report
  const exportFinancialReport = useCallback(async (dateRange, options = {}) => {
    const { format = 'pdf' } = options;
    
    try {
      await exportMutation.mutateAsync({
        type: 'financial_report',
        format,
        filters: { dateRange },
        options: {
          includeCharts: true,
          includeAnalytics: true,
          includeRecommendations: true,
          ...options
        }
      });
    } catch (error) {
      console.error('Financial report export failed:', error);
      throw error;
    }
  }, [exportMutation]);

  // ✅ NEW: Export analytics data
  const exportAnalytics = useCallback(async (analyticsType, dateRange, options = {}) => {
    const { format = 'csv' } = options;
    
    try {
      await exportMutation.mutateAsync({
        type: 'analytics',
        format,
        filters: { 
          analyticsType, 
          dateRange 
        },
        options: {
          includeInsights: true,
          includeProjections: true,
          ...options
        }
      });
    } catch (error) {
      console.error('Analytics export failed:', error);
      throw error;
    }
  }, [exportMutation]);

  // ✅ NEW: Bulk export all data
  const exportAllData = useCallback(async (options = {}) => {
    const { format = 'zip' } = options;
    
    try {
      await exportMutation.mutateAsync({
        type: 'full_backup',
        format,
        filters: {},
        options: {
          includeTransactions: true,
          includeCategories: true,
          includeSettings: true,
          includeAnalytics: true,
          ...options
        }
      });
    } catch (error) {
      console.error('Full backup export failed:', error);
      throw error;
    }
  }, [exportMutation]);

  // ✅ Progress tracking utilities
  const getExportProgress = useCallback((exportId) => {
    return exportProgress[exportId] || null;
  }, [exportProgress]);

  const isExportActive = useCallback((exportId) => {
    return activeExports.has(exportId);
  }, [activeExports]);

  const hasActiveExports = activeExports.size > 0;

  return {
    // Export functions
    exportTransactions,
    exportCategories,
    exportFinancialReport,
    exportAnalytics,
    exportAllData,
    
    // Progress tracking
    exportProgress,
    activeExports: Array.from(activeExports),
    hasActiveExports,
    getExportProgress,
    isExportActive,
    
    // Status
    isExporting: exportMutation.isLoading,
    error: exportMutation.error,
    
    // Utilities
    triggerDownload,
    
    // Raw mutation for advanced usage
    exportMutation
  };
};

export default useExport;