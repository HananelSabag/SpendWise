/**
 * 🎯 CHART TOOLTIP - Interactive Chart Tooltip Component
 * Extracted from StatsChart.jsx for better performance and maintainability
 * Features: Interactive tooltips, AI insights, Multi-format data display
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Interactive Custom Tooltip
 */
const ChartTooltip = ({ 
  active, 
  payload, 
  label, 
  chartType, 
  formatCurrency, 
  showAIInsights = true,
  className = '' 
}) => {
  const { t } = useTranslation('dashboard');

  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[200px] z-50",
        className
      )}
    >
      {/* Tooltip Header */}
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
        {label}
      </div>
      
      {/* Data Points */}
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t(`metrics.${entry.dataKey}`) || entry.dataKey}
              </span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      {showAIInsights && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
            <Brain className="w-3 h-3" />
            <span>{t('charts.aiInsight')}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('charts.tooltipAIHint')}
          </p>
        </div>
      )}
    </motion.div>
  );
};

/**
 * 📊 Simple Tooltip (for basic charts)
 */
const SimpleTooltip = ({ 
  active, 
  payload, 
  label, 
  formatCurrency,
  className = '' 
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
      className
    )}>
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
          <span style={{ color: entry.color }}>●</span>{' '}
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

/**
 * 💼 Custom Tooltip Factory
 */
const createCustomTooltip = (options = {}) => {
  const {
    formatCurrency,
    showAIInsights = true,
    chartType = 'line',
    simple = false
  } = options;

  return ({ active, payload, label }) => {
    if (simple) {
      return (
        <SimpleTooltip
          active={active}
          payload={payload}
          label={label}
          formatCurrency={formatCurrency}
        />
      );
    }

    return (
      <ChartTooltip
        active={active}
        payload={payload}
        label={label}
        chartType={chartType}
        formatCurrency={formatCurrency}
        showAIInsights={showAIInsights}
      />
    );
  };
};

export default ChartTooltip;
export { SimpleTooltip, createCustomTooltip }; 