/**
 * 👥 ADMIN USERS - COMPLETE USER MANAGEMENT
 * Features: Real-time user data, User actions, Search & filters, Live updates
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, Filter, UserCheck,
  Shield, Crown, User, Ban, Trash2,
  Eye, CheckCircle, XCircle, AlertTriangle, Users
} from 'lucide-react';

// ✅ NEW: Import Zustand stores and API
import { useAuth, useTranslation, useTheme, useNotifications, useCurrency } from '../../stores';
import { useToast } from '../../hooks/useToast.jsx';
import { api } from '../../api';
import { Button, Card, LoadingSpinner, Badge, Input, Dropdown, Modal } from '../../components/ui';
import ModernUsersTable from '../../components/features/admin/ModernUsersTable.jsx';
import { cn } from '../../utils/helpers';

const AdminUsers = () => {
  // ✅ Zustand stores
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const { t } = useTranslation('admin');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();
  const toast = useToast();

  // ✅ Helper function to format amount with user's currency preference
  const formatUserAmount = useCallback((amount, userCurrencyPreference) => {
    const userCurrency = userCurrencyPreference || 'ILS'; // Default to ILS if no preference
    return formatCurrency(amount || 0, { currency: userCurrency });
  }, [formatCurrency]);

  // Local state
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

  // ✅ Real-time users data
  const { 
    data: usersData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.admin.users.getAll({}),
    keepPreviousData: true,
    refetchInterval: 30000, // Refresh every 30 seconds
    onError: (err) => {
      addNotification({
        type: 'error',
        message: t('errors.usersLoadFailed', { fallback: 'Failed to load users' }),
      });
    },
  });

  // User action mutations
  const blockUserMutation = useMutation({
    mutationFn: (userId) => api.admin.blockUser(userId),
    onSuccess: () => {
      // Debounce re-fetch to prevent multiple rapid renders
      setTimeout(() => {
        queryClient.invalidateQueries(['admin', 'users'], { exact: true });
      }, 100);
      toast.success(t('actions.userBlocked', { fallback: 'User blocked successfully' }));
      setActionLoading(null);
    },
    onError: (error) => {
      toast.error(t('errors.actionFailed', { fallback: 'Action failed' }));
      setActionLoading(null);
    }
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId) => api.admin.unblockUser(userId),
    onSuccess: () => {
      // Debounce re-fetch to prevent multiple rapid renders
      setTimeout(() => {
        queryClient.invalidateQueries(['admin', 'users'], { exact: true });
      }, 100);
      toast.success(t('actions.userUnblocked', { fallback: 'User unblocked successfully' }));
      setActionLoading(null);
    },
    onError: (error) => {
      toast.error(t('errors.actionFailed', { fallback: 'Action failed' }));
      setActionLoading(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => api.admin.deleteUser({ userId, reason }),
    onSuccess: () => {
      // Debounce re-fetch to prevent multiple rapid renders
      setTimeout(() => {
        queryClient.invalidateQueries(['admin', 'users'], { exact: true });
      }, 100);
      toast.success(t('actions.userDeleted', { fallback: 'User deleted successfully' }));
      setActionLoading(null);
      setShowUserModal(false);
      setShowDeleteDialog(false);
      setDeleteReason('');
      setPendingDeleteUserId(null);
    },
    onError: (error) => {
      toast.error(t('errors.actionFailed', { fallback: 'Action failed' }));
      setActionLoading(null);
    }
  });

  // Filtered users
  const users = usersData?.data?.users || [];
  const totalUsers = usersData?.data?.total || usersData?.data?.summary?.total_users || 0;

  // Safe data access with fallbacks
  const safeUsers = users.map(user => ({
    id: user.id,
    email: user.email || 'Unknown',
    username: user.username || 'Unknown',
    first_name: user.first_name || user.firstName || '',
    last_name: user.last_name || user.lastName || '',
    role: user.role || 'user',
    status: user.status || 'active',
    created_at: user.created_at || user.createdAt || new Date().toISOString(),
    email_verified: user.email_verified || user.emailVerified || false,
    avatar: user.avatar || user.profilePicture || null,
    total_transactions: user.total_transactions || 0,
    total_amount: user.total_amount || 0,
    currency_preference: user.currency_preference || 'ILS', // ✅ Pass user's currency preference
    last_login: user.last_login || null
  }));

  // User action handlers
  const handleBlockUser = (userId) => {
    setActionLoading(userId);
    blockUserMutation.mutate(userId);
  };

  const handleUnblockUser = (userId) => {
    setActionLoading(userId);
    unblockUserMutation.mutate(userId);
  };

  const handleDeleteUser = (userId) => {
    setPendingDeleteUserId(userId);
    setDeleteReason('');
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (!pendingDeleteUserId) return;
    setActionLoading(pendingDeleteUserId);
    deleteUserMutation.mutate({ userId: pendingDeleteUserId, reason: deleteReason || undefined });
  };

  const openRoleDialog = (user) => {
    setPendingRoleUser(user);
    setSelectedRole(user.role || 'user');
    setShowRoleDialog(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="error" className="gap-1"><Crown className="w-3 h-3" />{t('roles.superAdmin', { fallback: 'Super Admin' })}</Badge>;
      case 'admin':
        return <Badge variant="warning" className="gap-1"><Shield className="w-3 h-3" />{t('roles.admin', { fallback: 'Admin' })}</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><User className="w-3 h-3" />{t('roles.user', { fallback: 'User' })}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" />{t('status.active', { fallback: 'Active' })}</Badge>;
      case 'blocked':
        return <Badge variant="error" className="gap-1"><Ban className="w-3 h-3" />{t('status.blocked', { fallback: 'Blocked' })}</Badge>;
      case 'pending':
        return <Badge variant="warning" className="gap-1"><AlertTriangle className="w-3 h-3" />{t('status.pending', { fallback: 'Pending' })}</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><XCircle className="w-3 h-3" />{t('status.inactive', { fallback: 'Inactive' })}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header banner (replaces old header) */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/admin" className="text-white/90 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold">{t('users.title', { fallback: '👥 User Command Center' })}</h1>
                  <p className="text-white/90 text-sm mt-1">
                    {t('users.subtitle', { fallback: 'Master control for {{total}} users • Create, edit, monitor & optimize', total: totalUsers.toLocaleString() })}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <Badge variant="secondary">{totalUsers.toLocaleString()}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Revolutionary Modern Users Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ModernUsersTable
            users={safeUsers}
            currentUser={currentUser}
            isSuperAdmin={isSuperAdmin}
            isAdmin={isAdmin}
            actionLoadingUserId={actionLoading}
            isLoading={isLoading}
            onOverview={(user) => { setSelectedUser(user); setShowUserModal(true); }}
            onRoleChange={(user) => openRoleDialog(user)}
            onBlock={(userId) => handleBlockUser(userId)}
            onUnblock={(userId) => handleUnblockUser(userId)}
            onDelete={(userId) => handleDeleteUser(userId)}
            onBulkAction={async (action, userIds) => {
              // Handle bulk actions
              switch (action) {
                case 'block':
                  for (const userId of userIds) {
                    await blockUserMutation.mutateAsync(userId);
                  }
                  break;
                case 'unblock':
                  for (const userId of userIds) {
                    await unblockUserMutation.mutateAsync(userId);
                  }
                  break;
                case 'delete':
                  if (isSuperAdmin) {
                    for (const userId of userIds) {
                      await deleteUserMutation.mutateAsync({ userId, reason: 'Bulk deletion' });
                    }
                  }
                  break;
                case 'export':
                  // Export functionality
                  const exportData = safeUsers.filter(user => userIds.includes(user.id));
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Name,Email,Role,Status,Transactions,Total Amount,Currency,Join Date\n"
                    + exportData.map(user => 
                        `"${user.first_name} ${user.last_name}","${user.email}","${user.role}","${user.status}","${user.total_transactions || 0}","${formatUserAmount(user.total_amount, user.currency_preference)}","${user.currency_preference || 'ILS'}","${new Date(user.created_at).toLocaleDateString()}"`
                      ).join("\n");
                  
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  break;
              }
            }}
          />
        </motion.div>

        {/* User Details Modal */}
        {selectedUser && (
          <Modal
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            title={t('users.userDetails', { fallback: 'User Details' })}
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img 
                  className="h-16 w-16 rounded-full" 
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.first_name + ' ' + selectedUser.last_name)}&background=3B82F6&color=fff`}
                  alt={selectedUser.first_name + ' ' + selectedUser.last_name}
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getRoleBadge(selectedUser?.role || 'user')}
                    {getStatusBadge(selectedUser?.status || 'active')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.joinDate', { fallback: 'Join Date' })}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.lastLogin', { fallback: 'Last Login' })}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString() : t('common.never', { fallback: 'Never' })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.transactionCount', { fallback: 'Transactions' })}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.total_transactions || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.totalSpent', { fallback: 'Total Spent' })}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatUserAmount(selectedUser.total_amount, selectedUser.currency_preference)}
                  </p>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title={t('dialogs.deleteUser.title', { fallback: 'Delete User' })}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              {t('dialogs.deleteUser.message', { fallback: 'This action is permanent and will remove the user and all related data.' })}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dialogs.deleteUser.reasonLabel', { fallback: 'Reason (optional)' })}
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t('dialogs.deleteUser.reasonPlaceholder', { fallback: 'Enter a reason for deletion...' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                {t('dialogs.deleteUser.cancel', { fallback: 'Cancel' })}
              </Button>
              <Button variant="danger" onClick={confirmDeleteUser} loading={actionLoading === pendingDeleteUserId}>
                {t('dialogs.deleteUser.confirm', { fallback: 'Delete User' })}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Role Change Modal (Super Admin) */}
        <Modal
          isOpen={showRoleDialog}
          onClose={() => setShowRoleDialog(false)}
          title={t('dialogs.roleChange.title', { fallback: 'Change User Role' })}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              {t('dialogs.roleChange.message', { fallback: 'Select a new role for this user. Changes take effect immediately.' })}
            </p>
            <Dropdown
              label={t('dialogs.roleChange.selectLabel', { fallback: 'Select Role' })}
              value={selectedRole}
              onChange={setSelectedRole}
              options={[
                { value: 'user', label: t('roles.user', { fallback: 'User' }) },
                { value: 'admin', label: t('roles.admin', { fallback: 'Admin' }) }
              ]}
              fullWidth
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                {t('dialogs.roleChange.cancel', { fallback: 'Cancel' })}
              </Button>
              <Button
                onClick={async () => {
                  if (!pendingRoleUser) return;
                  setActionLoading(pendingRoleUser.id);
                  try {
                    await api.client.post(`/admin/users/${pendingRoleUser.id}/manage`, { action: 'change_role', role: selectedRole });
                    // Debounce re-fetch to prevent multiple rapid renders
                    setTimeout(() => {
                      queryClient.invalidateQueries(['admin', 'users'], { exact: true });
                    }, 100);
                    toast.success(t('dialogs.roleChange.success', { fallback: 'User role updated successfully' }));
                    setShowRoleDialog(false);
                  } catch (e) {
                    toast.error(t('errors.actionFailed', { fallback: 'Action failed' }));
                  } finally {
                    setActionLoading(null);
                    setPendingRoleUser(null);
                  }
                }}
              >
                {t('dialogs.roleChange.confirm', { fallback: 'Update Role' })}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminUsers; 