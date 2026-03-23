/**
 * 🔁 RECURRING MANAGER PANEL
 * SideDrawer (desktop) + BottomSheet (mobile)
 * All functionality preserved, clean JSX structure
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  Repeat, Plus, Search, Play, Pause, Edit, Trash2,
  DollarSign, AlertTriangle, StopCircle,
} from 'lucide-react';

import { useTranslation, useNotifications, useCurrency } from '../../../../stores';
import { useRecurringTransactions } from '../../../../hooks/useRecurringTransactions';
import { Button, Input, LoadingSpinner, Badge, Modal } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';
import RecurringSetupModal from '../modals/RecurringSetupModal';

// ── Compact stats bar ─────────────────────────────────────────────────────────
const StatsBar = ({ summary }) => {
  const { formatCurrency } = useCurrency();
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        <span className="font-semibold text-gray-900 dark:text-white">{summary.totalActive}</span>
        <span className="text-gray-500 dark:text-gray-400">active</span>
      </div>
      {summary.totalPaused > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          <span className="font-semibold text-gray-900 dark:text-white">{summary.totalPaused}</span>
          <span className="text-gray-500 dark:text-gray-400">paused</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 ml-auto">
        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(summary.totalAmount)}</span>
        <span className="text-gray-500 dark:text-gray-400">/mo</span>
      </div>
    </div>
  );
};

// ── Template Card ─────────────────────────────────────────────────────────────
const TemplateCard = ({ template, onEdit, onToggleStatus, onDelete }) => {
  const { t, isRTL } = useTranslation();
  const { formatCurrency } = useCurrency();
  const isActive = template.is_active;
  const isIncome = template.type === 'income';

  return (
    <div className={cn(
      'relative rounded-xl p-4 sm:p-5 shadow-md border-2 transition-all duration-200',
      'bg-white dark:bg-gray-800',
      isActive ? 'border-purple-200 dark:border-purple-800' : 'border-gray-200 dark:border-gray-700 opacity-70'
    )}>
      {/* Status dot */}
      <div className={cn('absolute top-3', isRTL ? 'left-3' : 'right-3')}>
        <div className={cn('w-2.5 h-2.5 rounded-full', isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0',
          isIncome ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
        )}>
          <Repeat className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-4">
            {template.description || template.name || t('transactions.noDescription', 'No description')}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant={isIncome ? 'success' : 'destructive'} className="text-xs px-1.5 py-0.5">
              {isIncome ? t('types.income', 'Income') : t('types.expense', 'Expense')}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {t(`recurringManager.frequency.${template.interval_type}`, template.interval_type || 'monthly')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className={cn('text-xl font-bold mb-3 tabular-nums', isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(template.amount))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 dark:text-gray-500">{t('recurringManager.created', 'Created')}</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {dateHelpers.formatMedium(new Date(template.created_at))}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 dark:text-gray-500">{t('recurringManager.nextRun', 'Next Run')}</p>
          <p className={cn("font-medium truncate", !isActive ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-white")}>
            {!isActive
              ? t('actions.pause', 'Paused')
              : template.next_run
                ? dateHelpers.formatMedium(new Date(template.next_run))
                : t('recurringManager.indefinite', 'Ongoing')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(template)}
          className={cn(
            'text-xs min-h-[36px] px-2',
            isActive ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
          )}
        >
          {isActive ? <><Pause className="w-3.5 h-3.5 mr-1" />{t('actions.pause', 'Pause')}</> : <><Play className="w-3.5 h-3.5 mr-1" />{t('actions.resume', 'Resume')}</>}
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(template)}
            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[36px] min-w-[36px] p-0">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(template)}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[36px] min-w-[36px] p-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteScopeModal = ({ isOpen, template, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={t('recurring.deleteTemplate', 'Remove Recurring Schedule')} size="sm">
      <div className="px-4 pb-5 space-y-3">
        {/* Context */}
        {template && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <Repeat className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {template.description || template.name}
            </span>
          </div>
        )}

        {/* Recommended: stop only */}
        <button
          onClick={() => onConfirm('template_only')}
          className="w-full text-left p-4 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-1">
            <StopCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold text-sm text-blue-800 dark:text-blue-200">
              {t('recurring.deleteTemplateOnly', 'Stop future payments')}
            </span>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/60 px-1.5 py-0.5 rounded">
              {t('common.recommended', 'Recommended')}
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 pl-6">
            {t('recurring.deleteTemplateOnlyDesc', 'Keeps your existing transaction history intact')}
          </p>
        </button>

        {/* Danger: delete all */}
        <button
          onClick={() => onConfirm('all')}
          className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold text-sm text-red-600 dark:text-red-400">
              {t('recurring.deleteAll', 'Delete everything')}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">
            {t('recurring.deleteAllDesc', 'Permanently removes this schedule and all its transaction history')}
          </p>
        </button>

        {/* Cancel */}
        <Button variant="ghost" size="sm" onClick={onCancel} className="w-full mt-1 text-gray-500">
          {t('common.cancel', 'Cancel')}
        </Button>
      </div>
    </Modal>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────
const ModernRecurringManagerPanel = ({ isOpen = false, onClose = () => {} }) => {
  const { t, isRTL } = useTranslation();
  const { addNotification } = useNotifications();

  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate]       = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const { recurringTransactions, isLoading: templatesLoading, refetch: refetchTemplates, updateRecurring, deleteRecurring } = useRecurringTransactions();

  // Filtered list
  const filteredTemplates = useMemo(() => {
    if (!recurringTransactions) return [];
    return recurringTransactions.filter(tmpl => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!tmpl.description?.toLowerCase().includes(q) && !tmpl.category_name?.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === 'active' && !tmpl.is_active) return false;
      if (statusFilter === 'paused' && tmpl.is_active) return false;
      return true;
    });
  }, [recurringTransactions, searchQuery, statusFilter]);

  // Stats
  const summary = useMemo(() => {
    const active  = filteredTemplates.filter(t => t.is_active);
    const paused  = filteredTemplates.filter(t => !t.is_active);
    const total   = active.reduce((s, t) => s + Math.abs(t.amount), 0);
    return { totalActive: active.length, totalPaused: paused.length, totalAmount: total, avgAmount: active.length ? total / active.length : 0 };
  }, [filteredTemplates]);

  // Handlers
  const handleEdit   = useCallback((tmpl) => { setEditTemplate(tmpl); setShowCreateModal(true); }, []);
  const handleDelete = useCallback((tmpl) => { setTemplateToDelete(tmpl); setShowDeleteModal(true); }, []);

  const handleToggleStatus = useCallback(async (tmpl) => {
    try {
      await updateRecurring(tmpl.id, { is_active: !tmpl.is_active });
      addNotification({ type: 'success', message: t('recurring.statusUpdated', 'Status updated'), duration: 3000 });
      refetchTemplates();
    } catch {
      addNotification({ type: 'error', message: t('recurring.statusUpdateFailed', 'Failed to update status'), duration: 5000 });
    }
  }, [updateRecurring, addNotification, t, refetchTemplates]);

  const handleDeleteConfirm = useCallback(async (scope) => {
    if (!templateToDelete) return;
    try {
      await deleteRecurring(templateToDelete.id, { scope });
      addNotification({ type: 'success', message: t('recurring.deleteSuccess', 'Template deleted'), duration: 3000 });
      refetchTemplates();
    } catch {
      addNotification({ type: 'error', message: t('recurring.deleteFailed', 'Failed to delete template'), duration: 5000 });
    } finally {
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    }
  }, [templateToDelete, deleteRecurring, addNotification, t, refetchTemplates]);

  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    setEditTemplate(null);
    refetchTemplates();
    addNotification({ type: 'success', message: t('recurring.templateSaved', 'Template saved'), duration: 3000 });
  }, [addNotification, t, refetchTemplates]);

  // Shared panel content (no internal header — BottomSheet/SideDrawer provides title + close)
  const panelContent = (
    <div className="flex flex-col h-full" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>

      {/* Compact stats */}
      <StatsBar summary={summary} />

      {/* Filters + Add button */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('recurringManager.searchPlaceholder', 'Search...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm rounded-xl"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <Button
            onClick={() => { setEditTemplate(null); setShowCreateModal(true); }}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-3">
        {templatesLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
              <Repeat className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery || statusFilter !== 'all'
                ? t('recurringManager.noMatches', 'No Matching Templates')
                : t('recurringManager.noRecurring', 'No Recurring Templates')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
              {searchQuery || statusFilter !== 'all'
                ? t('recurringManager.noMatchesDesc', 'Try adjusting your filters')
                : t('recurringManager.noRecurringDesc', 'Create recurring transactions to automate your finance tracking')}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => { setEditTemplate(null); setShowCreateModal(true); }}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                {t('recurringManager.addFirst', 'Add First Template')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('recurringManager.title', 'Recurring Manager')}
        sheet
        drawerWidth={780}
      >
        {panelContent}
      </Modal>

      {/* Modals rendered at root level — no z-index conflicts */}
      <RecurringSetupModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditTemplate(null); }}
        onSuccess={handleCreateSuccess}
        initialData={editTemplate}
        mode={editTemplate ? 'edit' : 'create'}
      />

      <DeleteScopeModal
        isOpen={showDeleteModal}
        template={templateToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowDeleteModal(false); setTemplateToDelete(null); }}
      />
    </>
  );
};

export default ModernRecurringManagerPanel;
