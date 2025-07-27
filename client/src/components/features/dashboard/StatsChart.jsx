/**
 * 📊 STATS CHART - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Component orchestration, State management, Performance optimized
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Brain } from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications
} from '../../../stores';

// ✅ Import extracted components
import ChartControls from './charts/ChartControls';
import ChartRenderer from './charts/ChartRenderer';
import StatisticsGrid, { PerformanceSummary, useStatistics } from './charts/ChartStatistics';
import AIInsightsPanel, { DataLegend } from './charts/ChartInsights';

import { Card } from '../../ui';
import { cn } from '../../../utils/helpers';

/**
 * 📊 Main Stats Chart Component
 */
const StatsChart = ({
  data = [],
  timeRange = '30d',
  showAIInsights = true,
  showStatistics = true,
  showControls = true,
  initialChartType = 'line',
  initialMetrics = ['income', 'expenses', 'net'],
  onExport,
  className = ''
}) => {
  // ✅ Zustand stores
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  // ✅ Chart state
  const [chartType, setChartType] = useState(initialChartType);
  const [selectedMetrics, setSelectedMetrics] = useState(initialMetrics);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ Animation settings
  const [animationSettings, setAnimationSettings] = useState({
    enabled: true,
    speed: 1,
    showPredictions: true
  });

  // ✅ Refs
  const chartRef = useRef(null);

  // ✅ Available chart types and metrics
  const availableChartTypes = ['line', 'bar', 'area', 'pie', 'composed'];
  const availableMetrics = [
    { id: 'income', label: t('metrics.income'), color: '#10B981', darkColor: '#34D399' },
    { id: 'expenses', label: t('metrics.expenses'), color: '#EF4444', darkColor: '#F87171' },
    { id: 'net', label: t('metrics.net'), color: '#3B82F6', darkColor: '#60A5FA' }
  ];

  // ✅ Process data with predictions
  const processedData = useMemo(() => {
    if (!data.length) return [];

    let result = [...data];

    // Add AI predictions if enabled
    if (animationSettings.showPredictions && data.length > 0) {
      const lastDataPoint = data[data.length - 1];
      const predictions = [];
      
      for (let i = 1; i <= 7; i++) {
        const predictionPoint = {
          ...lastDataPoint,
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isPrediction: true
        };
        
        // Simple prediction logic (can be enhanced with ML)
        selectedMetrics.forEach(metric => {
          const trend = data.length > 1 ? 
            (data[data.length - 1][metric] - data[data.length - 2][metric]) : 0;
          predictionPoint[metric] = Math.max(0, lastDataPoint[metric] + (trend * i * 0.8));
        });
        
        predictions.push(predictionPoint);
      }
      
      result = [...result, ...predictions];
    }

    return result;
  }, [data, animationSettings.showPredictions, selectedMetrics]);

  // ✅ Calculate statistics
  const statistics = useStatistics(processedData, selectedMetrics);

  // ✅ Color scheme based on theme
  const colors = useMemo(() => {
    return availableMetrics.reduce((acc, metric) => ({
      ...acc,
      [metric.id]: isDark ? metric.darkColor : metric.color
    }), {});
  }, [isDark, availableMetrics]);

  // ✅ Handle chart type change
  const handleChartTypeChange = useCallback((newType) => {
    setChartType(newType);
    addNotification({
      type: 'info',
      message: t('charts.typeChanged', { type: newType })
    });
  }, [addNotification, t]);

  // ✅ Handle metric toggle
  const handleMetricToggle = useCallback((metricId) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  }, []);

  // ✅ Animation controls
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleRestart = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // ✅ Export functionality
  const handleExport = useCallback(async (format) => {
    setIsExporting(true);
    
    try {
      const exportData = {
        data: processedData,
        chartType,
        timeRange,
        selectedMetrics,
        statistics,
        format
      };

      if (onExport) {
        await onExport(exportData);
      }
      
      addNotification({
        type: 'success',
        message: t('export.success', { format: format.toUpperCase() })
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('export.failed')
      });
    } finally {
      setIsExporting(false);
    }
  }, [processedData, chartType, timeRange, selectedMetrics, statistics, onExport, addNotification, t]);

  // ✅ View controls
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleToggleFilter = useCallback(() => {
    setShowFilter(prev => !prev);
  }, []);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
    >
      {/* ✅ Chart Controls */}
      {showControls && (
        <motion.div variants={itemVariants}>
          <ChartControls
            chartType={chartType}
            onChartTypeChange={handleChartTypeChange}
            availableChartTypes={availableChartTypes}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onRestart={handleRestart}
            showAnimations={animationSettings.enabled}
            onExport={handleExport}
            isExporting={isExporting}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            showFilter={true}
            onToggleFilter={handleToggleFilter}
            filterActive={showFilter}
          />
        </motion.div>
      )}

      {/* ✅ Statistics Grid */}
      {showStatistics && (
        <motion.div variants={itemVariants}>
          <StatisticsGrid
            data={processedData}
            selectedMetrics={selectedMetrics}
            showPerformance={true}
          />
        </motion.div>
      )}

      {/* ✅ Main Chart */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 relative">
          {processedData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('charts.noData')}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {t('charts.noDataDescription')}
              </p>
            </div>
          ) : (
            <div 
              className={cn(
                "transition-all duration-300",
                isFullscreen ? "h-[calc(100vh-300px)]" : "h-96"
              )} 
              ref={chartRef}
            >
              <ChartRenderer
                chartType={chartType}
                data={processedData}
                selectedMetrics={selectedMetrics}
                colors={colors}
                formatCurrency={formatCurrency}
                showGrid={true}
                showBrush={chartType === 'line'}
                height="100%"
              />
            </div>
          )}

          {/* ✅ AI insights overlay */}
          {animationSettings.showPredictions && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {t('charts.aiPowered')}
                </span>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ✅ Data Legend */}
      <motion.div variants={itemVariants}>
        <DataLegend
          selectedMetrics={selectedMetrics}
          colors={colors}
          showPredictions={animationSettings.showPredictions}
          dataPoints={processedData.filter(d => !d.isPrediction).length}
          predictionPoints={processedData.filter(d => d.isPrediction).length}
        />
      </motion.div>

      {/* ✅ Performance Summary */}
      {showStatistics && (
        <motion.div variants={itemVariants}>
          <PerformanceSummary
            data={processedData}
            selectedMetrics={selectedMetrics}
          />
        </motion.div>
      )}

      {/* ✅ AI Insights Panel */}
      <AnimatePresence>
        {showAIInsights && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <AIInsightsPanel
              data={processedData}
              selectedMetrics={selectedMetrics}
              statistics={statistics}
              showAIInsights={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StatsChart;