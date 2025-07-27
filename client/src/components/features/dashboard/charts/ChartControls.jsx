/**
 * 🎮 CHART CONTROLS - Chart Type & Animation Controls
 * Extracted from StatsChart.jsx for better performance and maintainability
 * Features: Chart type switching, Animation controls, Export functionality
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, PieChart as PieIcon, Activity, TrendingUp,
  Play, Pause, RotateCcw, Download, Settings, 
  Maximize2, Minimize2, Filter, Eye, EyeOff,
  Share, Save, Camera, FileText, Image
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation, useNotifications } from '../../../../stores';

import { Button, Dropdown, Badge, Tooltip } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🎨 Chart Type Selector
 */
const ChartTypeSelector = ({ 
  currentType, 
  onTypeChange, 
  availableTypes = ['line', 'bar', 'area', 'pie'],
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');

  const chartTypeConfigs = {
    line: { 
      icon: Activity, 
      label: t('charts.types.line'),
      color: 'text-blue-600',
      description: t('charts.types.lineDesc')
    },
    bar: { 
      icon: BarChart3, 
      label: t('charts.types.bar'),
      color: 'text-green-600',
      description: t('charts.types.barDesc')
    },
    area: { 
      icon: TrendingUp, 
      label: t('charts.types.area'),
      color: 'text-purple-600',
      description: t('charts.types.areaDesc')
    },
    pie: { 
      icon: PieIcon, 
      label: t('charts.types.pie'),
      color: 'text-orange-600',
      description: t('charts.types.pieDesc')
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('charts.type')}:
      </span>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {availableTypes.map((type) => {
          const config = chartTypeConfigs[type];
          const Icon = config.icon;
          
          return (
            <Tooltip key={type} content={config.description}>
              <button
                onClick={() => onTypeChange(type)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md transition-all",
                  currentType === type
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ⏯️ Animation Controls
 */
const AnimationControls = ({
  isPlaying,
  onPlay,
  onPause,
  onRestart,
  showAnimations = true,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  if (!showAnimations) return null;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('charts.animation')}:
      </span>
      <div className="flex items-center space-x-1">
        <Tooltip content={isPlaying ? t('charts.pause') : t('charts.play')}>
          <Button
            size="sm"
            variant="outline"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </Tooltip>
        
        <Tooltip content={t('charts.restart')}>
          <Button
            size="sm"
            variant="outline"
            onClick={onRestart}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

/**
 * 📤 Export Controls
 */
const ExportControls = ({
  onExport,
  isExporting = false,
  exportFormats = ['png', 'pdf', 'csv', 'json'],
  className = ''
}) => {
  const { t } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const formatConfigs = {
    png: { icon: Image, label: 'PNG', description: t('export.pngDesc') },
    pdf: { icon: FileText, label: 'PDF', description: t('export.pdfDesc') },
    csv: { icon: FileText, label: 'CSV', description: t('export.csvDesc') },
    json: { icon: FileText, label: 'JSON', description: t('export.jsonDesc') }
  };

  const handleExport = useCallback(async (format) => {
    try {
      await onExport?.(format);
      setShowExportDropdown(false);
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('export.failed')
      });
    }
  }, [onExport, addNotification, t]);

  return (
    <div className={cn("relative", className)}>
      <Tooltip content={t('charts.export')}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowExportDropdown(!showExportDropdown)}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {t('common.export')}
        </Button>
      </Tooltip>

      <AnimatePresence>
        {showExportDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-2">
              {exportFormats.map((format) => {
                const config = formatConfigs[format];
                const Icon = config.icon;
                
                return (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 🔧 View Controls
 */
const ViewControls = ({
  isFullscreen,
  onToggleFullscreen,
  showFilter = true,
  onToggleFilter,
  filterActive = false,
  className = ''
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {showFilter && (
        <Tooltip content={t('charts.filter')}>
          <Button
            size="sm"
            variant={filterActive ? "default" : "outline"}
            onClick={onToggleFilter}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      
      <Tooltip content={isFullscreen ? t('charts.exitFullscreen') : t('charts.fullscreen')}>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </Tooltip>
    </div>
  );
};

/**
 * 🎮 Complete Chart Controls
 */
const ChartControls = ({
  // Chart type props
  chartType,
  onChartTypeChange,
  availableChartTypes,
  
  // Animation props
  isPlaying,
  onPlay,
  onPause,
  onRestart,
  showAnimations,
  
  // Export props
  onExport,
  isExporting,
  exportFormats,
  
  // View props
  isFullscreen,
  onToggleFullscreen,
  showFilter,
  onToggleFilter,
  filterActive,
  
  className = ''
}) => {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg", className)}>
      {/* Left side - Chart type */}
      <ChartTypeSelector
        currentType={chartType}
        onTypeChange={onChartTypeChange}
        availableTypes={availableChartTypes}
      />

      {/* Right side - Controls */}
      <div className="flex items-center space-x-4">
        <AnimationControls
          isPlaying={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onRestart={onRestart}
          showAnimations={showAnimations}
        />
        
        <ViewControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          showFilter={showFilter}
          onToggleFilter={onToggleFilter}
          filterActive={filterActive}
        />
        
        <ExportControls
          onExport={onExport}
          isExporting={isExporting}
          exportFormats={exportFormats}
        />
      </div>
    </div>
  );
};

export default ChartControls;
export { ChartTypeSelector, AnimationControls, ExportControls, ViewControls }; 