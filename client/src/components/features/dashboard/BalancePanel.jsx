/**
 * 💰 BALANCE PANEL - SIMPLIFIED & ALIGNED
 * Clean balance panel using dedicated balance endpoint
 * Features: Real-time data, Period switching, Server-calculated balances
 * @version 3.0.0 - COMPLETE REWRITE
 */

import React, { useState, useCallback, useMemo } from 'react';
import { RefreshCw, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation, useNotifications, useCurrency } from '../../../stores';
import { Button, Card, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';

// ✅ Import the new dedicated balance hook
import { useBalance } from '../../../hooks';

/**
 * 💰 Balance Panel Main Component
 */
const BalancePanel = ({
  className = '',
  showDetails = true,
  onToggleDetails
}) => {
  // ✅ Stores
  const { t, isRTL } = useTranslation('dashboard');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  // ✅ Use the dedicated balance hook
  const {
    data: balanceData,
    metadata,
    loading,
    error,
    refresh,
    isReady,
    isEmpty
  } = useBalance({
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  // ✅ State management
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [showBalances, setShowBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      addNotification({
        type: 'success',
        title: t('balance.refreshed'),
        message: t('balance.dataUpdated'),
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('balance.refreshFailed'),
        message: error.message || t('balance.tryAgain'),
        duration: 5000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, addNotification, t]);

  // ✅ Get current period data
  const currentPeriodData = useMemo(() => {
    if (!balanceData || !balanceData[selectedPeriod]) {
      return { income: 0, expenses: 0, total: 0 };
    }
    return balanceData[selectedPeriod];
  }, [balanceData, selectedPeriod]);

  // ✅ Period options
  const periodOptions = [
    { key: 'daily', label: t('periods.daily'), icon: '📅' },
    { key: 'weekly', label: t('periods.weekly'), icon: '📆' },
    { key: 'monthly', label: t('periods.monthly'), icon: '🗓️' },
    { key: 'yearly', label: t('periods.yearly'), icon: '📊' }
  ];

  // ✅ Loading state
  if (loading && !balanceData) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center min-h-[200px]">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">{t('balance.loading')}</span>
        </div>
      </Card>
    );
  }

  // ✅ Error state
  if (error && !balanceData) {
    return (
      <Card className={cn('p-6 border-red-200 bg-red-50', className)}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('balance.error')}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  // ✅ Empty state
  if (isEmpty) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500">
          <p>{t('balance.noData')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
          {t('balance.title')}
        </h2>
          
          <div className="flex items-center gap-2">
            {/* Toggle visibility */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="text-gray-600 hover:text-gray-900"
            >
              {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            
            {/* Refresh button */}
        <Button
          variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className={cn(
                'w-4 h-4',
                (isRefreshing || loading) && 'animate-spin'
              )} />
        </Button>
          </div>
      </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.key)}
              className="text-xs"
            >
              <span className="mr-1">{period.icon}</span>
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Balance Display */}
      <div className="px-6 pb-6">
        {showBalances ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">
            {t('balance.income')}
                </span>
                <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(currentPeriodData.income)}
          </div>
        </div>

        {/* Expenses */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">
            {t('balance.expenses')}
                </span>
                <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(currentPeriodData.expenses)}
          </div>
        </div>

            {/* Total/Net */}
        <div className={cn(
              'border rounded-lg p-4',
              currentPeriodData.total >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-orange-50 border-orange-200'
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-sm font-medium',
                  currentPeriodData.total >= 0 ? 'text-blue-700' : 'text-orange-700'
                )}>
                  {t('balance.total')}
                </span>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  currentPeriodData.total >= 0 ? 'bg-blue-600' : 'bg-orange-600'
                )} />
              </div>
          <div className={cn(
                'text-2xl font-bold',
                currentPeriodData.total >= 0 ? 'text-blue-900' : 'text-orange-900'
              )}>
                {formatCurrency(currentPeriodData.total)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('balance.hidden')}</p>
          </div>
        )}

        {/* Metadata Display (Debug Info) */}
        {showDetails && metadata && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span className="font-medium">{t('balance.currentDay')}:</span> {metadata.currentDay}
              </div>
              <div>
                <span className="font-medium">{t('balance.daysInMonth')}:</span> {metadata.daysInMonth}
              </div>
              <div>
                <span className="font-medium">{t('balance.weekElapsed')}:</span> {metadata.daysElapsedInWeek}
              </div>
              <div>
                <span className="font-medium">{t('balance.lastUpdate')}:</span> 
                {new Date(metadata.currentDate).toLocaleTimeString()}
        </div>
      </div>
        </div>
        )}
      </div>
    </Card>
  );
};

export default BalancePanel;