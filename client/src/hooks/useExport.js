/**
 * 📤 useExport Hook - Simplified Export Management
 * Features: Direct API integration for CSV/JSON/PDF export
 * @version 3.1.0 - FIXED: download actually triggers
 */

import { useState, useCallback } from 'react';

import { api } from '../api';
import { useAuth, useNotifications } from '../stores';

export const useExport = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [isExporting, setIsExporting] = useState(false);

  // ✅ Must be declared before exportData (used in its closure)
  const triggerDownload = useCallback((data, filename, format) => {
    try {
      // PDF arrives as a Blob already; CSV/JSON as text
      const blob = data instanceof Blob
        ? data
        : new Blob([data], {
            type: format === 'csv'  ? 'text/csv'
                : format === 'json' ? 'application/json'
                : format === 'pdf'  ? 'application/pdf'
                : 'text/plain'
          });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      addNotification({ type: 'error', message: 'Download failed' });
    }
  }, [addNotification]);

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

      const username = user?.username || 'user';
      const date = new Date().toISOString().split('T')[0];
      const filename = `spendwise-${username}-${date}.${format}`;

      let downloadData = response.data;
      // JSON is parsed by axios — re-stringify it for the file
      if (format === 'json' && typeof downloadData === 'object' && !(downloadData instanceof Blob)) {
        downloadData = JSON.stringify(downloadData, null, 2);
      }

      triggerDownload(downloadData, filename, format);

      addNotification({
        type: 'success',
        message: `${format.toUpperCase()} export downloaded successfully!`
      });

      return response.data;
    } catch (error) {
      addNotification({ type: 'error', message: error.message || 'Export failed' });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [addNotification, triggerDownload, user?.username]);

  return {
    exportData,
    exportAsCSV:  () => exportData('csv'),
    exportAsJSON: () => exportData('json'),
    exportAsPDF:  () => exportData('pdf'),
    isExporting,
    triggerDownload
  };
};

export default useExport;
