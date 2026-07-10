/**
 * ModernDashboard — main dashboard page. This is the user's financial home:
 * synced bank/card data drives everything, manual one-time entry is a small
 * side feature (not the hero it used to be).
 *
 * Composition only — the cards live in components/features/dashboard/:
 *   PeriodSummary · MoneyModelCard · SourcesOverview · BankCosts ·
 *   SpendingBreakdown · GreetingHeader · DashboardError · ManualEntryLink
 */

import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import {
  useTranslation,
  useAuth,
  useCurrency,
  useNotifications,
} from "../stores";
import { useDashboard } from "../hooks/useDashboard";
import { useFinancialCycle } from "../hooks/useFinancialCycle";
import { useIsMobile } from "../hooks/useIsMobile";
import { cn } from "../utils/helpers";
import { PageSkeleton } from "../components/ui";

import ModernBalancePanel from "../components/features/dashboard/ModernBalancePanel";
import ModernRecentTransactionsWidget from "../components/features/dashboard/ModernRecentTransactionsWidget";
import PeriodSummary from "../components/features/dashboard/PeriodSummary";
import MoneyModelCard from "../components/features/dashboard/MoneyModelCard";
import SourcesOverview from "../components/features/dashboard/SourcesOverview";
import BankCosts from "../components/features/dashboard/BankCosts";
import SpendingBreakdown from "../components/features/dashboard/SpendingBreakdown";
import GreetingHeader from "../components/features/dashboard/GreetingHeader";
import DashboardError from "../components/features/dashboard/DashboardError";
import ManualEntryLink from "../components/features/dashboard/ManualEntryLink";
import { usePullToRefresh } from "../components/features/dashboard/usePullToRefresh";
import FloatingAddTransactionButton from "../components/common/FloatingAddTransactionButton.jsx";

// ─── Greeting ────────────────────────────────────────────────────────────────

const useGreeting = (user, t) =>
  useMemo(() => {
    const hour = new Date().getHours();
    const name =
      user?.firstName ||
      user?.first_name ||
      user?.name ||
      user?.username ||
      user?.email?.split("@")[0] ||
      "";

    const key =
      hour < 12
        ? "welcome.goodMorning"
        : hour < 17
          ? "welcome.goodAfternoon"
          : hour < 21
            ? "welcome.goodEvening"
            : "welcome.general";

    const text = t(key) || "Hello";
    return text.includes("{{name}}")
      ? text.replace("{{name}}", name)
      : `${text}${name ? `, ${name}` : ""}`;
  }, [user, t]);

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileDashboard = ({
  greeting,
  user,
  dashboardData,
  financialCycle,
  t,
  lang,
  navigate,
  onRefresh,
  formatCurrency,
}) => {
  const { pull, refreshing } = usePullToRefresh(onRefresh, true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-gray-50 to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      {/* Pull-to-refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: `${pull}px` }}
      >
        <RefreshCw
          className={cn(
            "w-5 h-5 text-indigo-500 transition-transform",
            refreshing && "animate-spin",
            !refreshing && pull >= 70 && "rotate-180",
          )}
        />
      </div>

      {/* Glass greeting header */}
      <div className="glass-card sticky top-0 z-20 px-4 py-3 border-x-0 border-t-0 rounded-none">
        <GreetingHeader
          greeting={greeting}
          user={user}
          navigate={navigate}
          compact
        />
      </div>

      <div className="px-4 py-4 space-y-4 pb-28">
        <ModernBalancePanel />
        <PeriodSummary
          dashboardData={dashboardData}
          financialCycle={financialCycle}
          formatCurrency={formatCurrency}
          t={t}
        />
        <MoneyModelCard
          summary={dashboardData.summary}
          formatCurrency={formatCurrency}
          t={t}
        />
        <SourcesOverview
          sources={dashboardData.sources}
          formatCurrency={formatCurrency}
          t={t}
          lang={lang}
          navigate={navigate}
        />
        <BankCosts
          bankCosts={dashboardData.bankCosts}
          formatCurrency={formatCurrency}
          t={t}
        />
        <SpendingBreakdown
          categoryBreakdown={dashboardData.categoryBreakdown}
          formatCurrency={formatCurrency}
          t={t}
        />
        <ModernRecentTransactionsWidget
          onViewAll={() => navigate("/transactions")}
          maxItems={6}
          preloadedTransactions={dashboardData?.recentTransactions}
          preloadedLoading={!dashboardData}
        />
        <ManualEntryLink t={t} />
      </div>
    </div>
  );
};

// ─── Desktop layout ───────────────────────────────────────────────────────────

const DesktopDashboard = ({
  greeting,
  user,
  dashboardData,
  financialCycle,
  t,
  lang,
  navigate,
  formatCurrency,
  onRefresh,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
      <GreetingHeader greeting={greeting} user={user} navigate={navigate} onRefresh={onRefresh} t={t} />
    </div>

    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6">
      <ModernBalancePanel />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <PeriodSummary
            dashboardData={dashboardData}
            financialCycle={financialCycle}
            formatCurrency={formatCurrency}
            t={t}
          />
          <MoneyModelCard
            summary={dashboardData.summary}
            formatCurrency={formatCurrency}
            t={t}
          />
          <ModernRecentTransactionsWidget
            onViewAll={() => navigate("/transactions")}
            maxItems={8}
            preloadedTransactions={dashboardData?.recentTransactions}
            preloadedLoading={!dashboardData}
          />
          <ManualEntryLink t={t} />
        </div>

        <div className="xl:col-span-1 space-y-6">
          <SourcesOverview
            sources={dashboardData.sources}
            formatCurrency={formatCurrency}
            t={t}
            lang={lang}
            navigate={navigate}
          />
          <BankCosts
            bankCosts={dashboardData.bankCosts}
            formatCurrency={formatCurrency}
            t={t}
          />
          <SpendingBreakdown
            categoryBreakdown={dashboardData.categoryBreakdown}
            formatCurrency={formatCurrency}
            t={t}
          />
        </div>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ModernDashboard = () => {
  const { t, currentLanguage } = useTranslation("dashboard");
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    data: dashboardData,
    isLoading,
    isError,
    refresh: refreshDashboard,
  } = useDashboard();
  const { data: financialCycle, refetch: refetchFinancialCycle } =
    useFinancialCycle();

  const greeting = useGreeting(user, t);

  const handleRefresh = useCallback(async () => {
    try {
      await refetchFinancialCycle();
      await refreshDashboard();
    } catch (_) {
      addNotification({
        type: "error",
        message: t("refreshError"),
        duration: 4000,
      });
    }
  }, [refetchFinancialCycle, refreshDashboard, addNotification, t]);

  if (isLoading && !dashboardData) {
    return <PageSkeleton page="dashboard" />;
  }

  if (isError && !dashboardData) {
    return <DashboardError onRetry={handleRefresh} t={t} />;
  }

  const sharedProps = {
    greeting,
    user,
    dashboardData,
    financialCycle,
    formatCurrency,
    t,
    lang: currentLanguage,
    navigate,
  };

  return (
    <>
      {isMobile ? (
        <MobileDashboard {...sharedProps} onRefresh={handleRefresh} />
      ) : (
        <DesktopDashboard {...sharedProps} onRefresh={handleRefresh} />
      )}

      {/* No onClick — the FAB dispatches 'transaction:add', handled by the
          global UnifiedTransactionActions; it broadcasts 'transaction-added'
          on success, which useDashboard already listens for. */}
      <FloatingAddTransactionButton />
    </>
  );
};

export default ModernDashboard;
