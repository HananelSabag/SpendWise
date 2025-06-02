/**
 * StatsChart Component
 * Historical data visualization
 * ADDRESSES GAP #5: Balance history and category breakdown charts
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { Card, Button, LoadingSpinner } from '../../ui';
import { TrendingUp, PieChart as PieIcon, BarChart as BarIcon, Calendar } from 'lucide-react';
import api from '../../../utils/api';

const StatsChart = ({ period = 'month' }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [chartType, setChartType] = useState('line');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch balance history
        const historyRes = await api.get(`/transactions/balance/history/${period}`);
        setData(historyRes.data.data);
        
        // Fetch category breakdown
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const categoryRes = await api.get('/transactions/categories/breakdown', {
          params: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
          }
        });
        setCategoryData(categoryRes.data.data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <Card className="p-8">
        <LoadingSpinner size="large" text={t('common.loading')} />
      </Card>
    );
  }

  const colors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  const formatTooltipValue = (value) => formatAmount(value);

  const formatXAxisTick = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
      month: 'short',
      year: period === 'year' ? 'numeric' : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Balance History Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('dashboard.charts.balanceHistory')}
          </h3>
          <div className="flex gap-2">
            {[
              { type: 'line', icon: TrendingUp },
              { type: 'bar', icon: BarIcon }
            ].map(({ type, icon: Icon }) => (
              <Button
                key={type}
                variant={chartType === type ? 'primary' : 'outline'}
                size="small"
                onClick={() => setChartType(type)}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatXAxisTick} />
              <YAxis tickFormatter={formatTooltipValue} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                name={t('transactions.income')}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                name={t('transactions.expense')}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                name={t('common.balance')}
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tickFormatter={formatXAxisTick} />
              <YAxis tickFormatter={formatTooltipValue} />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name={t('transactions.income')} />
              <Bar dataKey="expenses" fill="#ef4444" name={t('transactions.expense')} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Card>

      {/* Category Breakdown */}
      {categoryData && categoryData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('dashboard.charts.categoryBreakdown')}
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData.filter(cat => cat.expense_amount > 0)}
                dataKey="expense_amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${t(`categories.${name}`)} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryData
              .filter(cat => cat.expense_amount > 0)
              .sort((a, b) => b.expense_amount - a.expense_amount)
              .map((cat, index) => (
                <div key={cat.id} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {t(`categories.${cat.name}`)}: {formatAmount(cat.expense_amount)}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default StatsChart;