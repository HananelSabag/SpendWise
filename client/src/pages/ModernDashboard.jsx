/**
 * ModernDashboard — main dashboard page. This is the user's financial home:
 * synced bank/card data drives everything, manual one-time entry is a small
 * side feature (not the hero it used to be).
 *
 * Mobile-first: pull-to-refresh, liquid-glass surfaces.
 */

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Plus,
  Percent,
  Landmark,
  Banknote,
  PieChart as PieIcon,
  Info,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  CalendarClock,
} from "lucide-react";

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
import { Avatar, PageSkeleton } from "../components/ui";
import {
  institutionLabel,
  bankBrand,
} from "../components/features/bankSync/bankSyncMeta";

import ModernBalancePanel from "../components/features/dashboard/ModernBalancePanel";
import ModernRecentTransactionsWidget from "../components/features/dashboard/ModernRecentTransactionsWidget";
import AddTransactionModal from "../components/features/transactions/modals/AddTransactionModal";
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

// ─── Pull-to-refresh (mobile) ─────────────────────────────────────────────────

const usePullToRefresh = (onRefresh, enabled) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || refreshing) return;
      const delta = (e.touches[0].clientY - startY.current) * 0.5;
      if (delta > 0 && window.scrollY === 0) {
        setPull(Math.min(delta, 110));
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pull >= 70 && !refreshing) {
        setRefreshing(true);
        setPull(54);
        try {
          await onRefresh();
        } catch (_) {}
        setRefreshing(false);
      }
      setPull(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, pull, refreshing, onRefresh]);

  return { pull, refreshing };
};

// ─── Period summary ────────────────────────────────────────────────────────────

function formatPeriodLabel(period) {
  if (!period?.start || !period?.end) return "";
  const start = new Date(period.start);
  // period.end is exclusive (the next cycle's start) — show the day before
  const end = new Date(new Date(period.end).getTime() - 86400000);
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const PeriodSummary = ({
  dashboardData,
  financialCycle,
  formatCurrency,
  t,
}) => {
  const { summary, period } = dashboardData;
  const displayPeriod = {
    start: financialCycle?.start || period?.start,
    end: financialCycle?.end || period?.end,
    cycleDay: Number(financialCycle?.cycleDay ?? period?.cycleDay) || 1,
  };
  const net = summary.net_balance;

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
          {t("period.title", { fallback: "This financial period" })}
        </h3>
        <div className="flex items-center gap-2 min-w-0">
          {displayPeriod.cycleDay != null && (
            <span
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 shrink-0"
              title={t("period.cycleHint", {
                day: displayPeriod.cycleDay,
                fallback: `Billing cycle starts on day ${displayPeriod.cycleDay}`,
              })}
            >
              <CalendarClock className="w-3 h-3" />
              {t("period.cycleDay", {
                day: displayPeriod.cycleDay,
                fallback: `Cycle day ${displayPeriod.cycleDay}`,
              })}
            </span>
          )}
          {displayPeriod.start && displayPeriod.end && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {formatPeriodLabel(displayPeriod)}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("period.income", { fallback: "Income" })}
          </p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(summary.total_income)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("period.expenses", { fallback: "Expenses" })}
          </p>
          <p className="text-base font-bold text-red-500 dark:text-red-400 tabular-nums">
            {formatCurrency(summary.total_expenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("period.net", { fallback: "Net" })}
          </p>
          <p
            className={cn(
              "text-base font-bold tabular-nums",
              net >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400",
            )}
          >
            {formatCurrency(Math.abs(net))}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Sources overview (banks vs credit cards) ─────────────────────────────────

const MoneyModelCard = ({ summary, formatCurrency, t }) => {
  const bankDirect = Math.abs(Number(summary?.bank_direct_expenses) || 0);
  const cardCharges = Math.abs(Number(summary?.card_charges) || 0);
  const manual = Math.abs(Number(summary?.manual_expenses) || 0);
  const excludedSettlements = Math.abs(
    Number(summary?.excluded_bank_card_settlements) || 0,
  );
  const bankSettlements = Math.abs(Number(summary?.bank_card_settlements) || 0);

  const rows = [
    {
      key: "bank",
      icon: Landmark,
      label: t("moneyModel.bankDirect", { fallback: "Bank account movement" }),
      value: bankDirect,
      text: t("moneyModel.bankDirectHint", {
        fallback: "Cash flow that really left or entered your bank account.",
      }),
      tint: "text-blue-600 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      key: "card",
      icon: CreditCard,
      label: t("moneyModel.cardPurchases", {
        fallback: "Credit-card purchases",
      }),
      value: cardCharges,
      text: t("moneyModel.cardPurchasesHint", {
        fallback:
          "Itemized purchases from credit companies, counted by purchase date.",
      }),
      tint: "text-violet-600 dark:text-violet-300",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      key: "manual",
      icon: Plus,
      label: t("moneyModel.manual", { fallback: "Manual entries" }),
      value: manual,
      text: t("moneyModel.manualHint", {
        fallback: "One-time transactions you added yourself.",
      }),
      tint: "text-gray-600 dark:text-gray-300",
      bg: "bg-gray-100 dark:bg-gray-800",
    },
  ].filter((row) => row.value > 0);

  if (!rows.length && !excludedSettlements && !bankSettlements) return null;

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t("moneyModel.title", { fallback: "How this period is counted" })}
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-snug">
            {t("moneyModel.subtitle", {
              fallback:
                "Banks show real account cash flow. Credit companies show purchase detail. SpendWise avoids counting the same card bill twice.",
            })}
          </p>
        </div>
        <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      </div>

      <div className="space-y-2.5">
        {rows.map(({ key, icon: Icon, label, value, text, tint, bg }) => (
          <div key={key} className="flex items-start gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                bg,
              )}
            >
              <Icon className={cn("w-4 h-4", tint)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {label}
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                  {formatCurrency(value)}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-snug mt-0.5">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {(excludedSettlements > 0 ||
        (bankSettlements > 0 && cardCharges === 0)) && (
        <div
          className={cn(
            "mt-3 rounded-lg px-3 py-2 text-[11px] leading-snug",
            excludedSettlements > 0
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-200"
              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200",
          )}
        >
          {excludedSettlements > 0
            ? t("moneyModel.settlementsExcluded", {
                amount: formatCurrency(excludedSettlements),
                fallback: `${formatCurrency(excludedSettlements)} in bank card-payment withdrawals is not counted again because the card purchases are connected.`,
              })
            : t("moneyModel.settlementsCounted", {
                amount: formatCurrency(bankSettlements),
                fallback: `${formatCurrency(bankSettlements)} in card-payment withdrawals is counted from the bank because no card-company purchase detail is connected.`,
              })}
        </div>
      )}
    </div>
  );
};

