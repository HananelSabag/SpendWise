/**
 * 💰 BALANCE DISPLAY - Main Balance Component
 * Extracted from BalancePanel.jsx for better performance and maintainability
 * Features: Main balance, Visibility toggle, Trend sparkline, Mobile-first
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw,
  DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ✅ Import Zustand stores
import {
  useTranslation,
  useCurrency,
  useTheme
} from '../../../../stores';

import { Button, Tooltip } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 🎯 Balance Trend Sparkline
 */
const BalanceTrendSparkline = ({ data, className = '' }) => {
  const { isDark } = useTheme();
  
  if (!data || data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const isPositiveTrend = data[data.length - 1] > data[0];

  return (
    <div className={cn("w-full h-8", className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.polyline
          points={points}
          fill="none"
          stroke={isPositiveTrend ? "#10B981" : "#EF4444"}
          strokeWidth="2"
          className="opacity-80"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`gradient-${isPositiveTrend ? 'positive' : 'negative'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositiveTrend ? "#10B981" : "#EF4444"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isPositiveTrend ? "#10B981" : "#EF4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <motion.polygon
          points={`${points} 100,100 0,100`}
          fill={`url(#gradient-${isPositiveTrend ? 'positive' : 'negative'})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        />
      </svg>
    </div>
  );
};

/**
 * 💰 Balance Display Main Component
 */
const BalanceDisplay = ({
  balance = 0,
  change = 0,
  trendData = [],
  period = 'month',
  showBalances = true,
  onToggleVisibility,
  onRefresh,
  isRefreshing = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();

  // Calculate trend direction
  const isPositiveChange = change > 0;
  const changePercentage = balance !== 0 ? Math.abs((change / balance) * 100) : 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl",
        className
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"
          style={{ backgroundSize: '200% 200%' }}
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('balance.totalBalance')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('balance.across')} {t('balance.allAccounts')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <Tooltip content={showBalances ? t('balance.hideBalances') : t('balance.showBalances')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50"
              >
                {showBalances ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </Tooltip>

            <Tooltip content={t('balance.refresh')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/50"
              >
                <RefreshCw className={cn(
                  "w-4 h-4",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
            </Tooltip>
          </div>
        </motion.div>

        {/* Main balance */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-baseline space-x-4">
            <motion.div
              key={showBalances ? balance : 'hidden'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
            >
              {showBalances ? formatCurrency(balance) : '••••••'}
            </motion.div>

            {/* Change indicator */}
            {change !== 0 && showBalances && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium",
                  isPositiveChange 
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                )}
              >
                {isPositiveChange ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>
                  {isPositiveChange ? '+' : ''}{formatCurrency(change)}
                </span>
                <span className="text-xs opacity-75">
                  ({changePercentage.toFixed(1)}%)
                </span>
              </motion.div>
            )}
          </div>

          <motion.p 
            variants={itemVariants}
            className="text-gray-600 dark:text-gray-400 mt-2"
          >
            {t('balance.comparedTo')} {t(`balance.last${period.charAt(0).toUpperCase() + period.slice(1)}`)}
          </motion.p>
        </motion.div>

        {/* Trend visualization */}
        {trendData.length > 1 && showBalances && (
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('balance.trendOverview')}
              </h3>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <TrendingUp className="w-3 h-3" />
                <span>{t('balance.last30Days')}</span>
              </div>
            </div>

            <div className="h-12 relative">
              <BalanceTrendSparkline data={trendData} />
            </div>

            {/* Data points summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20 dark:border-gray-700/50">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Math.min(...trendData))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('balance.minimum')}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Math.max(...trendData))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('balance.maximum')}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(trendData.reduce((a, b) => a + b, 0) / trendData.length)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('balance.average')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BalanceDisplay;
export { BalanceTrendSparkline }; 