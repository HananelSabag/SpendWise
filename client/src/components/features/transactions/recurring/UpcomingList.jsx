import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trash2, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { Button, Card, LoadingSpinner, Badge } from '../../../ui';
import { useTranslation } from '../../../../stores';
import { cn, dateHelpers } from '../../../../utils/helpers';

const UpcomingList = ({ upcoming = [], isLoading = false, onDeleteUpcoming, onRefetch, formatCurrency }) => {
  const { t } = useTranslation('transactions');
  const [range, setRange] = useState('30'); // 7 | 30 | 90 | 365

  const now = new Date();
  const rangeDays = parseInt(range, 10) || 30;
  const filtered = useMemo(() => {
    const end = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000);
    return (upcoming || [])
      .filter((tx) => {
        const d = new Date(tx.date);
        return d >= now && d <= end;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [upcoming, rangeDays]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <LoadingSpinner size="lg" />
        <span className="ml-3">{t('upcoming.loading', 'Loading upcoming transactions...')}</span>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('upcoming.noUpcoming', 'No Upcoming Transactions')}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Range controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">{t('upcoming.showingNextRange', 'Showing next')}</span>
        {[7, 30, 90, 365].map((d) => (
          <Button key={d} variant={rangeDays === d ? 'primary' : 'outline'} size="sm" onClick={() => setRange(String(d))}>
            {d === 7 ? '7D' : d === 30 ? '30D' : d === 90 ? '3M' : '1Y'}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={onRefetch}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((tx, idx) => (
            <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">{tx.template_name || tx.description || t('recurring.noDescription', 'Recurring')}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{dateHelpers.formatMedium(tx.date)}</span>
                    {tx.category_name && <><span>•</span><span className="truncate">{tx.category_name}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn('font-semibold', tx.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount || 0))}
                </div>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDeleteUpcoming(tx.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default UpcomingList;


