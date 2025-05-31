import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const DeleteTransaction = ({ transaction, onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{t('transactions.deleteConfirm')}</h2>
      {/* Delete confirmation content */}
    </div>
  );
};

export default DeleteTransaction;