const STALE_MS = 26 * 3_600_000; // missed more than a full day of twice-daily syncs

function syncFreshness(iso, t) {
  if (!iso)
    return {
      text: t("sourcesOverview.neverSynced", { fallback: "Not synced yet" }),
      stale: true,
    };
  const diff = Date.now() - new Date(iso).getTime();
  const stale = diff > STALE_MS;
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  const token =
    h < 1 ? t("date.today", { fallback: "today" }) : d >= 1 ? `${d}d` : `${h}h`;
  return {
    text: t("sourcesOverview.syncedAgo", {
      time: token,
      fallback: `Synced ${token} ago`,
    }),
    stale,
  };
}

const SourceRow = ({ src, formatCurrency, t }) => {
  const Icon = src.kind === "credit_card" ? CreditCard : Landmark;
  const brand = bankBrand(src.bankSource);
  const fresh = syncFreshness(src.lastSyncedAt, t);

  // Bank → available balance (real money); credit card → charges this period.
  const isBank = src.kind === "bank";
  const value = isBank
    ? src.hasBalance
      ? formatCurrency(src.balance)
      : t("sourcesOverview.balanceUnavailable", {
          fallback: "Balance not available",
        })
    : formatCurrency(src.expenses);

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white bg-gradient-to-br",
          brand.gradient,
        )}
      >
        <Icon className="w-4.5 h-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {src.label}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 truncate">
          {fresh.stale && (
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
          )}
          <span
            className={cn(
              "truncate",
              fresh.stale && "text-amber-600 dark:text-amber-400",
            )}
          >
            {fresh.stale && src.lastSyncedAt
              ? t("sourcesOverview.staleWarning", {
                  fallback: "Not synced in over a day",
                })
              : fresh.text}
          </span>
          {src.count > 0 && (
            <>
              <span>·</span>
              <span className="shrink-0">
                {t("sourcesOverview.txnCount", {
                  count: src.count,
                  fallback: `${src.count} synced`,
                })}
              </span>
            </>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-bold tabular-nums",
            isBank && !src.hasBalance
              ? "text-gray-400 dark:text-gray-500 font-medium text-xs"
              : "text-gray-900 dark:text-white",
          )}
        >
          {value}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {isBank
            ? t("sourcesOverview.balance", { fallback: "Available balance" })
            : t("sourcesOverview.charges", { fallback: "Charges this period" })}
        </p>
      </div>
    </div>
  );
};

