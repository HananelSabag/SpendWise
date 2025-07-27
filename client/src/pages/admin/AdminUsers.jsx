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
  Eye, Edit, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

// ✅ NEW: Import Zustand stores and API
import { useAuth, useTranslation, useTheme, useNotifications } from '../../stores';
import { api } from '../../api';
import { Button, Card, LoadingSpinner, Badge, Input, Dropdown, Modal } from '../../components/ui';
import { cn } from '../../utils/helpers';

const AdminUsers = () => {
  // ✅ Zustand stores
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { t, isRTL } = useTranslation('admin');
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
    mutationFn: (userId) => api.admin.deleteUser(userId),
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
  const totalUsers = usersData?.data?.total || 0;

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
    if (window.confirm(t('confirmations.deleteUser', { fallback: 'Are you sure you want to delete this user?' }))) {
      setActionLoading(userId);
      deleteUserMutation.mutate(userId);
    }
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
    <div className={cn(
      'min-h-screen bg-gray-50 dark:bg-gray-900',
      isRTL && 'rtl'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={cn(
            'flex items-center mb-4',
            isRTL && 'flex-row-reverse'
          )}>
            <Link 
              to="/admin" 
              className={cn(
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4',
                isRTL && 'ml-4 mr-0'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('users.title', { fallback: 'User Management' })}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('users.subtitle', { 
              fallback: 'Manage {{total}} users across the platform',
              total: totalUsers.toLocaleString()
            })}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className={cn(
              'flex flex-col sm:flex-row gap-4',
              isRTL && 'sm:flex-row-reverse'
            )}>
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

        {/* Users Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.user', { fallback: 'User' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.role', { fallback: 'Role' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.status', { fallback: 'Status' })}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.joinDate', { fallback: 'Join Date' })}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.actions', { fallback: 'Actions' })}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=3B82F6&color=fff`}
                                alt={user.firstName + ' ' + user.lastName}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {user.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBlockUser(user.id)}
                                disabled={actionLoading === user.id || user.id === currentUser?.id}
                                loading={actionLoading === user.id}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnblockUser(user.id)}
                                disabled={actionLoading === user.id}
                                loading={actionLoading === user.id}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {isSuperAdmin && user.id !== currentUser?.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading === user.id}
                                loading={actionLoading === user.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('users.noUsers', { fallback: 'No users found' })}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('users.noUsersDesc', { fallback: 'Try adjusting your search or filters' })}
                  </p>
                </div>
              )}
            </div>
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
                  src={selectedUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.firstName + ' ' + selectedUser.lastName)}&background=3B82F6&color=fff`}
                  alt={selectedUser.firstName + ' ' + selectedUser.lastName}
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.joinDate', { fallback: 'Join Date' })}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
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
                    {selectedUser.transactionCount || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('fields.totalSpent', { fallback: 'Total Spent' })}
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    ${selectedUser.totalSpent || '0.00'}
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