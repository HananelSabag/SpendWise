// Home.jsx
// Main dashboard component managing layout and child component coordination
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTransactions } from '../context/TransactionContext';
import { useDate } from '../context/DateContext';
import BalancePanel from '../components/home/BalancePanel';
import ActionsPanel from '../components/home/ActionsPanel';
import RecentTransactions from '../components/home/RecentTransactions';
import { useCurrency } from '../context/CurrencyContext';
import { Languages, DollarSign } from 'lucide-react';
import QuickExpenseBar from '../components/home/QuickExpenseBar';
import Header from "../components/common/Header";
import FloatingMenu from '../components/common/FloatingMenu';
import Footer from '../components/common/Footer';
import AccessibilityMenu from '../components/common/AccessibilityMenu';
import { useLoadAccessibilitySettings } from '../hooks/useLoadAccessibilitySettings';

const Home = () => {
  // Core context hooks
  const { user } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleCurrency } = useCurrency();
  const { selectedDate } = useDate();
  useLoadAccessibilitySettings(); // Load accessibility settings on every page

  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Language direction
  const isRTL = language === 'he';

  // Hebrew name detection utility
  const isHebrewName = useCallback((name) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(name);
  }, []);

  // Get localized greeting based on time and username
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
  }, [user, isHebrewName]);

  // Initialize component
  useEffect(() => {
    if (!isInitialized && user) {
      setIsInitialized(true);
    }
    setIsLoading(false);
  }, [user, isInitialized]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-primary flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-primary flex flex-col">
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        greeting={getLocalizedGreeting()}
      />

      {/* Accessibility Menu */}
      <AccessibilityMenu />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-grow">
        <BalancePanel selectedDate={selectedDate} />

        {/* Actions Bar */}
        <div className="bg-primary-400 backdrop-blur-sm rounded-b-2xl p-4">
          <div
            className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${isRTL ? "flex-row-reverse" : ""}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="flex-1">
              <ActionsPanel selectedDate={selectedDate} />
            </div>
            <div className="hidden md:block w-px h-12 bg-white/50" />
            <div className="flex-0">
              <QuickExpenseBar selectedDate={selectedDate} />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-6 md:mt-8">
          <RecentTransactions selectedDate={selectedDate} />
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
      
      {/* Footer with language and currency toggles */}
      <Footer 
        showLanguageToggle={true} 
        showCurrencyToggle={true}
      />
    </div>
  );
};

export default Home;