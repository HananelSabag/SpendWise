import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Repeat2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useCurrency, useTranslation } from '../stores';
import { useDashboard } from '../hooks/useDashboard';
import { useFinancialPeriodSelection } from '../hooks/useFinancialPeriodSelection';
import { formatFinancialPeriod } from '../utils/financialPeriod';
import transactionAPI from '../api/transactions';
import FinancialPeriodNavigator from '../components/features/dashboard/FinancialPeriodNavigator';
import PeriodSummary from '../components/features/dashboard/PeriodSummary';
import SpendingBreakdown from '../components/features/dashboard/SpendingBreakdown';
import SourcesOverview from '../components/features/dashboard/SourcesOverview';
import BankCosts from '../components/features/dashboard/BankCosts';
import ModernTransactionCard from '../components/features/transactions/ModernTransactionCard';
import BrandMark from '../components/common/BrandMark';
import DailyFlowHistory from '../components/features/insights/DailyFlowHistory';
import RunwayProjectionPlanner from '../components/features/insights/RunwayProjectionPlanner';
import WatchedMerchants from '../components/features/insights/WatchedMerchants';

export default function InsightsPage() {
  const navigate = useNavigate();
  const { currentLanguage, t } = useTranslation('dashboard');
  const { formatCurrency } = useCurrency();
  const { periodOffset, setPeriodOffset } = useFinancialPeriodSelection();
  const { data, isLoading, refresh } = useDashboard({ periodOffset });

  const periodTransactions = useQuery({
    queryKey: ['transactions', 'financial-period', periodOffset],
    queryFn: async () => {
      const result = await transactionAPI.getAll({ periodOffset, limit: 100, page: 1 });
      if (!result.success) throw new Error(result.error?.message || 'Failed to load period transactions');
      return result.data?.data || result.data;
    },
    staleTime: 60_000,
  });

  if (isLoading && !data) return <div className="min-h-screen animate-pulse bg-gray-50 dark:bg-gray-950" />;

  const transactions = periodTransactions.data?.transactions || [];
  const patterns = data?.recurringPatterns || [];
  const calendarPeriodLabel = formatFinancialPeriod(data?.period, currentLanguage);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 dark:bg-gray-950 lg:pb-10">
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/85 backdrop-blur dark:border-gray-800 dark:bg-gray-900/85">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:px-8">
          <button onClick={() => navigate('/')} className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('insightsPage.back')}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <BrandMark size="sm" />
          <div>
            <h1 className="text-lg font-bold text-gray-950 dark:text-white">{t('insightsPage.title')}</h1>
            <p className="text-xs text-gray-500">{t('insightsPage.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 lg:px-8">
        <FinancialPeriodNavigator period={data?.period} periodOffset={periodOffset} onPeriodOffsetChange={setPeriodOffset} />
        <PeriodSummary dashboardData={data} formatCurrency={formatCurrency} t={t} language={currentLanguage} />
        <DailyFlowHistory runway={data?.runway} formatCurrency={formatCurrency} language={currentLanguage} />
        <RunwayProjectionPlanner runway={data?.runway} formatCurrency={formatCurrency} onSaved={refresh} />
        <WatchedMerchants formatCurrency={formatCurrency} />

        <div className="grid gap-5 lg:grid-cols-2">
          <SpendingBreakdown categoryBreakdown={data?.categoryBreakdown || []} formatCurrency={formatCurrency} t={t} periodLabel={calendarPeriodLabel} />
          <SourcesOverview sources={data?.sources || []} formatCurrency={formatCurrency} t={t} lang={currentLanguage} navigate={navigate} />
        </div>

        <BankCosts bankCosts={data?.bankCosts} formatCurrency={formatCurrency} t={t} periodLabel={calendarPeriodLabel} />

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-violet-500" />
            <div>
              <h2 className="font-bold text-gray-950 dark:text-white">{t('insightsPage.recurringTitle')}</h2>
              <p className="text-xs text-gray-500">{t('insightsPage.recurringSubtitle')}</p>
            </div>
          </div>
          {patterns.length ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {patterns.map((pattern) => (
                <div key={`${pattern.description}-${pattern.bank_source}`} className="rounded-xl bg-violet-50/70 p-3 dark:bg-violet-950/25">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{pattern.description}</p>
                      <p className="text-xs text-gray-500">{pattern.category || pattern.bank_source} · {t('insightsPage.months', { count: pattern.active_months })}</p>
                      <p className="mt-1 text-sm font-bold text-violet-700 dark:text-violet-300">~{formatCurrency(pattern.average_amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="py-4 text-center text-sm text-gray-500">{t('insightsPage.noPatterns')}</p>}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-950 dark:text-white">{t('insightsPage.transactionsTitle')}</h2>
              <p className="text-xs text-gray-500">{t('insightsPage.transactionCount', { count: periodTransactions.data?.pagination?.total || transactions.length })}</p>
            </div>
          </div>
          <div className="space-y-2">
            {transactions.map((transaction) => <ModernTransactionCard key={transaction.id} transaction={transaction} />)}
            {!periodTransactions.isLoading && !transactions.length && <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-900">{t('insightsPage.noTransactions')}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
