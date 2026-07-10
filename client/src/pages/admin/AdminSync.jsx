/**
 * AdminSync — bank-sync visibility for admins.
 * Shows every bank/card connection with its live health, plus the most recent
 * worker jobs, so the sync flow (server → claim → worker → DB) is debuggable.
 * Consumes GET /admin/bank-sync (adminController.getBankSync).
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, RefreshCw, Landmark, CreditCard,
  AlertTriangle, CheckCircle2, Clock, CalendarClock,
} from 'lucide-react';
import { useTranslation } from '../../stores';
import { api } from '../../api';
import { LoadingSpinner } from '../../components/ui';
import AdminTabsNav from '../../components/features/admin/AdminTabsNav';
import { cn } from '../../utils/helpers';
import { institutionLabel, institutionKind } from '../../components/features/bankSync/bankSyncMeta';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const STATUS_PILL = {
  active:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  paused:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  error:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const JOB_PILL = {
  done:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  failed:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const pill = (map, key) => map[key] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';

const KindIcon = ({ source }) =>
  institutionKind(source) === 'credit_card'
    ? <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
    : <Landmark className="w-3.5 h-3.5 text-gray-400 shrink-0" />;

const AdminSync = () => {
  const { t, isRTL } = useTranslation('admin');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connections, setConnections] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [error, setError]           = useState(null);

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.admin.getBankSync();
      if (res.success) {
        setConnections(res.data?.connections || []);
        setJobs(res.data?.jobs || []);
        setError(null);
      } else {
        setError(res.error?.message || 'Failed to load');
        setConnections([]); setJobs([]);
      }
    } catch {
      setError('Failed to load bank-sync data');
      setConnections([]); setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dayAgo = Date.now() - 86_400_000;
  const pills = [
    { label: t('sync.connections', { fallback: 'Connections' }), value: connections.length,
      color: 'text-gray-700 dark:text-gray-200', bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: t('sync.active', { fallback: 'Active' }), value: connections.filter(c => c.status === 'active').length,
      color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('sync.errors', { fallback: 'Errors' }), value: connections.filter(c => c.status === 'error').length,
      color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: t('sync.jobs24h', { fallback: 'Jobs 24h' }), value: jobs.filter(j => j.requested_at && new Date(j.requested_at).getTime() > dayAgo).length,
      color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('sync.failed24h', { fallback: 'Failed 24h' }), value: jobs.filter(j => j.status === 'failed' && j.requested_at && new Date(j.requested_at).getTime() > dayAgo).length,
      color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  const userName = (row) =>
    (row.user_first_name || row.user_last_name)
      ? `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim()
      : (row.user_email || `#${row.user_id}`);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-1.5 -ms-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0">
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">
              {t('sync.title', { fallback: 'Bank Sync' })}
            </h1>
            <button
              onClick={() => load(false)}
              disabled={loading || refreshing}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            </button>
          </div>

          <AdminTabsNav className="mt-3" />

          <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {pills.map(({ label, value, color, bg }) => (
              <div key={label} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0', bg)}>
                <span className={cn('text-sm font-bold tabular-nums', color)}>{value}</span>
                <span className={cn('text-xs font-medium opacity-90', color)}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-500">{error}</div>
        ) : (
          <>
            {/* ── Connections ─────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t('sync.connectionsTitle', { fallback: 'Connections' })}
              </h2>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {connections.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">{t('sync.noConnections', { fallback: 'No connections' })}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                          {['User', 'Source', 'Status', 'Fails', 'Cycle', 'Last sync', 'Last error'].map(col => (
                            <th key={col} className="px-3 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {connections.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors align-top">
                            <td className="px-3 py-2.5 text-sm">
                              <div className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{userName(c)}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[160px]">{c.user_email}</div>
                            </td>
                            <td className="px-3 py-2.5 text-sm">
                              <div className="flex items-center gap-1.5">
                                <KindIcon source={c.bank_source} />
                                <span className="font-medium text-gray-900 dark:text-white">{institutionLabel(c.bank_source)}</span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {c.has_balance ? `₪${Number(c.balance).toLocaleString()}` : t('sync.noBalance', { fallback: 'no balance' })}
                                {c.accounts_count ? ` · ${c.accounts_count} acct` : ''}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', pill(STATUS_PILL, c.status))}>
                                {c.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : c.status === 'error' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {c.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-sm tabular-nums">
                              <span className={cn(c.consecutive_failures > 0 ? 'text-red-500 font-bold' : 'text-gray-400')}>
                                {c.consecutive_failures ?? 0}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" />{c.billing_cycle_day ?? '—'}</span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(c.last_sync_at)}</td>
                            <td className="px-3 py-2.5 text-xs text-red-500 max-w-[220px] truncate" title={c.last_error || ''}>{c.last_error || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* ── Recent jobs ─────────────────────────────────────── */}
            <section>
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t('sync.jobsTitle', { fallback: 'Recent worker jobs' })}
              </h2>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                {jobs.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">{t('sync.noJobs', { fallback: 'No jobs yet' })}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
                          {['#', 'User', 'Source', 'Trigger', 'Status', 'Requested', 'Duration', 'Result'].map(col => (
                            <th key={col} className="px-3 py-2.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {jobs.map(j => {
                          const r = j.result || {};
                          const resultText = j.status === 'failed'
                            ? (r.error || r.code || 'failed')
                            : (r.inserted != null ? `+${r.inserted}${r.skipped != null ? ` / ${r.skipped} skip` : ''}` : '—');
                          return (
                            <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-3 py-2.5 text-xs text-gray-400 tabular-nums">{j.id}</td>
                              <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{j.user_email || `#${j.user_id}`}</td>
                              <td className="px-3 py-2.5 text-sm">
                                <span className="inline-flex items-center gap-1.5 text-gray-900 dark:text-white">
                                  <KindIcon source={j.bank_source} />{institutionLabel(j.bank_source)}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">{j.trigger}</td>
                              <td className="px-3 py-2.5">
                                <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', pill(JOB_PILL, j.status))}>{j.status}</span>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmt(j.requested_at)}</td>
                              <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                {j.duration_seconds != null ? `${Math.round(j.duration_seconds)}s` : '—'}
                              </td>
                              <td className={cn('px-3 py-2.5 text-xs max-w-[200px] truncate', j.status === 'failed' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400')} title={typeof resultText === 'string' ? resultText : ''}>
                                {resultText}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSync;
