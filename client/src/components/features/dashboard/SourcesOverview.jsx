/**
 * SourcesOverview — per-institution rows, split into bank accounts vs credit
 * companies (never one undifferentiated list): a bank shows its available
 * balance, a credit company its charges this period. Sources with more than
 * one account/card expand into per-account sub-rows.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../../utils/helpers";
import { institutionLabel, bankBrand } from "../bankSync/bankSyncMeta";

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
  // Under an hour gets its own phrasing — interpolating "today" into
  // "Synced {time} ago" read as "Synced today ago".
  if (h < 1) {
    return {
      text: t("sourcesOverview.syncedRecently", { fallback: "Synced recently" }),
      stale,
    };
  }
  const token = d >= 1 ? `${d}d` : `${h}h`;
  return {
    text: t("sourcesOverview.syncedAgo", {
      time: token,
      fallback: `Synced ${token} ago`,
    }),
    stale,
  };
}

// One row per account/card under `src.bankSource` — only rendered when
// there's more than one, so a single-account source stays exactly as
// compact as it always was.
const AccountSubRow = ({ account, isBank, formatCurrency, t }) => {
  const value = isBank
    ? account.balance !== null
      ? formatCurrency(account.balance)
      : "—"
    : formatCurrency(account.expenses);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 ps-11">
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-medium truncate",
            account.enabled
              ? "text-gray-700 dark:text-gray-300"
              : "text-gray-400 dark:text-gray-500",
          )}
        >
          {account.accountNumber || t("mainAccount", { fallback: "Main account" })}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
          {account.count > 0
            ? t("sourcesOverview.accountAsOf", {
                count: account.count,
                date: account.lastTransactionAt
                  ? new Date(account.lastTransactionAt).toLocaleDateString()
                  : "—",
                fallback: `${account.count} transactions · as of ${account.lastTransactionAt ? new Date(account.lastTransactionAt).toLocaleDateString() : "—"}`,
              })
            : t("sourcesOverview.accountNoActivity", { fallback: "No transactions this period" })}
        </p>
      </div>
      <div className="text-end shrink-0">
        <p
          className={cn(
            "text-xs font-bold tabular-nums",
            account.enabled ? "text-gray-900 dark:text-white" : "text-gray-400 line-through",
          )}
        >
          {value}
        </p>
        {!isBank && account.count > 0 && (
          <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {t("sourcesOverview.chargedLabel", { fallback: "charged" })}
          </p>
        )}
      </div>
    </div>
  );
};

const SourceRow = ({ src, formatCurrency, t, lang }) => {
  const [open, setOpen] = useState(false);
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
  const hasBreakdown = (src.accounts || []).length > 1;

  const Row = (
    <div className="flex items-center gap-3 py-2 flex-1 min-w-0">
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
          {institutionLabel(src.bankSource, lang)}
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
      {hasBreakdown && (
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      )}
    </div>
  );

  if (!hasBreakdown) return Row;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center text-start hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg transition-colors -mx-1 px-1"
        aria-expanded={open}
      >
        {Row}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60 pb-1">
              {src.accounts.map((a) => (
                <AccountSubRow
                  key={a.accountNumber}
                  account={a}
                  isBank={isBank}
                  formatCurrency={formatCurrency}
                  t={t}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SourcesOverview = ({ sources, formatCurrency, t, lang, navigate }) => {
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
              lang={lang}
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

export default SourcesOverview;
