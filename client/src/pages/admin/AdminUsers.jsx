/**
 * 👥 ADMIN USERS - COMPLETE USER MANAGEMENT
 * Features: Real-time user data, User actions, Search & filters, Live updates
 * @version 3.0.0 - REVOLUTIONARY UPDATE
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, Filter, MoreVertical, UserX, UserCheck, 
  Shield, Crown, User, Calendar, Mail, Phone, Ban, Trash2,
  Eye, Edit, CheckCircle, XCircle, AlertTriangle, Users
} from 'lucide-react';

// ✅ NEW: Import Zustand stores and API
import { useAuth, useTranslation, useTheme, useNotifications } from '../../stores';
import { api } from '../../api';
import { Button, Card, LoadingSpinner, Badge, Input, Dropdown, Modal } from '../../components/ui';
import { cn } from '../../utils/helpers';

const AdminUsers = () => {
  // ✅ Zustand stores
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { t } = useTranslation('admin');
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const queryClient = useQueryClient();

  // ✅ Real-time users data
  const { 
    data: usersData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin', 'users', { search: searchTerm, role: filterRole }],
    queryFn: () => api.admin.users.getAll({ search: searchTerm, role: filterRole }),
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
      queryClient.invalidateQueries(['admin', 'users']);
      addNotification({
        type: 'success',
        message: t('actions.userBlocked', { fallback: 'User blocked successfully' }),
      });
      setActionLoading(null);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: t('errors.actionFailed', { fallback: 'Action failed' }),
      });
      setActionLoading(null);
    }
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId) => api.admin.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      addNotification({
        type: 'success',
        message: t('actions.userUnblocked', { fallback: 'User unblocked successfully' }),
      });
      setActionLoading(null);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: t('errors.actionFailed', { fallback: 'Action failed' }),
      });
      setActionLoading(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => api.admin.deleteUser({ userId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
      addNotification({
        type: 'success',
        message: t('actions.userDeleted', { fallback: 'User deleted successfully' }),
      });
      setActionLoading(null);
      setShowUserModal(false);
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        message: t('errors.actionFailed', { fallback: 'Action failed' }),
      });
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
    total_amount: user.total_amount || 0
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
    const confirmed = window.confirm(t('confirmations.deleteUser', { fallback: 'Are you sure you want to delete this user?' }));
    if (!confirmed) return;

    const reason = prompt(t('admin.actions.deleteReason', { fallback: 'Please enter a reason for deletion (optional):' }), 'Policy violation');
    setActionLoading(userId);
    deleteUserMutation.mutate({ userId, reason: reason || undefined });
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
                  <h1 className="text-xl md:text-2xl font-semibold">{t('users.title', { fallback: 'User Management' })}</h1>
                  <p className="text-white/90 text-sm mt-1">
                    {t('users.subtitle', { fallback: 'Manage {{total}} users across the platform', total: totalUsers.toLocaleString() })}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block">
                <Badge variant="secondary">{totalUsers.toLocaleString()}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className={cn('flex flex-col sm:flex-row gap-4')}>
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder={t('users.searchPlaceholder', { fallback: 'Search users by name, email...' })}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Dropdown
                  options={[
                    { value: 'all', label: t('filters.allRoles', { fallback: 'All Roles' }) },
                    { value: 'user', label: t('roles.user', { fallback: 'User' }) },
                    { value: 'admin', label: t('roles.admin', { fallback: 'Admin' }) },
                    { value: 'super_admin', label: t('roles.superAdmin', { fallback: 'Super Admin' }) }
                  ]}
                  value={filterRole}
                  onChange={setFilterRole}
                  placeholder={t('filters.filterByRole', { fallback: 'Filter by role' })}
                />
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t('common.refresh', { fallback: 'Refresh' })}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Users List (mobile) + Table (desktop) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {safeUsers.length > 0 ? (
              safeUsers.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.first_name || '') + ' ' + (user.last_name || ''))}&background=3B82F6&color=fff`}
                      alt={(user.first_name || '') + ' ' + (user.last_name || '')}
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.charAt(0))}&background=6B7280&color=fff`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.first_name || user.username || 'Unknown'} {user.last_name || ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user.status === 'active' ? (
                        <Button size="sm" variant="outline" onClick={() => handleBlockUser(user.id)} disabled={actionLoading === user.id || user.id === currentUser?.id} loading={actionLoading === user.id}>
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleUnblockUser(user.id)} disabled={actionLoading === user.id} loading={actionLoading === user.id}>
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  {isSuperAdmin && user.id !== currentUser?.id && (
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user.id)} disabled={actionLoading === user.id} loading={actionLoading === user.id} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Users className="mx-auto h-10 w-10 mb-2" />
                {t('users.noUsers', { fallback: 'No users found' })}
              </Card>
            )}
          </div>

          {/* Desktop table */}
          <Card className="overflow-hidden hidden md:block">
            <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[45%]">{t('table.user', { fallback: 'User' })}</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell w-[15%]">{t('table.role', { fallback: 'Role' })}</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">{t('table.status', { fallback: 'Status' })}</th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell w-[10%]">{t('table.joinDate', { fallback: 'Join Date' })}</th>
                  <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%]">{t('table.actions', { fallback: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {safeUsers.length > 0 ? (
                  safeUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 lg:px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center min-w-0">
                          <img className="h-10 w-10 rounded-full flex-shrink-0" src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user.first_name || '') + ' ' + (user.last_name || ''))}&background=3B82F6&color=fff`} alt={(user.first_name || '') + ' ' + (user.last_name || '')} onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.charAt(0))}&background=6B7280&color=fff`; }} />
                          <div className="ml-4 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.first_name || user.username || 'Unknown'} {user.last_name || ''}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-3 whitespace-nowrap hidden lg:table-cell">{getRoleBadge(user.role)}</td>
                      <td className="px-3 lg:px-6 py-3 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                      <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setShowUserModal(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user.status === 'active' ? (
                            <Button size="sm" variant="outline" onClick={() => handleBlockUser(user.id)} disabled={actionLoading === user.id || user.id === currentUser?.id} loading={actionLoading === user.id}>
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleUnblockUser(user.id)} disabled={actionLoading === user.id} loading={actionLoading === user.id}>
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                          {isSuperAdmin && user.id !== currentUser?.id && (
                            <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user.id)} disabled={actionLoading === user.id} loading={actionLoading === user.id} className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Users className="mx-auto h-12 w-12 mb-4" />
                      {t('users.noUsers', { fallback: 'No users found' })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
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
                    ${selectedUser.total_amount || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default AdminUsers; 