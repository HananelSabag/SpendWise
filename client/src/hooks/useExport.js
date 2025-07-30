/**
 * 📤 useExport Hook - Simplified Export Management
 * Features: Direct API integration for CSV/JSON/PDF export
 * @version 3.0.0 - SIMPLIFIED & ALIGNED
 */

import { useState, useCallback } from 'react';

// ✅ Import unified API
import { api } from '../api';

// ✅ Import from Zustand stores
import { useAuth, useNotifications } from '../stores';

export const useExport = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [isExporting, setIsExporting] = useState(false);

  // ✅ SIMPLIFIED: Direct export functions that match ExportModal usage
  const exportData = useCallback(async (format) => {
    setIsExporting(true);
    try {
      let response;
      
      if (format === 'csv') {
        response = await api.export.exportAsCSV();
      } else if (format === 'json') {
        response = await api.export.exportAsJSON();
      } else if (format === 'pdf') {
        response = await api.export.exportAsPDF();
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Export failed');
      }
      
      // Show success notification
      addNotification({
        type: 'success',
        message: `${format.toUpperCase()} export completed successfully!`
      });
      
      return response.data;
    } catch (error) {
      // Show error notification
      addNotification({
        type: 'error',
        message: error.message || 'Export failed'
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [addNotification]);

  // ✅ SIMPLIFIED: Helper function to trigger download with proper blob handling
  const triggerDownload = useCallback((data, filename, format) => {
    try {
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'json' ? 'application/json' :
              format === 'pdf' ? 'application/pdf' : 'text/plain'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `spendwise-export-${user?.username || 'user'}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      addNotification({
        type: 'error',
        message: 'Download failed'
      });
    }
  }, [user?.username, addNotification]);

  return {
    // ✅ Main export function (matches ExportModal usage)
    exportData,
    
    // ✅ Individual format functions for flexibility
    exportAsCSV: () => exportData('csv'),
    exportAsJSON: () => exportData('json'),
    exportAsPDF: () => exportData('pdf'),
    
    // ✅ Status
    isExporting,
    
    // ✅ Utilities
    triggerDownload
  };
};

export default useExport;