const SourcesOverview = ({ sources, formatCurrency, t, navigate }) => {
  const banks = (sources || []).filter((s) => s.kind === "bank");
  const cards = (sources || []).filter((s) => s.kind === "credit_card");
  if (!banks.length && !cards.length) return null; // ModernBalancePanel shows the connect CTA

  const Section = ({ title, list, icon: SecIcon, explainer }) =>
    list.length > 0 && (
      <div>
        <div className="flex items-center gap-1.5 mb-1 mt-1">
          <SecIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {title}
          </h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
          {list.map((s) => (
            <SourceRow
              key={s.bankSource}
              src={s}
              formatCurrency={formatCurrency}
              t={t}
            />
          ))}
        </div>
        {explainer && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 leading-snug">
            {explainer}
          </p>
        )}
      </div>
    );

  const Header = ({ title }) => (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      <button
        onClick={() => navigate("/bank-sync")}
        className="flex items-center gap-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {t("sourcesOverview.manage", { fallback: "Manage" })}
        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {banks.length > 0 && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <Header
            title={t("sourcesOverview.banksTitle", {
              fallback: "Bank accounts",
            })}
          />
          <Section
            title={t("sourcesOverview.bankActivityTitle", {
              fallback: "Current accounts",
            })}
            list={banks}
            icon={Landmark}
          />
        </div>
      )}

      {cards.length > 0 && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <Header
            title={t("sourcesOverview.cardsTitle", {
              fallback: "Credit companies",
            })}
          />
          <Section
            title={t("sourcesOverview.cardActivityTitle", {
              fallback: "Card activity",
            })}
            list={cards}
            icon={CreditCard}
            explainer={t("sourcesOverview.cardExplainer", {
              fallback:
                "Card charges appear here per purchase, then as one summarized charge in your bank account",
            })}
          />
        </div>
      )}
    </div>
  );
};

// ─── Bank costs ────────────────────────────────────────────────────────────────

