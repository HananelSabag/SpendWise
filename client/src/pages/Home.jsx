// Home.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTransactions } from '../context/TransactionContext';
import BalancePanel from '../components/home/BalancePanel';
import ActionsPanel from '../components/home/ActionsPanel';
import RecentTransactions from '../components/home/RecentTransactions';
import { useCurrency } from '../context/CurrencyContext';
import { Languages, DollarSign } from 'lucide-react';
import QuickExpenseBar from '../components/home/QuickExpenseBar';
import Header from "../components/common/Header";
import FloatingMenu from '../components/common/FloatingMenu';

const Home = () => {
  // Hooks
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleCurrency, currency } = useCurrency();
  const {
    loading,
    error,
    refreshBalances,
    fetchRecentTransactions
  } = useTransactions();

  // date state
  const [selectedPanelDate, setSelectedPanelDate] = useState(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now;
  });

  // Local state
  const isHebrew = language === 'he';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Utility function for Hebrew name detection
  const isHebrewName = (name) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(name);
  };

  const getLocalizedGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const username = user?.username || '';

    if (isHebrewName(username)) {
      if (hour >= 5 && hour < 12) return `בוקר טוב ${username}`;
      if (hour >= 12 && hour < 18) return `צהריים טובים ${username}`;
      if (hour >= 18 && hour < 21) return `ערב טוב ${username}`;
      return `לילה טוב ${username}`;
    } else {
      if (hour >= 5 && hour < 12) return `Good Morning ${username}`;
      if (hour >= 12 && hour < 18) return `Good Afternoon ${username}`;
      if (hour >= 18 && hour < 21) return `Good Evening ${username}`;
      return `Good Night ${username}`;
    }
  }, [user]);

  // Initial data loading with selectedPanelDate
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        await Promise.all([
          refreshBalances(selectedPanelDate),
          fetchRecentTransactions(5)
        ]);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized) {
      loadInitialData();
    }
  }, [user, refreshBalances, fetchRecentTransactions, isInitialized, selectedPanelDate]);

  // Show loading state until initialization is complete
  if (isLoading || loading) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  // Show error state if any
  if (error) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center">
        <div className="text-error bg-error-light p-4 rounded-lg">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-primary">
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        greeting={getLocalizedGreeting()}
      />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8" >
        <BalancePanel
          selectedDate={selectedPanelDate}
          onDateChange={setSelectedPanelDate}
        />

        {/* Actions Bar */}
        <div className="bg-primary-400 backdrop-blur-sm rounded-b-2xl p-4">
          <div
            className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${isHebrew ? "flex-row-reverse" : ""}`}
            dir={isHebrew ? "rtl" : "ltr"}
          >
            <div className="flex-1">
              <ActionsPanel selectedDate={selectedPanelDate} />
            </div>
            <div className="hidden md:block w-px h-12 bg-white/50" />
            <div className="flex-0">
            <QuickExpenseBar selectedDate={selectedPanelDate} />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-6 md:mt-8">
          <RecentTransactions selectedDate={selectedPanelDate} />
        </div>
      </main>

      {/* Language and Currency Controls */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
          {
            label: t('floatingMenu.switchCurrency'),
            icon: DollarSign,
            onClick: toggleCurrency,
          },
        ]}
      />
    </div>
  );
};

export default Home;