/**
 * 📥 EXPORT MODAL - SIMPLIFIED VERSION
 * Simple data export functionality
 * @version 3.0.0 - MAJOR SIMPLIFICATION
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, FileText, Database } from 'lucide-react';

import { useAuth, useNotifications } from '../../../stores';
import { Button, Card, LoadingSpinner } from '../../ui';
import { api } from '../../../api';

const ExportModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    { value: 'csv', label: 'CSV', description: 'Excel compatible spreadsheet format', icon: FileText },
    { value: 'json', label: 'JSON', description: 'Machine-readable data format', icon: Database },
    { value: 'pdf', label: 'PDF', description: 'Professional report with charts 🆕', icon: FileText, new: true }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // ✅ FIXED: Use correct API methods that align with server endpoints
      let response;
      if (selectedFormat === 'csv') {
        response = await api.export.exportAsCSV();
      } else if (selectedFormat === 'json') {
        response = await api.export.exportAsJSON();
      } else if (selectedFormat === 'pdf') {
        response = await api.export.exportAsPDF();
      }
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Export failed');
      }
      
      // ✅ FIXED: Handle server response correctly (server sends direct data)
      const data = response.data;
      const blob = new Blob([data], { 
        type: selectedFormat === 'csv' ? 'text/csv' : 
              selectedFormat === 'json' ? 'application/json' :
              selectedFormat === 'pdf' ? 'application/pdf' : 'text/plain'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spendwise-export-${user?.username || 'user'}-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        message: `${selectedFormat.toUpperCase()} export completed successfully!`
      });
      
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        message: error.message || 'Failed to export data'
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Data</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Format
              </label>
              <div className="space-y-2">
                {formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-colors relative ${
                        selectedFormat === format.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div className="text-left flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {format.label}
                            {format.new && (
                              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {format.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>

          {isExporting && (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Preparing your data...
              </span>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ExportModal;