import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ModernQuickActionsBar from '../components/features/dashboard/ModernQuickActionsBar';
import { useTranslation } from '../stores';

const QuickExpensePage = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation('dashboard');

  // Auto-focus is handled inside ModernQuickActionsBar via its amountInputRef,
  // but we trigger a small delay to ensure the DOM is ready.
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.querySelector('input[type="number"]');
      if (input) input.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSuccess = () => {
    // Short delay so the success notification is visible before navigating away
    setTimeout(() => navigate('/'), 900);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Minimal top bar */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('quickActions.back', 'Back')}
        >
          {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('quickActions.title', 'Quick Actions')}
        </h1>
      </div>

      {/* Content — centered card, no other widgets */}
      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          <ModernQuickActionsBar onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default QuickExpensePage;
