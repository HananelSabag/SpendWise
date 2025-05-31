import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const RecurringModal = ({ transaction, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t('transactions.recurring')}</h2>
      {/* Recurring transaction settings content */}
    </div>
  );
};

export default RecurringModal;
