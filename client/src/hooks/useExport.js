/**
 * useExport Hook - Complete Data Export Management
 * Handles CSV, JSON, and PDF exports with progress tracking
 */

import { useState, useCallback } from 'react';
import { useApiQuery, useApiMutation } from './useApi';
import { exportAPI, queryKeys } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './useToast';

/**
 * Main export hook with progress tracking
 */
export const useExport = () => {
  const { isAuthenticated, user } = useAuth();
  const toastService = useToast();
  const [exportProgress, setExportProgress] = useState({
    isExporting: false,
    format: null,
    progress: 0
  });
  
  // Export options query - Fixed to handle server response format
  const exportOptionsQuery = useApiQuery(
    queryKeys.exportOptions,
    () => exportAPI.getOptions(),
    {
      config: 'static',
      enabled: isAuthenticated,
      staleTime: 60 * 60 * 1000, // 1 hour
      onError: (error) => {
        console.error('Failed to load export options:', error);
      }
    }
  );
  
  // ✅ FIX: Process export options correctly based on server response format
  const exportOptions = exportOptionsQuery.data?.data || {
    availableFormats: [
      { format: 'csv', available: true },
      { format: 'json', available: true },
      { format: 'pdf', available: false }
    ],
    dataIncluded: [],
    userInfo: {},
    limits: {},
    privacyNote: 'Your exported data is generated on-demand and not stored on our servers.'
  };
  
  // ✅ FIX: Improved export functions with better error handling
  const exportCSVMutation = useApiMutation(
    async () => {
      setExportProgress({ isExporting: true, format: 'CSV', progress: 30 });
      
      try {
        const result = await exportAPI.exportAsCSV();
        setExportProgress({ isExporting: true, format: 'CSV', progress: 100 });
        
        setTimeout(() => {
          setExportProgress({ isExporting: false, format: null, progress: 0 });
        }, 1000);
        
        return result;
      } catch (error) {
        setExportProgress({ isExporting: false, format: null, progress: 0 });
        
        // Better error handling
        if (error.response?.status === 404) {
          toastService.error('toast.error.noDataToExport');
        } else if (error.response?.status === 401) {
          toastService.unauthorized();
        } else if (error.response?.status === 429) {
          toastService.error('toast.error.exportLimitReached');
        } else {
          toastService.error('toast.error.exportFailed', { params: { format: 'CSV' } });
        }
        
        throw error;
      }
    },
    {
      onSuccess: () => {
        toastService.csvExportCompleted();
      },
      showErrorToast: false // We handle errors manually above
    }
  );
  
  const exportJSONMutation = useApiMutation(
    async () => {
      setExportProgress({ isExporting: true, format: 'JSON', progress: 30 });
      
      try {
        const result = await exportAPI.exportAsJSON();
        setExportProgress({ isExporting: true, format: 'JSON', progress: 100 });
        
        setTimeout(() => {
          setExportProgress({ isExporting: false, format: null, progress: 0 });
        }, 1000);
        
        return result;
      } catch (error) {
        setExportProgress({ isExporting: false, format: null, progress: 0 });
        
        if (error.response?.status === 404) {
          toastService.error('toast.error.noDataToExport');
        } else if (error.response?.status === 401) {
          toastService.unauthorized();
        } else if (error.response?.status === 429) {
          toastService.error('toast.error.exportLimitReached');
        } else {
          toastService.error('toast.error.exportFailed', { params: { format: 'JSON' } });
        }
        
        throw error;
      }
    },
    {
      onSuccess: () => {
        toastService.jsonExportCompleted();
      },
      showErrorToast: false
    }
  );
  
  const exportPDFMutation = useApiMutation(
    async () => {
      setExportProgress({ isExporting: true, format: 'PDF', progress: 30 });
      
      try {
        const result = await exportAPI.exportAsPDF();
        setExportProgress({ isExporting: true, format: 'PDF', progress: 100 });
        
        setTimeout(() => {
          setExportProgress({ isExporting: false, format: null, progress: 0 });
        }, 1000);
        
        return result;
      } catch (error) {
        setExportProgress({ isExporting: false, format: null, progress: 0 });
        
        if (error.response?.status === 501) {
          toastService.pdfExportComingSoon();
        } else if (error.response?.status === 404) {
          toastService.error('toast.error.noDataToExport');
        } else {
          toastService.error('toast.error.exportFailed', { params: { format: 'PDF' } });
        }
        
        throw error;
      }
    },
    {
      showErrorToast: false
    }
  );
  
  // ✅ FIX: Enhanced export functions with validation
  const exportAsCSV = useCallback(async () => {
    if (!isAuthenticated) {
      toastService.unauthorized();
      return;
    }
    
    try {
      return await exportCSVMutation.mutateAsync();
    } catch (error) {
      console.error('CSV export error:', error);
      throw error;
    }
  }, [isAuthenticated, exportCSVMutation]);
  
  const exportAsJSON = useCallback(async () => {
    if (!isAuthenticated) {
      toastService.unauthorized();
      return;
    }
    
    try {
      return await exportJSONMutation.mutateAsync();
    } catch (error) {
      console.error('JSON export error:', error);
      throw error;
    }
  }, [isAuthenticated, exportJSONMutation]);
  
  const exportAsPDF = useCallback(async () => {
    if (!isAuthenticated) {
      toastService.unauthorized();
      return;
    }
    
    // Check if PDF is available from server
    const pdfFormat = exportOptions.availableFormats?.find(f => f.format === 'pdf');
    if (pdfFormat && !pdfFormat.available) {
      toastService.pdfExportComingSoon();
      return;
    }
    
    try {
      return await exportPDFMutation.mutateAsync();
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  }, [isAuthenticated, exportOptions.availableFormats, exportPDFMutation]);
  
  // ✅ FIX: Better format availability check
  const isFormatAvailable = useCallback((format) => {
    if (!exportOptions.availableFormats) return format !== 'pdf'; // Default fallback
    
    const option = exportOptions.availableFormats.find(f => f.format === format);
    return option ? option.available : false;
  }, [exportOptions.availableFormats]);
  
  // Get format info
  const getFormatInfo = useCallback((format) => {
    return exportOptions.availableFormats?.find(f => f.format === format) || null;
  }, [exportOptions.availableFormats]);
  
  // Combined loading state
  const isExporting = exportCSVMutation.isLoading || 
                     exportJSONMutation.isLoading || 
                     exportPDFMutation.isLoading ||
                     exportProgress.isExporting;
  
  return {
    // Export functions
    exportAsCSV,
    exportAsJSON,
    exportAsPDF,
    
    // Export options
    exportOptions,
    availableFormats: exportOptions.availableFormats || [],
    dataIncluded: exportOptions.dataIncluded || [],
    userInfo: exportOptions.userInfo || {},
    limits: exportOptions.limits || {},
    privacyNote: exportOptions.privacyNote || 'Your data is exported securely.',
    
    // Loading states
    isLoadingOptions: exportOptionsQuery.isLoading,
    isExporting,
    exportProgress,
    
    // Error states
    error: exportOptionsQuery.error,
    
    // Utility functions
    isFormatAvailable,
    getFormatInfo,
    
    // User info for export
    exportUserInfo: {
      username: user?.username || 'user',
      email: user?.email || '',
      currency: user?.preferences?.currency || 'USD',
      language: user?.preferences?.language || 'en'
    }
  };
};

/**
 * Hook for export history (future feature)
 */
export const useExportHistory = () => {
  const [history, setHistory] = useState(() => {
    // Get from localStorage for now
    const saved = localStorage.getItem('exportHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  const addToHistory = useCallback((format) => {
    const newEntry = {
      id: Date.now(),
      format,
      date: new Date().toISOString(),
      size: null // Would come from server
    };
    
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem('exportHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('exportHistory');
  }, []);
  
  return {
    history,
    addToHistory,
    clearHistory
  };
};

/**
 * Hook for custom export configurations (future feature)
 */
export const useExportConfig = () => {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('exportConfig');
    return saved ? JSON.parse(saved) : {
      includeCategories: true,
      includeNotes: true,
      dateFormat: 'YYYY-MM-DD',
      amountFormat: 'decimal', // 'decimal' or 'cents'
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  });
  
  const updateConfig = useCallback((updates) => {
    setConfig(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('exportConfig', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const resetConfig = useCallback(() => {
    const defaultConfig = {
      includeCategories: true,
      includeNotes: true,
      dateFormat: 'YYYY-MM-DD',
      amountFormat: 'decimal',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    setConfig(defaultConfig);
    localStorage.setItem('exportConfig', JSON.stringify(defaultConfig));
  }, []);
  
  return {
    config,
    updateConfig,
    resetConfig
  };
};

// Export for components
export default useExport;