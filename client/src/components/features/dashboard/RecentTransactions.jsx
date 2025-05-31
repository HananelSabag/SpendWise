import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const RecentTransactions = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t('home.transactions.recent')}</h2>
      {/* Recent transactions list */}
    </div>
  );
};

export default RecentTransactions;
