import React from 'react';
import { FileSpreadsheet, Braces, FileText, Download } from 'lucide-react';
import useExport from '../../../hooks/useExport';
import { LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';

export const ExportTab = ({ t }) => {
  const { exportAsCSV, exportAsJSON, exportAsPDF, isExporting } = useExport();

  const exports = [
    { label: t('export.csvLabel')  || 'Export as CSV',  desc: t('export.csvDesc')  || 'Spreadsheet format for Excel / Google Sheets', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', action: exportAsCSV  },
    { label: t('export.jsonLabel') || 'Export as JSON', desc: t('export.jsonDesc') || 'Raw data format for developers',               icon: Braces,          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400',   action: exportAsJSON },
    { label: t('export.pdfLabel')  || 'Export as PDF',  desc: t('export.pdfDesc')  || 'Formatted report ready to print or share',     icon: FileText,        color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',             action: exportAsPDF  },
  ];

  return (
    <div className="space-y-3">
      {exports.map(({ label, desc, icon: Icon, color, action }) => (
        <button
          key={label}
          onClick={action}
          disabled={isExporting}
          className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-800 transition-all duration-150 text-start cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105', color.split(' ').slice(1).join(' '))}>
            <Icon className={cn('w-5 h-5', color.split(' ')[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
          </div>
          {isExporting
            ? <LoadingSpinner size="sm" />
            : <Download className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors duration-150" />}
        </button>
      ))}
    </div>
  );
};

export default ExportTab;
