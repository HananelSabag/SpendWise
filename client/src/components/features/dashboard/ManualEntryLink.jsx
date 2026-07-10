/**
 * ManualEntryLink — demoted one-time entry actions. Dispatches the global
 * 'transaction:add' event handled by UnifiedTransactionActions.
 */

import React, { useCallback } from "react";
import { Plus } from "lucide-react";

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

export default ManualEntryLink;
