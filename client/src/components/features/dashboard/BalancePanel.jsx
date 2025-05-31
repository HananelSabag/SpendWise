import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const BalancePanel = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{t('home.balance.title')}</h2>
      {/* Balance content */}
    </div>
  );
};

export default BalancePanel;
