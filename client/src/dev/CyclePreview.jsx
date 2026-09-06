// Dev-only visual and interaction harness. Never loads an authenticated account.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../index.css';
import en from '../translations/en/dashboard';
import he from '../translations/he/dashboard';
import { useTranslationStore } from '../stores/translationStore';
import {
  currentCycleQueryKey,
  CYCLE_QUERY_VERSION,
  useCurrentCycleWorkspace,
} from '../hooks/useCycles';
import cyclesApi from '../api/cycles';
import apiClient from '../api/client';
import useAuthStore from '../stores/authStore';
import { FinancialCycleWorkspaceView } from '../pages/FinancialCyclePageV2';
import FinancialCycleSnapshotV2 from '../components/features/dashboard/FinancialCycleSnapshotV2';
import OverdraftRunwayCard from '../components/features/dashboard/OverdraftRunwayCard';
import { CYCLE, SETTINGS, GROUPS, DECISIONS, LOANS } from './cycleFixture';

const client = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});
// Match the paint-cache identity without changing login state or loading its data.
const previewUserId = useAuthStore.getState().user?.id;
const currentKey = currentCycleQueryKey(previewUserId);
const controlKey = ['cycles', previewUserId, 'control', CYCLE_QUERY_VERSION];
const bankSources = [
  {
    source: 'leumi',
    kind: 'bank',
    accounts: [{ account_number: '4444', enabled: true, balance: 3400 }],
  },
];
client.setQueryData(['bankSyncStats', previewUserId], bankSources);
// Even a manual refresh or stale balance query must remain entirely synthetic.
apiClient.client.defaults.adapter = async (config) => {
  if (config.url === '/bank-sync/stats') {
    return {
      data: { sources: bankSources },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  }
  throw new Error(
    `Synthetic cycle preview blocked an unsupported request: ${config.url}`,
  );
};
client.setQueryData(currentKey, {
  data: {
    status: 'ok',
    cycle: CYCLE,
    settings: SETTINGS,
    recurringGroups: GROUPS,
  },
});
client.setQueryData(controlKey, {
  data: {
    status: 'ok',
    decisions: DECISIONS,
    loans: LOANS,
    recurring: [],
    totalOutstanding: 10000,
    settings: SETTINGS,
    recurringGroups: GROUPS,
  },
});
const pause = () => new Promise((resolve) => setTimeout(resolve, 250));
const update = (fn) =>
  client.setQueriesData({ queryKey: ['cycles', previewUserId] }, (cached) =>
    cached?.data ? { data: fn(cached.data) } : cached,
  );
cyclesApi.updateSettings = async (patch) => {
  await pause();
  update((data) => ({ ...data, settings: { ...data.settings, ...patch } }));
  return { data: client.getQueryData(currentKey).data.settings };
};
cyclesApi.updateCardSettings = async () => {
  await pause();
  return { data: {} };
};
cyclesApi.updateRecurringGroup = async (id, patch) => {
  await pause();
  update((data) => ({
    ...data,
    recurringGroups: data.recurringGroups
      .filter((group) => !(group.id === id && patch.active === false))
      .map((group) => (group.id === id ? { ...group, ...patch } : group)),
  }));
  return {
    data: client
      .getQueryData(currentKey)
      .data.recurringGroups.find((group) => group.id === id) || {
      id,
      active: false,
    },
  };
};
cyclesApi.classifyTransaction = async (transactionId, payload) => {
  await pause();
  const tx = DECISIONS.find((item) => item.transactionId === transactionId);
  const matcher = {
    transactionId,
    description: tx.description,
    source: tx.source,
    accountLast4: tx.accountNumber,
    amount: tx.amount,
    date: tx.date,
  };
  update((data) => ({
    ...data,
    decisions: data.decisions?.filter(
      (item) => item.transactionId !== transactionId,
    ),
    recurringGroups: payload.recurrenceGroupId
      ? data.recurringGroups.map((group) =>
          group.id === payload.recurrenceGroupId
            ? { ...group, matchers: [...group.matchers, matcher] }
            : group,
        )
      : [
          ...data.recurringGroups,
          {
            id: `sample-${transactionId}`,
            label: payload.recurrenceLabel,
            recurrenceKind: payload.classification,
            includeInEstimate: true,
            matchers: [matcher],
          },
        ],
  }));
  return { data: {} };
};
cyclesApi.current = async () => client.getQueryData(currentKey);
cyclesApi.control = async () => client.getQueryData(controlKey);
const formatCurrency = (value) =>
  `₪${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const makeT =
  (dict) =>
  (key, values = {}) => {
    const value = key.split('.').reduce((node, part) => node?.[part], dict);
    return typeof value === 'string'
      ? value.replace(/\{\{(\w+)\}\}/g, (_, name) => values[name] ?? '')
      : key;
  };

function Preview() {
  const [lang, setLang] = useState('he');
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [tab, setTab] = useState('overview');
  const workspace = useCurrentCycleWorkspace();
  const t = makeT(lang === 'he' ? he : en);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    useTranslationStore.setState({
      currentLanguage: lang,
      isRTL: lang === 'he',
      loadedModules: { 'he.dashboard': he, 'en.dashboard': en },
    });
  }, [dark, lang]);
  return (
    <div className="min-h-screen bg-slate-50 font-sans dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 p-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="me-auto">Synthetic preview · no live account</span>
        <button
          className="rounded-lg bg-slate-200 p-2 dark:bg-slate-800"
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          {lang === 'he' ? 'English' : 'עברית'}
        </button>
        <button
          className="rounded-lg bg-slate-200 p-2 dark:bg-slate-800"
          onClick={() => setDark(!dark)}
        >
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      {page === 'dashboard' ? (
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
          <FinancialCycleSnapshotV2
            {...workspace}
            language={lang}
            formatCurrency={formatCurrency}
            t={t}
            onOpen={() => setPage('cycle')}
            onEstimateChange={(useEstimates) =>
              workspace.updateCycleSettings({ useEstimates })
            }
            isSaving={workspace.isUpdatingSettings}
          />
          <OverdraftRunwayCard
            cycle={workspace.cycle}
            settings={workspace.settings}
            formatCurrency={formatCurrency}
            t={t}
            onSaveLimit={(overdraftLimit) =>
              workspace.updateCycleSettingsAsync({ overdraftLimit })
            }
            isSaving={workspace.isUpdatingSettings}
          />
        </div>
      ) : (
        <FinancialCycleWorkspaceView
          workspace={workspace}
          tab={tab}
          onTabChange={setTab}
          onBack={() => setPage('dashboard')}
          onConnect={() => {}}
          formatCurrency={formatCurrency}
          language={lang}
          t={t}
        />
      )}
    </div>
  );
}

const root =
  globalThis.__spendWiseCyclePreviewRoot ||
  createRoot(document.getElementById('preview-root'));
globalThis.__spendWiseCyclePreviewRoot = root;
root.render(
  <QueryClientProvider client={client}>
    <Preview />
  </QueryClientProvider>,
);
