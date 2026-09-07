/**
 * GroceryHistorySheet — past shops, on demand.
 *
 * History used to own half of the page's chrome: a full-width tab bar sat above
 * the list at all times so you could reach a screen you look at maybe once a
 * month. On a phone that bar plus the header plus the bottom nav left the list
 * itself less than it deserved. It is now one small icon in the header row, and
 * this sheet is what it opens.
 *
 * The sheet leads with the numbers you actually come here for — how many shops,
 * how much they came to, how many kept a receipt — and only then the trips
 * themselves.
 */

import React, { useMemo } from 'react';
import { Receipt, ShoppingBag, Wallet } from 'lucide-react';
import BottomSheet from '../../common/BottomSheet';
import { currency } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';
import { useGroceryHistory } from '../../../hooks/useGroceryHistory';
import GroceryHistoryPanel from './GroceryHistoryPanel';

const Stat = ({ icon: Icon, value, label }) => (
  <div className="flex-1 rounded-2xl border border-gray-100 px-2.5 py-2.5 text-center dark:border-gray-700">
    <Icon className="mx-auto mb-1 h-4 w-4 text-gray-400" />
    <p className="truncate text-sm font-extrabold tabular-nums text-gray-900 dark:text-gray-50">
      {value}
    </p>
    <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {label}
    </p>
  </div>
);

const GroceryHistorySheet = ({ isOpen, onClose }) => {
  const { t } = useTranslation('grocery');
  const { trips, total } = useGroceryHistory({ enabled: isOpen });

  const summary = useMemo(() => {
    const withTotal = trips.filter((trip) => trip.total_ils != null);
    return {
      spent: withTotal.reduce((sum, trip) => sum + Number(trip.total_ils), 0),
      priced: withTotal.length,
      receipts: trips.filter((trip) => trip.has_receipt).length,
      // The API returns a page, not everything. Saying "₪1,240" over a partial
      // page would be a wrong number stated confidently.
      partial: total > trips.length,
    };
  }, [trips, total]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('history.title')} height="full">
      <div className="px-4 pb-6 pt-3">
        {trips.length > 0 && (
          <>
            <div className="mb-2 flex gap-2">
              <Stat
                icon={ShoppingBag}
                value={total}
                label={t('history.statTrips')}
              />
              <Stat
                icon={Wallet}
                value={summary.priced > 0 ? currency.format(summary.spent) : '—'}
                label={t('history.statSpent')}
              />
              <Stat
                icon={Receipt}
                value={summary.receipts}
                label={t('history.statReceipts')}
              />
            </div>

            <p className="mb-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              {summary.partial
                ? t('history.statScopePartial', { count: trips.length })
                : t('history.statScope', { count: summary.priced })}
            </p>
          </>
        )}

        <GroceryHistoryPanel active={isOpen} />
      </div>
    </BottomSheet>
  );
};

export default GroceryHistorySheet;
