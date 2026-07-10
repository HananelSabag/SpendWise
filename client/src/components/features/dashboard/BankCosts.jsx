/**
 * BankCosts — fees/interest, loan payments and cash withdrawals for the
 * current period (pattern-classified from bank descriptions server-side).
 */

import React from "react";
import { Percent, Landmark, Banknote } from "lucide-react";
import { cn } from "../../../utils/helpers";

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

export default BankCosts;
