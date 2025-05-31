import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import BalancePanel from '../components/features/dashboard/BalancePanel';
import ActionsPanel from '../components/features/dashboard/ActionsPanel';
import QuickExpenseBar from '../components/features/dashboard/QuickExpenseBar';
import RecentTransactions from '../components/features/dashboard/RecentTransactions';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <BalancePanel />
      <div className="mt-8">
        <ActionsPanel />
      </div>
      <div className="mt-6">
        <QuickExpenseBar />
      </div>
      <div className="mt-8">
        <RecentTransactions />
      </div>
    </div>
  );
};

export default Dashboard;
