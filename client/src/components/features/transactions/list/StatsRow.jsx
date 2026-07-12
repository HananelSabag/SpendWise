/**
 * StatsRow — count / income / expenses / signed net for the WHOLE filtered
 * set (server-computed), not just the loaded pages.
 */

import React from 'react';
import { useTranslation } from '../../../../stores';
import { cn } from '../../../../utils/helpers';

const StatsRow = ({ summary, formatCurrency }) => {
  const { t } = useTranslation('transactions');
  const net = summary.net;
  const items = [
    { label: t('title') || 'Transactions', value: summary.count },
    { label: t('stats.inflows', { fallback: 'Inflows' }), value: formatCurrency(summary.totalIncome), color: 'green' },
    { label: t('stats.outflows', { fallback: 'Outflows' }), value: formatCurrency(summary.totalExpenses), color: 'red' },
    // Signed net of the filtered set — clearer than the old "bank-synced %"
    // (whose numbers only covered the loaded pages anyway).
    { label: t('stats.net', 'Net'), value: `${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net))}`, color: net >= 0 ? 'green' : 'red' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className={cn('text-base font-bold',
            color === 'green' && 'text-green-600 dark:text-green-400',
            color === 'red' && 'text-red-600 dark:text-red-400',
            !color && 'text-gray-900 dark:text-white',
          )}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
