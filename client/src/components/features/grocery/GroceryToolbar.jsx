import React from "react";
import { ChevronDown, ClipboardList, Flag, Users } from "lucide-react";
import { LiquidTabs } from "../../ui";
import { cn } from "../../../utils/helpers";

/** Compact page controls; the app navigation already identifies the page. */
export default function GroceryToolbar({
  activeListLabel,
  onSwitchList,
  onShare,
  invitationCount = 0,
  tab,
  onTabChange,
  statusLine,
  progress,
  showProgress,
  t,
}) {
  const progressPercent = Math.min(100, Math.max(0, Number(progress) || 0));
  return (
    <header className="pt-3">
      <h1 className="sr-only">{t("title")}</h1>
      {onSwitchList && (
        <button
          type="button"
          onClick={onSwitchList}
          aria-label={`${t("lists.switchTo")}: ${activeListLabel}`}
          className="mb-1 flex min-h-11 max-w-full items-center gap-2 rounded-xl px-2 text-start text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span className="truncate">{activeListLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 lg:max-w-sm">
          <LiquidTabs
            fill
            size="sm"
            className="[&>button]:min-h-11 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-blue-500"
            tabs={[
              { id: "list", label: t("tabs.list"), icon: ClipboardList },
              { id: "history", label: t("tabs.history"), icon: Flag },
            ]}
            active={tab}
            onChange={onTabChange}
          />
        </div>
        <button
          type="button"
          onClick={onShare}
          aria-label={t("share.title")}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 lg:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Users className="h-4 w-4" />
          {invitationCount > 0 && (
            <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {invitationCount}
            </span>
          )}
        </button>
      </div>
      {tab === "list" && (
        <p
          className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400"
          role="status"
        >
          {statusLine}
        </p>
      )}
      {tab === "list" && showProgress && (
        <div
          role="progressbar"
          aria-label={t("tabs.list")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
          aria-valuetext={statusLine}
          className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none",
              progressPercent >= 100 ? "bg-emerald-500" : "bg-blue-500",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </header>
  );
}
