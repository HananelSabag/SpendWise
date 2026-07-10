/**
 * PeriodSummary — income / expenses / net for the user's current financial
 * period (billing_cycle_day based, not a rolling window).
 */

import React from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "../../../utils/helpers";

function formatPeriodLabel(period) {
  if (!period?.start || !period?.end) return "";
  const start = new Date(period.start);
  // period.end is exclusive (the next cycle's start) — show the day before
  const end = new Date(new Date(period.end).getTime() - 86400000);
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const PeriodSummary = ({ dashboardData, financialCycle, formatCurrency, t }) => {
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
            {/* Keep the sign — color alone must not carry "negative" */}
            {net < 0 && "−"}
            {formatCurrency(Math.abs(net))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PeriodSummary;
