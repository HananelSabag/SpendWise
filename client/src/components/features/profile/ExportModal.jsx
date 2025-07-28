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
    { value: 'csv', label: 'CSV', description: 'Excel compatible format', icon: FileText },
    { value: 'json', label: 'JSON', description: 'Raw data format', icon: Database }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.export.exportTransactions(selectedFormat);
      
      // Create download
      const blob = new Blob([response.data], { 
        type: selectedFormat === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spendwise-data-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        message: 'Data exported successfully!'
      });
      
      onClose();
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to export data'
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
                      className={`w-full p-3 rounded-lg border-2 transition-colors ${
                        selectedFormat === format.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {format.label}
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