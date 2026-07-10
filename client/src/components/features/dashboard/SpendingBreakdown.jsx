/**
 * SpendingBreakdown — top spending groups this period. Groups come from
 * source-provided raw_category text or bank-description patterns ("auto");
 * everything past the top 5 rolls into an honest "Other" row.
 */

import React, { useMemo } from "react";
import { PieChart as PieIcon, Info } from "lucide-react";

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
    const all = categoryBreakdown || [];
    const total = all.reduce((s, c) => s + Math.abs(Number(c.amount) || 0), 0);
    const top = all.slice(0, 5).map((c, i) => ({
      name: c.name || "Other",
      source: c.source || "auto",
      amount: Math.abs(Number(c.amount) || 0),
      pct:
        total > 0
          ? Math.round((Math.abs(Number(c.amount) || 0) / total) * 100)
          : 0,
      color: COLORS[i % COLORS.length],
    }));
    // Everything past the top 5 rolls into one honest "Other" row so the
    // bars account for the whole total instead of silently dropping spend.
    const shown = top.reduce((s, c) => s + c.amount, 0);
    const rest = total - shown;
    if (rest > 0.5) {
      top.push({
        name: t("breakdown.other", { fallback: "Other" }),
        source: "rest",
        amount: rest,
        pct: Math.round((rest / total) * 100),
        color: "#94a3b8",
      });
    }
    return top;
  }, [categoryBreakdown, t]);

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

export default SpendingBreakdown;
