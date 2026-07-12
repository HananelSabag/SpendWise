/**
 * BankCosts — fees/interest, loan payments and cash withdrawals for the
 * current period (pattern-classified from bank descriptions server-side).
 */

import React from "react";
import { Percent, Landmark, Banknote } from "lucide-react";
import { cn } from "../../../utils/helpers";

const BankCosts = ({ bankCosts, formatCurrency, t, periodLabel }) => {
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
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {t("bankCosts.title", { fallback: "Bank account charges" })}
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 leading-snug">
          {t("bankCosts.subtitle", {
            fallback:
              "Fees, repayments and cash withdrawals counted in the selected calendar month",
          })}
        </p>
        {periodLabel && <p className="mt-1 text-[10px] font-semibold text-indigo-500 dark:text-indigo-300">{periodLabel}</p>}
      </div>
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

export default BankCosts;
