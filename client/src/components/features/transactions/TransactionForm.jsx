import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const TransactionForm = ({ transaction, onClose }) => {
  const { t } = useLanguage();
  const isEditing = !!transaction;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? t('transactions.editTransaction') : t('transactions.addTransaction')}
      </h2>
      {/* Form content */}
    </div>
  );
};

export default TransactionForm;
