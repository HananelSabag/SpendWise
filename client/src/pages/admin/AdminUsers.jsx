import React, { useState, useMemo, useCallback, startTransition, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Users, Shield, Crown, User, Ban, Trash2,
  CheckCircle, XCircle, RefreshCw, MailCheck
} from 'lucide-react';

import { useAuth, useTranslation, useNotifications, useCurrency } from '../../stores';
import { api } from '../../api';
import { Button, Badge, Dropdown, Modal, Avatar, PageSkeleton } from '../../components/ui';
import ModernUsersTable from '../../components/features/admin/ModernUsersTable.jsx';
import AdminTabsNav from '../../components/features/admin/AdminTabsNav';
import { cn } from '../../utils/helpers';

const AdminUsers = () => {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const { t, isRTL } = useTranslation('admin');
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  const formatUserAmount = useCallback((amount, currency) => {
    return formatCurrency(amount || 0, { currency: currency || 'ILS' });
  }, [formatCurrency]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingRoleUser, setPendingRoleUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');

  const queryClient = useQueryClient();

  const { data: usersData, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const result = await api.admin.users.getAll({});
      if (!result.success) throw new Error(result.error?.message || 'Failed to load users');
      return result;
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isError) addNotification({ type: 'error', message: t('errors.usersLoadFailed') });
  }, [isError]); // eslint-disable-line

  const blockUserMutation = useMutation({
    mutationFn: async (userId) => {
      const result = await api.admin.blockUser(userId);
      if (!result.success) throw new Error(result.error?.message || 'Action failed');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      addNotification({ type: 'success', message: t('actions.userBlocked') });
      setActionLoading(null);
    },
    onError: (err) => {
      addNotification({ type: 'error', message: err.message });
      setActionLoading(null);
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId) => {
      const result = await api.admin.unblockUser(userId);
      if (!result.success) throw new Error(result.error?.message || 'Action failed');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      addNotification({ type: 'success', message: t('actions.userUnblocked') });
      setActionLoading(null);
    },
    onError: (err) => {
      addNotification({ type: 'error', message: err.message });
      setActionLoading(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, reason }) => {
      const result = await api.admin.deleteUser({ userId, reason });
      if (!result.success) throw new Error(result.error?.message || 'Failed to delete');
      return result.data;
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        setActionLoading(null);
        setShowUserModal(false);
        setShowDeleteDialog(false);
        setDeleteReason('');
        setPendingDeleteUserId(null);
      });
      addNotification({ type: 'success', message: t('actions.userDeleted') });
    },
    onError: (err) => {
      startTransition(() => setActionLoading(null));
      addNotification({ type: 'error', message: err.message });
    },
  });

  const users = usersData?.data?.users || [];
  const safeUsers = users.map(u => ({
    id: u.id,
    email: u.email || 'Unknown',
    username: u.username || 'Unknown',
    first_name: u.first_name || u.firstName || '',
    last_name: u.last_name || u.lastName || '',
    role: u.role || 'user',
    status: u.status || 'active',
    created_at: u.created_at || u.createdAt || new Date().toISOString(),
    email_verified: u.email_verified || u.emailVerified || false,
    avatar: u.avatar || u.profilePicture || null,
    total_transactions: u.total_transactions || 0,
    total_amount: u.total_amount || 0,
    currency_preference: u.currency_preference || 'ILS',
    last_login: u.last_login || null,
  }));

  const stats = useMemo(() => ({
    total: safeUsers.length,
    active: safeUsers.filter(u => u.status === 'active').length,
    blocked: safeUsers.filter(u => u.status === 'blocked').length,
    admins: safeUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
  }), [safeUsers]);

  const handleBlockUser   = (userId) => { setActionLoading(userId); blockUserMutation.mutate(userId); };
  const handleUnblockUser = (userId) => { setActionLoading(userId); unblockUserMutation.mutate(userId); };
  const handleDeleteUser  = (userId) => { setPendingDeleteUserId(userId); setDeleteReason(''); setShowDeleteDialog(true); };
  const confirmDeleteUser = () => {
    if (!pendingDeleteUserId) return;
    setActionLoading(pendingDeleteUserId);
    deleteUserMutation.mutate({ userId: pendingDeleteUserId, reason: deleteReason || undefined });
  };
  const openRoleDialog = (user) => { setPendingRoleUser(user); setSelectedRole(user.role || 'user'); setShowRoleDialog(true); };

  if (isLoading) return <PageSkeleton page="admin" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── Compact Header ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* Single row: back | icon + title | refresh */}
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-1.5 -ms-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
            >
              {isRTL
                ? <ArrowRight className="w-5 h-5" />
                : <ArrowLeft  className="w-5 h-5" />}
            </Link>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>

            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 truncate">
              {t('users.title')}
            </h1>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title={t('common.refresh')}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
            </button>
          </div>

          <AdminTabsNav className="mt-3" />

          {/* Compact stats pills */}
          <div
            className="flex gap-2 mt-3 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { key: 'total',   label: t('stats.totalUsers'), value: stats.total,   color: 'text-gray-700 dark:text-gray-200',    bg: 'bg-gray-100 dark:bg-gray-800' },
              { key: 'active',  label: t('status.active'),    value: stats.active,  color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20' },
              { key: 'blocked', label: t('status.blocked'),   value: stats.blocked, color: 'text-red-700 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20' },
              { key: 'admins',  label: t('roles.admin'),      value: stats.admins,  color: 'text-purple-700 dark:text-purple-400',bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map(({ key, label, value, color, bg }) => (
              <div key={key} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0', bg)}>
                <span className={cn('text-sm font-bold tabular-nums', color)}>{value}</span>
                <span className={cn('text-xs font-medium opacity-90', color)}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ModernUsersTable
          users={safeUsers}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          actionLoadingUserId={actionLoading}
          onOverview={(user) => { setSelectedUser(user); setShowUserModal(true); }}
          onRoleChange={openRoleDialog}
          onBlock={handleBlockUser}
          onUnblock={handleUnblockUser}
          onDelete={handleDeleteUser}
          onBulkAction={async (action, userIds) => {
            if (!userIds?.length) { addNotification({ type: 'warning', message: t('bulk.noSelection') }); return; }
            try {
              addNotification({ type: 'info', message: t('bulk.processing', { count: userIds.length }), duration: 2000 });
              const result = await api.admin.users.bulkManage(action, userIds);
              if (result.success) {
                const { successful, failed } = result.data;
                if (successful > 0) addNotification({ type: 'success', message: t('bulk.actionSuccess', { action, count: successful }), duration: 4000 });
                if (failed > 0) addNotification({ type: 'warning', message: t('bulk.actionError'), duration: 4000 });
                refetch();
              } else {
                throw new Error(result.error?.message || 'Bulk operation failed');
              }
            } catch {
              addNotification({ type: 'error', message: t('bulk.actionError') });
            }
          }}
        />
      </div>

      {/* ─── User Details Modal ───────────────────────────────────────── */}
      {selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => { setShowUserModal(false); setSelectedUser(null); }}
          title={t('users.userDetails')}
          sheet
          drawerWidth={520}
        >
          <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedUser.avatar}
                name={`${selectedUser.first_name} ${selectedUser.last_name}`}
                size="xl"
                className="ring-4 ring-gray-100 dark:ring-gray-800 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                  <span className="truncate">{selectedUser.email}</span>
                  {selectedUser.email_verified && <MailCheck className="w-4 h-4 text-green-500 shrink-0" />}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge
                    variant={selectedUser.role === 'super_admin' ? 'error' : selectedUser.role === 'admin' ? 'warning' : 'secondary'}
                    className="gap-1"
                  >
                    {selectedUser.role === 'super_admin' ? <Crown className="w-3 h-3" /> : selectedUser.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {selectedUser.role === 'super_admin' ? t('roles.superAdmin') : selectedUser.role === 'admin' ? t('roles.admin') : t('roles.user')}
                  </Badge>
                  <Badge variant={selectedUser.status === 'active' ? 'success' : selectedUser.status === 'blocked' ? 'error' : 'warning'} className="gap-1">
                    {selectedUser.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {t(`status.${selectedUser.status}`) || selectedUser.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('table.joinDate'),      value: new Date(selectedUser.created_at).toLocaleDateString() },
                { label: t('fields.lastLogin'),    value: selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : t('common.never') },
                { label: t('fields.transactionCount'), value: selectedUser.total_transactions || 0 },
                { label: t('fields.totalSpent'),   value: formatUserAmount(selectedUser.total_amount, selectedUser.currency_preference) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Delete Confirmation ──────────────────────────────────────── */}
      <Modal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title={t('dialogs.deleteUser.title')}
        size="sm"
      >
        <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
            {t('dialogs.deleteUser.message')}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('dialogs.deleteUser.reasonLabel')}
            </label>
            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={t('dialogs.deleteUser.reasonPlaceholder')}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
              {t('dialogs.deleteUser.cancel')}
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmDeleteUser} loading={actionLoading === pendingDeleteUserId}>
              {t('dialogs.deleteUser.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Role Change ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        title={t('dialogs.roleChange.title')}
        size="sm"
      >
        <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {t('dialogs.roleChange.message')}
          </p>
          <Dropdown
            label={t('dialogs.roleChange.selectLabel')}
            value={selectedRole}
            onChange={setSelectedRole}
            options={[
              { value: 'user',  label: t('roles.user') },
              { value: 'admin', label: t('roles.admin') },
            ]}
            fullWidth
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowRoleDialog(false)}>
              {t('dialogs.roleChange.cancel')}
            </Button>
            <Button
              className="flex-1"
              loading={actionLoading === pendingRoleUser?.id}
              onClick={async () => {
                if (!pendingRoleUser) return;
                setActionLoading(pendingRoleUser.id);
                try {
                  await api.client.post(`/admin/users/${pendingRoleUser.id}/manage`, {
                    action: 'change_role',
                    role: selectedRole,
                  });
                  queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                  addNotification({ type: 'success', message: t('dialogs.roleChange.success') });
                  setShowRoleDialog(false);
                } catch {
                  addNotification({ type: 'error', message: t('errors.actionFailed') });
                } finally {
                  setActionLoading(null);
                  setPendingRoleUser(null);
                }
              }}
            >
              {t('dialogs.roleChange.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
