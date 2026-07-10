/**
 * GreetingHeader — greeting + date + avatar; shows a refresh control when
 * onRefresh is provided (desktop has no pull-to-refresh).
 */

import React, { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Avatar } from "../../ui";
import { cn } from "../../../utils/helpers";

const GreetingHeader = ({ greeting, user, navigate, compact = false, onRefresh, t }) => {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  return (
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
      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title={t?.("refresh", { fallback: "Refresh" })}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        )}
        <button
          onClick={() => navigate("/profile")}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
};

export default GreetingHeader;
