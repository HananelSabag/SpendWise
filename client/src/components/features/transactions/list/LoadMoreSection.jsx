/**
 * LoadMoreSection — infinite-scroll sentinel + manual load-more button +
 * "all loaded" footer.
 */

import React from 'react';
import { ChevronDown, CheckCircle } from 'lucide-react';

import { useTranslation } from '../../../../stores';
import { Button } from '../../../ui';

const LoadMoreSection = ({ loadMoreRef, isFetchingNextPage, hasMore, count, onLoadMore }) => {
  const { t } = useTranslation('transactions');
  return (
    <div ref={loadMoreRef} className="mt-6">
      {isFetchingNextPage ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : hasMore ? (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={onLoadMore}
            className="px-8 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
            <ChevronDown className="w-4 h-4 me-2" />
            {t('loadMore') || 'Load More'}
          </Button>
        </div>
      ) : count > 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-500 dark:text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm">{t('allLoaded', { count }) || `All ${count} transactions loaded`}</span>
        </div>
      ) : null}
    </div>
  );
};

export default LoadMoreSection;
