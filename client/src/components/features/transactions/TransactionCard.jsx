import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const TransactionCard = ({ transaction }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {/* Transaction card content */}
    </div>
  );
};

export default TransactionCard;
