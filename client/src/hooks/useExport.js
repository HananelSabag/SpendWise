/**
 * useExport Hook - Complete Data Export Management
 * Handles CSV, JSON, and PDF exports with progress tracking
 */

import { useState, useCallback } from 'react';
import { useApiQuery, useApiMutation } from './useApi';
import { exportAPI, queryKeys } from '../utils/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

/**
 * Main export hook with progress tracking
 */
export const useExport = () => {
  const { isAuthenticated, user } = useAuth();
  const [exportProgress, setExportProgress] = useState({
    isExporting: false,
    format: null,
    progress: 0
  });
  
  // Export options query
  const exportOptionsQuery = useApiQuery(
    queryKeys.exportOptions,
    () => exportAPI.getOptions(),
    {
      config: 'static',
      enabled: isAuthenticated,
      staleTime: 60 * 60 * 1000 // 1 hour
    }
  );
  
  // Process export options
  const exportOptions = exportOptionsQuery.data?.data || {
    availableFormats: [],
    dataIncluded: [],
    userInfo: {},
    limits: {},
    privacyNote: ''
  };
  
  // Export as CSV
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
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast.success('CSV export completed successfully!');
      },
      onError: (error) => {
        if (error.response?.status === 404) {
          toast.error('No data available to export');
        } else {
          toast.error('CSV export failed');
        }
      }
    }
  );
  
  // Export as JSON
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
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast.success('JSON export completed successfully!');
      },
      onError: (error) => {
        if (error.response?.status === 404) {
          toast.error('No data available to export');
        } else {
          toast.error('JSON export failed');
        }
      }
    }
  );
  
  // Export as PDF
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
        throw error;
      }
    },
    {
      onSuccess: () => {
        toast.success('PDF export completed successfully!');
      },
      onError: (error) => {
        if (error.response?.status === 501) {
          // Already handled by exportAPI
        } else if (error.response?.status === 404) {
          toast.error('No data available to export');
        } else {
          toast.error('PDF export failed');
        }
      }
    }
  );
  
  // Export functions
  const exportAsCSV = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to export data');
      return;
    }
    
    return exportCSVMutation.mutateAsync();
  }, [isAuthenticated, exportCSVMutation]);
  
  const exportAsJSON = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to export data');
      return;
    }
    
    return exportJSONMutation.mutateAsync();
  }, [isAuthenticated, exportJSONMutation]);
  
  const exportAsPDF = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to export data');
      return;
    }
    
    // Check if PDF is available
    const pdfOption = exportOptions.availableFormats?.find(f => f.format === 'pdf');
    if (pdfOption && !pdfOption.available) {
      toast.info('PDF export coming soon! Please use CSV or JSON for now.');
      return;
    }
    
    return exportPDFMutation.mutateAsync();
  }, [isAuthenticated, exportOptions.availableFormats, exportPDFMutation]);
  
  // Check format availability
  const isFormatAvailable = useCallback((format) => {
    const option = exportOptions.availableFormats?.find(f => f.format === format);
    return option?.available || false;
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
    privacyNote: exportOptions.privacyNote || '',
    
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