const BankCosts = ({ bankCosts, formatCurrency, t }) => {
  const hasAny =
    bankCosts &&
    (bankCosts.feesInterest > 0 ||
      bankCosts.loanPayments > 0 ||
      bankCosts.cashWithdrawn > 0);
  if (!hasAny) return null;

  const items = [
    {
      label: t("bankCosts.feesInterest", { fallback: "Fees & Interest" }),
      value: bankCosts.feesInterest,
      icon: Percent,
      tint: "text-amber-500 dark:text-amber-400",
    },
    {
      label: t("bankCosts.loanPayments", { fallback: "Loan Payments" }),
      value: bankCosts.loanPayments,
      icon: Landmark,
      tint: "text-indigo-500 dark:text-indigo-400",
    },
    {
      label: t("bankCosts.cashWithdrawn", { fallback: "Cash Withdrawn" }),
      value: bankCosts.cashWithdrawn,
      icon: Banknote,
      tint: "text-teal-500 dark:text-teal-400",
      sub: bankCosts.cashWithdrawalCount
        ? `${bankCosts.cashWithdrawalCount}x`
        : null,
    },
  ].filter((i) => i.value > 0);

  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
        {t("bankCosts.title", { fallback: "Bank Costs This Period" })}
      </h3>
      <div className="space-y-2.5">
        {items.map(({ label, value, icon: Icon, tint, sub }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700/60 shrink-0">
              <Icon className={cn("w-4 h-4", tint)} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
              {label}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(value)}{" "}
              {sub && (
                <span className="text-xs font-normal text-gray-400">
                  · {sub}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Spending breakdown ─────────────────────────────────────────────────────────

const COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#64748b",
];

const SpendingBreakdown = ({ categoryBreakdown, formatCurrency, t }) => {
  const data = useMemo(() => {
    const total = (categoryBreakdown || []).reduce(
      (s, c) => s + Math.abs(Number(c.amount) || 0),
      0,
    );
    return (categoryBreakdown || []).slice(0, 5).map((c, i) => ({
      name: c.name || "Other",
      source: c.source || "auto",
      amount: Math.abs(Number(c.amount) || 0),
      pct:
        total > 0
          ? Math.round((Math.abs(Number(c.amount) || 0) / total) * 100)
          : 0,
      color: COLORS[i % COLORS.length],
    }));
  }, [categoryBreakdown]);

  if (!data.length) return null;
  const hasAuto = data.some((d) => d.source === "auto");

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieIcon className="w-4 h-4 text-violet-500 dark:text-violet-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {t("breakdown.title", { fallback: "Spending by type" })}
        </h3>
      </div>
      <div className="space-y-2.5">
        {data.map(({ name, source, amount, pct, color }) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {name}
                </span>
                {source === "auto" && (
                  <span className="text-[9px] font-medium px-1 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shrink-0">
                    {t("breakdown.auto", { fallback: "auto" })}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </div>
      {hasAuto && (
        <div className="flex items-start gap-1 pt-2.5 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>
            {t("breakdown.autoHint", {
              fallback:
                '"auto" groups are guessed from bank transaction descriptions',
            })}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Demoted manual entry ────────────────────────────────────────────────────

const ManualEntryLink = ({ t }) => {
  const handleAdd = useCallback((type) => {
    try {
      window.dispatchEvent(
        new CustomEvent("transaction:add", { detail: { type } }),
      );
    } catch (_) {}
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <button
        onClick={() => handleAdd("expense")}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("manualEntryActions.addExpense", { fallback: "One-time expense" })}
      </button>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <button
        onClick={() => handleAdd("income")}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("manualEntryActions.addIncome", { fallback: "One-time income" })}
      </button>
    </div>
  );
};

// ─── Auto-retry error state ───────────────────────────────────────────────────

const MAX_AUTO_RETRIES = 3;

const DashboardError = ({ onRetry, t }) => {
  const [countdown, setCountdown] = useState(8);
  const [attempt, setAttempt] = useState(0);
  const exhausted = attempt >= MAX_AUTO_RETRIES;

  useEffect(() => {
    if (exhausted) return;
    if (countdown <= 0) {
      setAttempt((a) => a + 1);
      setCountdown(8);
      onRetry();
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, onRetry, exhausted]);

  const handleManualRetry = () => {
    setAttempt(0);
    setCountdown(8);
    onRetry();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card rounded-2xl text-center p-8 max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <RefreshCw
            className={cn("w-7 h-7 text-red-500", !exhausted && "animate-spin")}
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t("dashboardError")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("dashboardErrorMessage")}
        </p>
        {!exhausted ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {t("retryingIn", { countdown }) || `Retrying in ${countdown}s…`}
            {attempt > 0 && ` (attempt ${attempt + 1} / ${MAX_AUTO_RETRIES})`}
          </p>
        ) : (
          <p className="text-xs text-red-500 dark:text-red-400 mb-4">
            {t(
              "autoRetriesExhausted",
              "Auto-retries exhausted — try again manually.",
            )}
          </p>
        )}
        <button
          onClick={handleManualRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {t("reloadPage")}
        </button>
      </div>
    </div>
  );
};

// ─── Greeting header (shared) ─────────────────────────────────────────────────

const GreetingHeader = ({ greeting, user, navigate, compact = false }) => (
  <div className={cn("flex items-center justify-between", !compact && "mb-1")}>
    <div className="min-w-0">
      <h1
        className={cn(
          "font-bold text-gray-900 dark:text-white leading-tight truncate",
          compact ? "text-lg" : "text-2xl",
        )}
      >
        {greeting}
      </h1>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
    <button
      onClick={() => navigate("/profile")}
      className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <Avatar
        src={user?.avatar || user?.profile_picture_url || user?.picture}
        fallback={
          user?.firstName?.charAt(0) ||
          user?.first_name?.charAt(0) ||
          user?.email?.charAt(0) ||
          "U"
        }
        className={cn(
          "rounded-full ring-2 ring-white/60 dark:ring-gray-700 shadow-sm hover:opacity-80 transition-opacity",
          compact ? "w-9 h-9" : "w-11 h-11",
        )}
      />
    </button>
  </div>
);

// ─── Mobile layout ────────────────────────────────────────────────────────────

const MobileDashboard = ({
  greeting,
  user,
  dashboardData,
  financialCycle,
  t,
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
  navigate,
  formatCurrency,
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-6">
      <GreetingHeader greeting={greeting} user={user} navigate={navigate} />
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
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [showAddTransaction, setShowAddTransaction] = useState(false);

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
    navigate,
  };

  return (
    <>
      {isMobile ? (
        <MobileDashboard {...sharedProps} onRefresh={handleRefresh} />
      ) : (
        <DesktopDashboard {...sharedProps} />
      )}

      <AddTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSuccess={() => {
          setShowAddTransaction(false);
          try {
            window.dispatchEvent(
              new CustomEvent("dashboard-refresh-requested"),
            );
          } catch (_) {}
        }}
      />

      <FloatingAddTransactionButton
        onClick={() => setShowAddTransaction(true)}
      />
    </>
  );
};

export default ModernDashboard;
