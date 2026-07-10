/**
 * DashboardError — full-page dashboard load failure with bounded auto-retry.
 */

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "../../../utils/helpers";

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

export default DashboardError;
