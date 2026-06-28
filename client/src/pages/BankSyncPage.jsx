/**
 * Bank Sync Page — control panel for bank-scraper integration.
 * Shows per-source stats, toggle per bank, and setup instructions.
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

// ── Source display metadata ───────────────────────────────────────────────────
const SOURCE_META = {
  yahav: { label: 'בנק יהב', labelEn: 'Yahav Bank', color: '#1a6b3a', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  isracard: { label: 'ישראכרט', labelEn: 'Isracard', color: '#c0392b', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  max: { label: 'מקס', labelEn: 'Max', color: '#1565c0', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  discount: { label: 'דיסקונט', labelEn: 'Discount Bank', color: '#e65100', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
};

function getMeta(source) {
  return SOURCE_META[source] || {
    label: source,
    labelEn: source,
    color: '#6b7280',
    bg: 'bg-gray-50 dark:bg-gray-800/30',
    border: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAmount(n) {
  return Number(n || 0).toLocaleString('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
}

// ── Toggle persistence ────────────────────────────────────────────────────────
function loadToggles() {
  try { return JSON.parse(localStorage.getItem('bankSyncToggles') || '{}'); } catch { return {}; }
}
function saveToggles(t) {
  try { localStorage.setItem('bankSyncToggles', JSON.stringify(t)); } catch {}
}

// ── Bank card component ───────────────────────────────────────────────────────
function BankCard({ stat, enabled, onToggle }) {
  const meta = getMeta(stat.source);

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
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <Landmark className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{meta.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{meta.labelEn}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
            enabled ? 'bg-emerald-500 focus:ring-emerald-400' : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400',
          )}
          aria-label={enabled ? 'Disable bank' : 'Enable bank'}
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
          <p className="text-[11px] text-gray-500 dark:text-gray-400">עסקאות</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{stat.income_count}</p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">הכנסות</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">{stat.expense_count}</p>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">הוצאות</p>
        </div>
      </div>

      {/* Amounts */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatAmount(stat.total_income)}</span>
          {' '}/{' '}
          <span className="text-red-500 dark:text-red-400 font-medium">-{formatAmount(stat.total_expense)}</span>
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(stat.last_sync)}</span>
        </div>
      </div>

      {!enabled && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>עסקאות מבנק זה מוסתרות מהחישובים</span>
        </div>
      )}
    </motion.div>
  );
}

// ── How it works (collapsible) ────────────────────────────────────────────────
function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          איך זה עובד?
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
            {[
              { n: '1', text: 'bank-scraper רץ במחשב שלך (או שרת) ומתחבר לבנק' },
              { n: '2', text: 'הוא שולף עסקאות אחורה ל-30 יום ושולח לכאן אוטומטית' },
              { n: '3', text: 'עסקאות הבנק מופיעות ב-SpendWise כמו כל עסקה רגילה' },
              { n: '4', text: 'כפיל יתוסף פעם אחת בלבד — מנגנון dedup מונע כפילויות' },
            ].map(({ n, text }) => (
              <div key={n} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">{n}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">להפעיל סנכרון ידני</p>
            <code className="text-xs text-blue-600 dark:text-blue-400">node sync.js</code>
            <span className="text-xs text-blue-500 dark:text-blue-500 mx-2">או</span>
            <code className="text-xs text-blue-600 dark:text-blue-400">לחץ פעמיים על run.bat</code>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">טריגר מהמובייל</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">הפעל <code>node serve.js</code> במחשב, ולחץ "סנכרן עכשיו" מהאפליקציה</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Remote trigger ────────────────────────────────────────────────────────────
function TriggerSection() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [msg, setMsg] = useState('');

  async function handleTrigger() {
    if (!url.trim() || !key.trim()) {
      setMsg('הכנס כתובת שרת ו-API Key');
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
        setMsg('הסנכרון התחיל! הנתונים יופיעו כאן תוך כמה דקות');
      } else {
        setStatus('error');
        setMsg(data.error || `שגיאה: ${res.status}`);
      }
    } catch (e) {
      setStatus('error');
      setMsg('לא ניתן להתחבר לשרת — ודא שהוא פעיל');
    }
  }

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-purple-500" />
        <p className="font-semibold text-gray-900 dark:text-white text-sm">טריגר מרחוק (serve.js)</p>
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
          ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />מסנכרן...</span>
          : 'סנכרן עכשיו'}
      </button>
      {msg && (
        <div className={cn(
          'mt-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2',
          status === 'ok'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300',
        )}>
          {status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
          <span>{msg}</span>
        </div>
      )}
      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 text-center">
        השרת נשמר רק ב-session זה (לא נשלח לשרת SpendWise)
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BankSyncPage() {
  const { t } = useTranslation();
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">סנכרון בנק</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">bank-scraper integration</p>
            </div>
            <button
              onClick={() => refetch()}
              className="mr-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="רענן נתונים"
            >
              <RefreshCw className={cn('w-4 h-4 text-gray-400', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4 lg:px-8">

        {/* Synced banks */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>לא ניתן לטעון נתוני סנכרון</span>
          </div>
        )}

        {!isLoading && !error && sources.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 px-6"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">לא סונכרן אף בנק עדיין</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">הרץ את bank-scraper כדי לשלוף עסקאות</p>
          </motion.div>
        )}

        {sources.map(stat => (
          <BankCard
            key={stat.source}
            stat={stat}
            enabled={toggles[stat.source] !== false}
            onToggle={() => handleToggle(stat.source)}
          />
        ))}

        {/* Remote trigger */}
        <TriggerSection />

        {/* How it works */}
        <HowItWorks />

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-2">
          הטוגלים שומרים מה מוצג — הנתונים תמיד בבסיס הנתונים
        </p>
      </div>
    </div>
  );
}
