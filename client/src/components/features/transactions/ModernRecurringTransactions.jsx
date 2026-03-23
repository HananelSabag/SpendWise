/**
 * 🔄 RECURRING TRANSACTIONS TAB CONTENT
 * Preview of recurring templates with quick actions.
 * Full management → opens RecurringManagerPanel (SideDrawer/BottomSheet).
 */

import React, { useMemo, useCallback } from 'react';
import {
  Settings, Plus, Edit, Trash2, Play, Pause,
  Repeat, DollarSign, CheckCircle
} from 'lucide-react';

import { useTranslation, useCurrency } from '../../../stores';
import { useRecurringTransactions } from '../../../hooks/useRecurringTransactions';
import { useTransactionActions } from '../../../hooks/useTransactionActions';
import { Button, Card, LoadingSpinner, Badge } from '../../ui';
import { cn, dateHelpers } from '../../../utils/helpers';

// ── Template Card ─────────────────────────────────────────────────────────────
const TemplateRow = ({ template, onEdit, onDelete, onToggle }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const isIncome = template.type === 'income';
  const isActive = template.is_active;

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border transition-colors',
      'bg-white dark:bg-gray-800',
      isActive ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-60'
    )}>
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        isIncome ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      )}>
        <Repeat className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {template.description || template.name}
          </span>
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {t(`recurringManager.frequency.${template.interval_type}`, template.interval_type)}
          </Badge>
          {!isActive && <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{t('recurringManager.filter.paused', 'Paused')}</Badge>}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {template.category_name}
          {template.next_run && ` • ${t('recurringManager.nextRun', 'Next')}: ${dateHelpers.formatMedium(new Date(template.next_run))}`}
        </div>
      </div>

      {/* Amount */}
      <div className={cn('font-bold text-sm tabular-nums whitespace-nowrap', isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
        {isIncome ? '+' : '−'}{formatCurrency(Math.abs(template.amount))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onToggle(template)}
          className={cn('p-1.5', isActive ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20')}>
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(template)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(template)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ModernRecurringTransactions = ({ onOpenRecurringManager }) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const { recurringTransactions: templates, isLoading, refetch } = useRecurringTransactions();
  const { updateRecurringTemplate, deleteTemplate } = useTransactionActions();

  const { activeTemplates, pausedTemplates, netMonthly } = useMemo(() => {
    if (!templates) return { activeTemplates: [], pausedTemplates: [], netMonthly: 0 };
    const active = templates.filter(t => t.is_active);
    const paused = templates.filter(t => !t.is_active);
    const net = active.reduce((sum, t) => {
      const n = Number(t.amount) || 0;
      return sum + (t.type === 'income' ? n : -n);
    }, 0);
    return { activeTemplates: active, pausedTemplates: paused, netMonthly: net };
  }, [templates]);

  const handleToggle = useCallback(async (tmpl) => {
    try { await updateRecurringTemplate(tmpl.id, { is_active: !tmpl.is_active }); refetch(); }
    catch { /* handled by hook */ }
  }, [updateRecurringTemplate, refetch]);

  // For edit → open manager panel (handles full edit flow)
  const handleEdit = useCallback((tmpl) => { onOpenRecurringManager(tmpl); }, [onOpenRecurringManager]);

  // For delete → open manager panel (handles scope selection)
  const handleDelete = useCallback(() => { onOpenRecurringManager(); }, [onOpenRecurringManager]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">{t('recurringManager.loading', 'Loading...')}</span>
      </div>
    );
  }

  if (!templates?.length) {
    return (
      <Card className="p-10 text-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
          <Repeat className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('recurringManager.noRecurring', 'No Recurring Templates')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
          {t('recurringManager.noRecurringDesc', 'Create recurring transactions to automate your finance tracking')}
        </p>
        <Button onClick={() => onOpenRecurringManager()}
          className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          {t('recurringManager.addFirst', 'Add First Template')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('transactions.recurring.title', 'Recurring Transactions')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {templates.length} {t('recurringManager.templates', 'templates')} • {t('recurringManager.active', 'Active')}: {activeTemplates.length}
            </p>
          </div>
        </div>
        <Button onClick={() => onOpenRecurringManager()}
          className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-sm">
          <Settings className="w-4 h-4 mr-2" />
          {t('recurringManager.title', 'Manage')}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('recurringManager.active', 'Active'),  value: activeTemplates.length, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
          { label: t('recurringManager.paused', 'Paused'),  value: pausedTemplates.length, icon: Pause,        color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' },
          { label: t('recurringManager.monthly', 'Monthly Net'), value: formatCurrency(Math.abs(netMonthly)), icon: DollarSign, color: netMonthly >= 0 ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 text-center">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5', color.split(' ').slice(1).join(' '))}>
              <Icon className={cn('w-4 h-4', color.split(' ')[0])} />
            </div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Active templates */}
      {activeTemplates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {t('recurringManager.active', 'Active')} ({activeTemplates.length})
          </h3>
          {activeTemplates.map(t => (
            <TemplateRow key={t.id} template={t} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* Paused templates */}
      {pausedTemplates.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Pause className="w-4 h-4 text-orange-500" />
            {t('recurringManager.paused', 'Paused')} ({pausedTemplates.length})
          </h3>
          {pausedTemplates.map(t => (
            <TemplateRow key={t.id} template={t} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModernRecurringTransactions;
