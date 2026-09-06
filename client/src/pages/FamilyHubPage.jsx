/**
 * Family Hub — the household's manual picture, at /family.
 *
 * Everything else in SpendWise is derived from what the banks already did. This
 * page is the opposite on purpose: two people sit down and type in what they
 * know — salaries, standing charges, the loans, the pensions — and the page
 * answers the one question the bank data cannot:
 *
 *     how much is actually left for us to live on this month?
 *
 * Access is decided by the server (`middleware/familyAccess.js`). The `familyHub`
 * flag on the user is only what decides whether the entry point is offered.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, RefreshCw } from 'lucide-react';

import BrandMark from '../components/common/BrandMark';
import { ConfirmModal, LiquidTabs, PageSkeleton } from '../components/ui';
import { useCurrency, useTranslation } from '../stores';
import useFamilyBudget from '../hooks/useFamilyBudget';
import FamilyOverviewPanel from '../components/features/family/FamilyOverviewPanel';
import FamilyFlowPanel from '../components/features/family/FamilyFlowPanel';
import FamilyAssetsPanel from '../components/features/family/FamilyAssetsPanel';
import FamilyItemModal from '../components/features/family/FamilyItemModal';
import FamilyBalanceModal from '../components/features/family/FamilyBalanceModal';

const TAB_IDS = ['overview', 'flow', 'assets'];

const initialTab = () => {
  try {
    const requested = new URLSearchParams(window.location.search).get('tab');
    return TAB_IDS.includes(requested) ? requested : 'overview';
  } catch (_) {
    return 'overview';
  }
};

export default function FamilyHubPage() {
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation('family');
  const { formatCurrency } = useCurrency();
  const family = useFamilyBudget();

  const [tab, setTab] = useState(initialTab);
  const [itemModal, setItemModal] = useState(null);     // { item?, kind, preset? }
  const [balanceModal, setBalanceModal] = useState(null); // { balance? }
  const [pendingDelete, setPendingDelete] = useState(null); // { type, row }

  const tabs = useMemo(() => TAB_IDS.map((id) => ({ id, label: t(`tabs.${id}`) })), [t]);

  const loans = useMemo(
    () => family.items.filter((item) => item.kind === 'loan'),
    [family.items],
  );

  if (family.forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Lock className="h-6 w-6 text-slate-400" />
          </div>
          <h1 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{t('forbidden.title')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('forbidden.body')}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-700"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (family.isLoading && !family.summary) return <PageSkeleton page="financial-cycle" />;

  const saveItem = async (payload) => {
    const editing = itemModal?.item;
    const result = editing
      ? await family.updateItem({ id: editing.id, ...payload })
      : await family.addItem(payload);
    if (result?.success) setItemModal(null);
  };

  const saveBalance = async (payload) => {
    const editing = balanceModal?.balance;
    const result = editing
      ? await family.updateBalance({ id: editing.id, ...payload })
      : await family.addBalance(payload);
    if (result?.success) setBalanceModal(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, row } = pendingDelete;
    const result = type === 'item'
      ? await family.deleteItem(row.id)
      : await family.deleteBalance(row.id);
    setPendingDelete(null);
    if (result?.success) {
      setItemModal(null);
      setBalanceModal(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950 lg:pb-10">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto max-w-6xl px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label={t('back')}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <BrandMark size="sm" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black text-slate-950 dark:text-white">{t('title')}</h1>
              <p className="truncate text-[11px] font-semibold text-slate-400">{t('subtitle')}</p>
            </div>
            {family.isSaving && (
              <span className="hidden text-[10px] font-bold text-indigo-500 sm:inline">{t('saving')}</span>
            )}
            <button
              type="button"
              onClick={() => family.refetch()}
              aria-label={t('refresh')}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${family.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 lg:px-8 lg:py-6">
        {family.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
            <p className="font-black text-rose-700 dark:text-rose-300">{t('loadError.title')}</p>
            <p className="mt-1 text-sm text-rose-600/80 dark:text-rose-300/80">{t('loadError.body')}</p>
            <button
              type="button"
              onClick={() => family.refetch()}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-black text-white"
            >
              {t('loadError.retry')}
            </button>
          </div>
        ) : (
          <>
            <LiquidTabs
              tabs={tabs}
              active={tab}
              onChange={setTab}
              fill
              size="sm"
              mobileCompact
              className="mb-4"
            />

            {tab === 'overview' && (
              <FamilyOverviewPanel
                summary={family.summary}
                members={family.members}
                formatCurrency={formatCurrency}
                t={t}
                hasRows={family.items.length > 0 || family.balances.length > 0}
                onGoToFlow={() => setTab('flow')}
                onGoToAssets={() => setTab('assets')}
                onAddFirst={() => setItemModal({ kind: 'income' })}
              />
            )}

            {tab === 'flow' && (
              <FamilyFlowPanel
                items={family.items}
                members={family.members}
                formatCurrency={formatCurrency}
                t={t}
                onAdd={(kind, preset) => setItemModal({ kind, preset })}
                onEdit={(item) => setItemModal({ item, kind: item.kind })}
              />
            )}

            {tab === 'assets' && (
              <FamilyAssetsPanel
                balances={family.balances}
                loans={loans}
                summary={family.summary}
                members={family.members}
                formatCurrency={formatCurrency}
                t={t}
                language={currentLanguage}
                onAddBalance={() => setBalanceModal({})}
                onEditBalance={(balance) => setBalanceModal({ balance })}
              />
            )}
          </>
        )}
      </main>

      <FamilyItemModal
        isOpen={!!itemModal}
        onClose={() => setItemModal(null)}
        onSave={saveItem}
        onDelete={(item) => setPendingDelete({ type: 'item', row: item })}
        item={itemModal?.item}
        preset={itemModal?.preset}
        defaultKind={itemModal?.kind || 'fixed'}
        members={family.members}
        isSaving={family.isSaving}
      />

      <FamilyBalanceModal
        isOpen={!!balanceModal}
        onClose={() => setBalanceModal(null)}
        onSave={saveBalance}
        onDelete={(balance) => setPendingDelete({ type: 'balance', row: balance })}
        balance={balanceModal?.balance}
        members={family.members}
        isSaving={family.isSaving}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={t('form.remove')}
        message={t('form.removeConfirm', { name: pendingDelete?.row?.name || '' })}
        confirmText={t('form.remove')}
        cancelText={t('form.cancel')}
        variant="danger"
      />
    </div>
  );
}
