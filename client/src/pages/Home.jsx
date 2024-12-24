import React from 'react';
import DailyBalance from '../components/home/DailyBalance';
import QuickAdd from '../components/home/QuickAdd';
import RecentTransactions from '../components/home/RecentTransactions';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl text-white font-bold">S</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">SpendWise</h1>
              <p className="text-gray-600">שלום, {user?.username}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <DailyBalance />
          <RecentTransactions />
        </div>

        {/* Quick Add Button */}
        <QuickAdd />
      </div>
    </div>
  );
};

export default Home;