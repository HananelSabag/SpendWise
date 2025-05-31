import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import TransactionCard from './TransactionCard';

const TransactionList = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Transaction list content */}
    </div>
  );
};

export default TransactionList;
