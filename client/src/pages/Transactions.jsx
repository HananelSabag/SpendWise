import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import TransactionList from '../components/features/transactions/TransactionList';
import TransactionFilters from '../components/features/transactions/TransactionFilters';
import TransactionForm from '../components/features/transactions/TransactionForm';
import DeleteTransaction from '../components/features/transactions/DeleteTransaction';
import RecurringModal from '../components/features/transactions/RecurringModal';

const Transactions = () => {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('transactions.title')}</h1>
      <TransactionFilters />
      <TransactionList />
      
      {/* Modals */}
      {showAddModal && (
        <TransactionForm onClose={() => setShowAddModal(false)} />
      )}
      {showDeleteModal && (
        <DeleteTransaction onClose={() => setShowDeleteModal(false)} />
      )}
      {showRecurringModal && (
        <RecurringModal onClose={() => setShowRecurringModal(false)} />
      )}
    </div>
  );
};

export default Transactions;
