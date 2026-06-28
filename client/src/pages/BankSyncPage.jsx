/**
 * Bank Sync Page — control panel for bank-scraper integration.
 * Full i18n via bankSync translation module. No hardcoded strings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, RefreshCw, CheckCircle2, Clock, TrendingDown,
  TrendingUp, AlertCircle, ChevronDown, ChevronUp, Landmark,
  Zap, Info,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../stores';
import { cn } from '../utils/helpers';
import apiClient from '../api/client';

// ── API call ─────────────────────────────────────────────────────────────────
async function fetchBankStats() {
  const res = await apiClient.get('/bank-sync/stats');
  return res.data.sources || [];
}

// ── Source display metadata (colors only — labels come from i18n) ─────────────
const SOURCE_META = {
  yahav:    { color: '#1a6b3a', bg: 'bg-green-50 dark:bg-green-950/30',   border: 'border-green-200 dark:border-green-800',   badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  isracard: { color: '#c0392b', bg: 'bg-red-50 dark:bg-red-950/30',       border: 'border-red-200 dark:border-red-800',       badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  max:      { color: '#1565c0', bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800',     badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  discount: { color: '#e65100', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
};

function getMeta(source) {
  return SOURCE_META[source] || {
    color: '#6b7280',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    border: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
}

function formatDate(iso, lang) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(n, lang) {
  return Number(n || 0).toLocaleString(lang === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency', currency: 'ILS', maximumFractionDigits: 0,
  });
}

// ── Toggle persistence ────────────────────────────────────────────────────────
function loadToggles() {
  try { return JSON.parse(localStorage.getItem('bankSyncToggles') || '{}'); } catch { return {}; }
}
function saveToggles(v) {
  try { localStorage.setItem('bankSyncToggles', JSON.stringify(v)); } catch {}
}

// ── Bank card ─────────────────────────────────────────────────────────────────
function BankCard({ stat, enabled, onToggle, t, lang }) {
  const meta = getMeta(stat.source);
  const bankName = t(`bankNames.${stat.source}`, { fallback: stat.source });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-5 transition-all duration-200',
        meta.bg, meta.border,
        !enabled && 'opacity-60 grayscale',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <Landmark className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{bankName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.source}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
            enabled ? 'bg-emerald-500 focus:ring-emerald-400' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400',
          )}
          aria-label={enabled ? t('disableBank') : t('enableBank')}
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            enabled && 'translate-x-6',
          )} />
        </button>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.total}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('transactionsShort')}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{stat.income_count}</p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('income')}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">{stat.expense_count}</p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('expenses')}</p>
        </div>
      </div>

      {/* Amounts + last sync */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatAmount(stat.total_income, lang)}</span>
          {' / '}
          <span className="text-red-500 dark:text-red-400 font-medium">-{formatAmount(stat.total_expense, lang)}</span>
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(stat.last_sync, lang)}</span>
        </div>
      </div>

      {/* Real account balance */}
      <div className="mt-3 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/60 px-3 py-2.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          {t('accountBalance')}
        </p>
        {stat.accounts && stat.accounts.some(a => a.balance !== null && a.balance !== undefined) ? (
          stat.accounts
            .filter(a => a.balance !== null && a.balance !== undefined)
            .map((a, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {a.account_number || t('mainAccount')}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatAmount(a.balance, lang)}
                </span>
              </div>
            ))
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
            {t('balanceUnavailableNote')}
          </p>
        )}
      </div>

      {!enabled && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t('bankDisabledNote')}</span>
        </div>
      )}
    </motion.div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorks({ t }) {
  const [open, setOpen] = useState(false);

  const steps = [
    t('howItWorksStep1'),
    t('howItWorksStep2'),
    t('howItWorksStep3'),
    t('howItWorksStep4'),
  ];

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          {t('howItWorks')}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5 space-y-3 text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="space-y-2">
            {steps.map((text, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">{t('manualSyncTitle')}</p>
            <code className="text-xs text-blue-600 dark:text-blue-400">node sync.js</code>
            <span className="text-xs text-blue-500 dark:text-blue-500 mx-2">{t('manualSyncOr')}</span>
            <code className="text-xs text-blue-600 dark:text-blue-400">{t('doubleClickBat')}</code>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">{t('mobileTrigger')}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {t('mobileTriggerNote')}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Remote trigger ────────────────────────────────────────────────────────────
function TriggerSection({ t }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');

  async function handleTrigger() {
    if (!url.trim() || !key.trim()) {
      setMsg(t('enterServerAndKey'));
      setStatus('error');
      return;
    }
    setStatus('loading');
    setMsg('');
    try {
      const endpoint = url.replace(/\/+$/, '') + '/trigger';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'X-API-Key': key.trim() },
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('ok');
        setMsg(t('syncStarted'));
      } else {
        setStatus('error');
        setMsg(data.error || t('errorStatus', { status: res.status }));
      }
    } catch {
      setStatus('error');
      setMsg(t('cannotConnect'));
    }
  }

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-purple-500" />
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{t('remoteTrigger')}</p>
      </div>
      <div className="space-y-2">
        <input
          type="url"
          placeholder="http://192.168.1.x:3001"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          dir="ltr"
        />
        <input
          type="password"
          placeholder="TRIGGER_API_KEY"
          value={key}
          onChange={e => setKey(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          dir="ltr"
        />
      </div>
      <button
        onClick={handleTrigger}
        disabled={status === 'loading'}
        className={cn(
          'mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
          status === 'loading'
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 text-white',
        )}
      >
        {status === 'loading'
          ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />{t('syncing')}</span>
          : t('syncNow')}
      </button>
      {msg && (
        <div className={cn(
          'mt-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2',
          status === 'ok'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300',
        )}>
          {status === 'ok'
            ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
          <span>{msg}</span>
        </div>
      )}
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 text-center">
        {t('serverSessionNote')}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BankSyncPage() {
  const { t, currentLanguage } = useTranslation('bankSync');
  const [toggles, setToggles] = useState(loadToggles);

  const { data: sources = [], isLoading, error, refetch } = useQuery({
    queryKey: ['bankSyncStats'],
    queryFn: fetchBankStats,
    staleTime: 60_000,
  });

  // Default new sources to enabled
  useEffect(() => {
    if (!sources.length) return;
    setToggles(prev => {
      const next = { ...prev };
      let changed = false;
      for (const s of sources) {
        if (next[s.source] === undefined) { next[s.source] = true; changed = true; }
      }
      if (changed) { saveToggles(next); return next; }
      return prev;
    });
  }, [sources]);

  const handleToggle = useCallback((source) => {
    setToggles(prev => {
      const next = { ...prev, [source]: !prev[source] };
      saveToggles(next);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-5 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="mr-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={t('refresh')}
            >
              <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4 lg:px-8">

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t('loadError')}</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && sources.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-6"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notSynced')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('runScraper')}</p>
          </motion.div>
        )}

        {/* Bank cards */}
        {sources.map(stat => (
          <BankCard
            key={stat.source}
            stat={stat}
            enabled={toggles[stat.source] !== false}
            onToggle={() => handleToggle(stat.source)}
            t={t}
            lang={currentLanguage}
          />
        ))}

        {/* Remote trigger */}
        <TriggerSection t={t} />

        {/* How it works */}
        <HowItWorks t={t} />

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-2">
          {t('toggleNote')}
        </p>
      </div>
    </div>
  );
}
