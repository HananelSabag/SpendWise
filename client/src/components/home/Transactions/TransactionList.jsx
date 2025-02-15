// TransactionList.jsx
import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Clock } from 'lucide-react';
import TransactionCard from './TransactionCard';

const TransactionList = ({
  transactions = [],
  loading = false,
  showActions = true,
  onEdit,
  onDelete,
  emptyMessage
}) => {
  const { t } = useLanguage();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Empty state
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <div className="text-center py-8 ">
        <Clock className="w-12 h-12 mx-auto mb-3  " />
        <p>{emptyMessage || t('home.transactions.noTransactions')}</p>
      </div>
    );
  }

  // Show transactions list
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <TransactionCard
          key={`${transaction.id}-${transaction.transaction_type}`}
          transaction={transaction}
          onEdit={showActions ? onEdit : undefined}
          onDelete={showActions ? onDelete : undefined}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default React.memo(TransactionList);