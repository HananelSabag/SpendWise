import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const TransactionFilters = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">{t('transactions.filters.title')}</h3>
      {/* Filters content */}
    </div>
  );
};

export default TransactionFilters;
