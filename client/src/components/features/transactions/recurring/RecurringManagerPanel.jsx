/**
 * 🔄 RECURRING MANAGER PANEL - Full-Screen Control Center
 * Unified UX for managing recurring templates and upcoming instances
 * Features: Templates/Upcoming tabs, search, filters, inline actions, side-panel editor
 * @version 1.0.0
 */

import React, { useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Repeat,
  Calendar,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';

import { useTranslation, useNotifications, useCurrency } from '../../../../stores';
import { useRecurringTransactions } from '../../../../hooks/useRecurringTransactions';
import { useUpcomingTransactions } from '../../../../hooks/useUpcomingTransactions';
import spendWiseAPI, { api as unifiedApi } from '../../../../api';

import { Button, Card, Input, LoadingSpinner, Badge, Modal } from '../../../ui';
import { cn, dateHelpers } from '../../../../utils/helpers';
import RecurringSetupModal from '../modals/RecurringSetupModal';
import TemplateCard from './TemplateCard';
import UpcomingList from './UpcomingList';

const RecurringManagerPanel = ({ isOpen = false, onClose = () => {} }) => {
  const { t, isRTL } = useTranslation('transactions');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | paused
  const [typeFilter, setTypeFilter] = useState('all'); // all | income | expense
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  // Data
  const {
    recurringTransactions,
    stats: templateStats,
    loading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
    updateRecurring,
    deleteRecurring
  } = useRecurringTransactions();

  const {
    upcomingTransactions,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
    deleteUpcoming,
    stopGeneration
  } = useUpcomingTransactions();

  const filteredTemplates = useMemo(() => {
    const list = Array.isArray(recurringTransactions) ? recurringTransactions : [];
    return list.filter((tpl) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hit = (tpl.description || '').toLowerCase().includes(q) || (tpl.category_name || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (statusFilter !== 'all') {
        const isActive = tpl.status === 'active' || tpl.is_active === true;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'paused' && isActive) return false;
      }
      if (typeFilter !== 'all' && tpl.type !== typeFilter) return false;
      return true;
    });
  }, [recurringTransactions, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: templateStats.total || 0,
    active: templateStats.active || 0,
    paused: templateStats.paused || 0,
    upcoming: Array.isArray(upcomingTransactions) ? upcomingTransactions.length : 0
  }), [templateStats, upcomingTransactions]);

  const handlePauseResume = useCallback(async (tpl) => {
    const newStatus = (tpl.status === 'active' || tpl.is_active === true) ? 'paused' : 'active';
    try {
      await updateRecurring(tpl.id, { status: newStatus, is_active: newStatus === 'active' });
      addNotification({ type: 'success', message: t('recurringManager.statusUpdated', 'Status updated') });
      refetchTemplates();
    } catch (e) {
      addNotification({ type: 'error', message: t('recurringManager.statusUpdateFailed', 'Failed to update status') });
    }
  }, [updateRecurring, addNotification, t, refetchTemplates]);

  const handleDelete = useCallback(async (tpl) => {
    if (!confirm(t('recurringManager.confirmDelete', { name: tpl.description || tpl.name }))) return;
    try {
      await deleteRecurring(tpl.id);
      addNotification({ type: 'success', message: t('recurringManager.deleteSuccess', 'Recurring transaction deleted') });
      refetchTemplates();
      refetchUpcoming();
    } catch (e) {
      addNotification({ type: 'error', message: t('recurringManager.deleteFailed', 'Failed to delete recurring transaction') });
    }
  }, [deleteRecurring, addNotification, t, refetchTemplates, refetchUpcoming]);

  const handleRegenerate = useCallback(async (templateId) => {
    try {
      const res = await unifiedApi.transactions.regenerateUpcomingForTemplate(templateId);
      if (res.success) {
        addNotification({ type: 'success', message: t('upcoming.regenerated', 'Upcoming regenerated') });
        refetchUpcoming();
      } else {
        throw new Error(res.error?.message || 'Failed');
      }
    } catch (e) {
      addNotification({ type: 'error', message: t('upcoming.regenerateFailed', 'Failed to regenerate upcoming') });
    }
  }, [addNotification, t, refetchUpcoming]);

  const handleStopGeneration = useCallback(async (templateId) => {
    try {
      await stopGeneration(templateId);
      refetchUpcoming();
    } catch (e) {
      // stopGeneration hook already notifies
    }
  }, [stopGeneration, refetchUpcoming]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-4 sm:inset-8 rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Repeat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('recurringManager.title', 'Recurring Transactions Manager')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('recurringManager.subtitle', 'Manage your recurring transactions')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { refetchTemplates(); refetchUpcoming(); }}
                title={t('common.refresh', 'Refresh')}
              >
                <RefreshCw className={cn('w-4 h-4', (templatesLoading || upcomingLoading) && 'animate-spin')} />
              </Button>
              <Button variant="primary" onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                {t('recurringManager.addNew', 'Add New')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-500">{t('recurringManager.total', 'Total')}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">{stats.active}</div>
              <div className="text-xs text-gray-500">{t('recurringManager.active', 'Active')}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-orange-600">{stats.paused}</div>
              <div className="text-xs text-gray-500">{t('recurringManager.paused', 'Paused')}</div>
            </Card>
            <Card className="p-3 text-center">
              <div className="text-xl font-bold text-purple-600">{stats.upcoming}</div>
              <div className="text-xs text-gray-500">{t('upcoming.title', 'Upcoming Transactions')}</div>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400', isRTL ? 'right-3' : 'left-3')} />
              <Input
                placeholder={t('recurringManager.searchPlaceholder', 'Search recurring transactions...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn('w-full', isRTL ? 'pr-10' : 'pl-10')}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">{t('recurringManager.filter.allStatus', 'All Status')}</option>
              <option value="active">{t('recurringManager.filter.active', 'Active Only')}</option>
              <option value="paused">{t('recurringManager.filter.paused', 'Paused Only')}</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">{t('recurringManager.filter.allTypes', 'All Types')}</option>
              <option value="income">{t('transaction.type.income', 'Income')}</option>
              <option value="expense">{t('transaction.type.expense', 'Expense')}</option>
            </select>

            {/* Tabs */}
            <div className="ml-auto flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={activeTab === 'templates' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('templates')}
                className="flex items-center gap-1"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">{t('recurringManager.title', 'Templates')}</span>
              </Button>
              <Button
                variant={activeTab === 'upcoming' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('upcoming')}
                className="flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{t('upcoming.title', 'Upcoming')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activeTab === 'templates' && (
            <>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3">{t('recurringManager.loading', 'Loading recurring transactions...')}</span>
                </div>
              ) : templatesError ? (
                <div className="text-center py-16">
                  <div className="text-red-600 mb-3">{t('recurring.loadError', 'Failed to load recurring transactions')}</div>
                  <Button variant="outline" onClick={refetchTemplates}>{t('common.retry', 'Retry')}</Button>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Repeat className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('recurringManager.noRecurring', 'No Recurring Transactions')}</h3>
                  <p className="text-gray-500 mb-4">{t('recurringManager.noRecurringDesc', 'Create recurring transactions to automate your finance tracking')}</p>
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> {t('recurringManager.addFirst', 'Add First Recurring')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      onEdit={(t) => { setEditTemplate(t); }}
                      onDelete={handleDelete}
                      onPauseResume={handlePauseResume}
                      onRegenerate={() => handleRegenerate(tpl.id)}
                      onStop={() => handleStopGeneration(tpl.id)}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'upcoming' && (
            <UpcomingList
              upcoming={upcomingTransactions || []}
              isLoading={upcomingLoading}
              onDeleteUpcoming={deleteUpcoming}
              onRefetch={refetchUpcoming}
              formatCurrency={formatCurrency}
            />
          )}
        </div>

        {/* Editor Modals */}
        <RecurringSetupModal
          isOpen={!!editTemplate}
          onClose={() => setEditTemplate(null)}
          mode="edit"
          initialData={editTemplate || undefined}
          onSuccess={() => {
            setEditTemplate(null);
            refetchTemplates();
          }}
        />
        <RecurringSetupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
          onSuccess={() => {
            setShowCreateModal(false);
            refetchTemplates();
            refetchUpcoming();
          }}
        />
      </motion.div>
    </div>
  );
};

export default RecurringManagerPanel;


