/**
 * MoneyModelCard — explains how the current period's numbers are composed:
 * real bank cash flow vs itemized card purchases vs manual entries, and why
 * bank card-payment settlements are (or aren't) counted.
 */

import React from "react";
import { Landmark, CreditCard, Plus, Info } from "lucide-react";
import { cn } from "../../../utils/helpers";

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

export default MoneyModelCard;
