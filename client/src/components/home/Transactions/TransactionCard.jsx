import React from 'react';
import { ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatDate } from '../../../utils/helpers';

const TransactionCard = ({
  transaction,
  onEdit,
  onDelete,
  showActions = true,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(transaction);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(transaction.id, transaction.transaction_type);
  };

  return (
    <div
      className={`card bg-white hover:bg-gray-50 transition-all px-4 py-3 md:p-6 rounded-xl shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Side - Icon & Main Info */}
        <div className="flex items-center gap-3">
          {/* Transaction Icon */}
          <div className={`p-2 md:p-3 rounded-full ${transaction.transaction_type === 'expense'
              ? 'bg-error-light'
              : 'bg-success-light'
            }`}>
            {transaction.transaction_type === 'expense' ? (
              <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-error" />
            ) : (
              <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-success" />
            )}
          </div>

          {/* Description & Details */}
          <div className="min-w-0"> {/* Added to handle text overflow */}
            <p className="font-medium text-gray-900 truncate">
              {transaction.description}
            </p>
            <div className="flex items-center flex-wrap gap-1 text-xs md:text-sm text-gray-500">
              <span className="truncate">{formatDate(transaction.date, language)}</span>
              {transaction.category_name && (
                <>
                  <span>•</span>
                  <span className="text-primary-500 truncate">{transaction.category_name}</span>
                </>
              )}
              <span>•</span>
              <span className={transaction.is_recurring ? 'text-primary-500' : 'text-gray-500'}>
                {transaction.is_recurring
                  ? t('transactions.recurring')
                  : t('transactions.oneTime')}
              </span>
            </div>
          </div>
        </div>

    {/* Right Side - Amount & Actions */}
<div className="flex flex-col xs:flex-row items-end xs:items-center gap-2 xs:gap-1 sm:gap-2">
  <span className={`font-semibold text-sm sm:text-base md:text-lg whitespace-nowrap ${
    transaction.transaction_type === 'expense' ? 'text-error' : 'text-success'
  }`}>
    {formatAmount(transaction.amount)}
  </span>

  {showActions && (
    <div className="flex gap-1 sm:gap-2">
      <button
        onClick={handleEdit}
        className="p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
      </button>
      <button
        onClick={handleDelete}
        className="p-1.5 sm:p-2 rounded-full bg-error-light hover:bg-error/90 transition-colors"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-error" />
      </button>
    </div>
  )}
</div>
      </div>
    </div>
  );
};


export default React.memo(TransactionCard);