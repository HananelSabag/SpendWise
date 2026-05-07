import React, { useState, useMemo, useCallback, startTransition, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  ArrowLeft, Users, Shield, Crown, User, Ban, Trash2,
  CheckCircle, XCircle, RefreshCw, MailCheck
} from 'lucide-react';

import { useAuth, useTranslation, useNotifications, useCurrency } from '../../stores';
import { api } from '../../api';
import { Button, Badge, Dropdown, Modal, Avatar, PageSkeleton } from '../../components/ui';
import ModernUsersTable from '../../components/features/admin/ModernUsersTable.jsx';
import { cn } from '../../utils/helpers';

const AdminUsers = () => {
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const { t } = useTranslation('admin');
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
    if (isError) addNotification({ type: 'error', message: t('errors.usersLoadFailed', { fallback: 'Failed to load users' }) });
  }, [isError]); // eslint-disable-line

  const blockUserMutation = useMutation({
    mutationFn: async (userId) => {
      const result = await api.admin.blockUser(userId);
      if (!result.success) throw new Error(result.error?.message || 'Action failed');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      addNotification({ type: 'success', message: 'User blocked successfully' });
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
      addNotification({ type: 'success', message: 'User unblocked successfully' });
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
      addNotification({ type: 'success', message: 'User deleted successfully' });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ─── Hero Header ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">

          {/* Breadcrumb */}
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Admin Dashboard
          </Link>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  User Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Manage and monitor all platform users
                </p>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
              Refresh
            </button>
          </div>

          {/* Stats pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              {
                label: 'Total Users',
                value: stats.total,
                bg: 'bg-gray-50 dark:bg-gray-800',
                text: 'text-gray-900 dark:text-white',
                sub: 'text-gray-500 dark:text-gray-400',
              },
              {
                label: 'Active',
                value: stats.active,
                bg: 'bg-green-50 dark:bg-green-900/20',
                text: 'text-green-700 dark:text-green-400',
                sub: 'text-green-600/80 dark:text-green-500/80',
              },
              {
                label: 'Blocked',
                value: stats.blocked,
                bg: 'bg-red-50 dark:bg-red-900/20',
                text: 'text-red-700 dark:text-red-400',
                sub: 'text-red-600/80 dark:text-red-500/80',
              },
              {
                label: 'Admins',
                value: stats.admins,
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                text: 'text-purple-700 dark:text-purple-400',
                sub: 'text-purple-600/80 dark:text-purple-500/80',
              },
            ].map(({ label, value, bg, text, sub }) => (
              <div key={label} className={cn('rounded-2xl p-4', bg)}>
                <div className={cn('text-3xl font-bold tabular-nums', text)}>{value}</div>
                <div className={cn('text-xs font-medium mt-1', sub)}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            if (!userIds?.length) { addNotification({ type: 'warning', message: 'No users selected' }); return; }
            try {
              addNotification({ type: 'info', message: `Processing ${userIds.length} users…`, duration: 2000 });
              const result = await api.admin.users.bulkManage(action, userIds);
              if (result.success) {
                const { successful, failed } = result.data;
                if (successful > 0) addNotification({ type: 'success', message: `${action}ed ${successful} users`, duration: 4000 });
                if (failed > 0) addNotification({ type: 'warning', message: `Failed on ${failed} users`, duration: 4000 });
                refetch();
              } else {
                throw new Error(result.error?.message || 'Bulk operation failed');
              }
            } catch {
              addNotification({ type: 'error', message: 'Bulk action failed' });
            }
          }}
        />
      </div>

      {/* ─── User Details Modal ───────────────────────────────────────── */}
      {selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => { setShowUserModal(false); setSelectedUser(null); }}
          title="User Details"
          sheet
          drawerWidth={520}
        >
          <div className="space-y-6">
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
                    {selectedUser.role === 'super_admin' ? 'Super Admin' : selectedUser.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                  <Badge variant={selectedUser.status === 'active' ? 'success' : selectedUser.status === 'blocked' ? 'error' : 'warning'} className="gap-1">
                    {selectedUser.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString() },
                { label: 'Last Login', value: selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never' },
                { label: 'Transactions', value: selectedUser.total_transactions || 0 },
                { label: 'Total Spent', value: formatUserAmount(selectedUser.total_amount, selectedUser.currency_preference) },
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
        title="Delete User"
        size="sm"
      >
        <div className="space-y-5">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
            This is permanent and cannot be undone. All user data will be removed.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Reason (optional)
            </label>
            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter a reason for deletion…"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmDeleteUser} loading={actionLoading === pendingDeleteUserId}>
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Role Change ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Select a new role for{' '}
            <strong className="text-gray-900 dark:text-white">
              {pendingRoleUser?.first_name} {pendingRoleUser?.last_name}
            </strong>.
            Changes take effect immediately.
          </p>
          <Dropdown
            label="Select Role"
            value={selectedRole}
            onChange={setSelectedRole}
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ]}
            fullWidth
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowRoleDialog(false)}>
              Cancel
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
                  addNotification({ type: 'success', message: 'User role updated successfully' });
                  setShowRoleDialog(false);
                } catch {
                  addNotification({ type: 'error', message: 'Action failed' });
                } finally {
                  setActionLoading(null);
                  setPendingRoleUser(null);
                }
              }}
            >
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
