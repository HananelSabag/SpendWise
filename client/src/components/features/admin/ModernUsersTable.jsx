/**
 * 🚀 MODERN USERS TABLE - Clean Admin User Management
 * Features: Responsive design, Individual user actions, Advanced filtering, Real-time updates
 * @version 5.0.0 - CLEAN & OPTIMIZED UPDATE
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, SortAsc, SortDesc, Users,
  Eye, Shield, Crown, User, Ban, UserCheck, Trash2, MailCheck,
  ChevronDown, ChevronRight, Grid3X3, List, Calendar, TrendingUp,
  CheckCircle, XCircle, AlertTriangle, Clock, Zap, Star, Check
} from 'lucide-react';

// ✅ Import design system components
import { useTranslation, useTheme, useNotifications, useCurrency } from '../../../stores';
import { Button, Card, Badge, Avatar, Input, Checkbox } from '../../ui';
import { cn } from '../../../utils/helpers';

// ✅ Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const tableRowVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

// ✅ Enhanced role badge with new design
const getRoleBadge = (role, t) => {
  const badges = {
    super_admin: {
      variant: "danger",
      icon: Crown,
      label: t('roles.superAdmin', { fallback: 'Super Admin' }),
      gradient: "from-purple-600 to-pink-600"
    },
    admin: {
      variant: "warning", 
      icon: Shield,
      label: t('roles.admin', { fallback: 'Admin' }),
      gradient: "from-orange-500 to-red-500"
    },
    user: {
      variant: "secondary",
      icon: User,
      label: t('roles.user', { fallback: 'User' }),
      gradient: "from-blue-500 to-cyan-500"
    }
  };

  const badgeInfo = badges[role] || badges.user;
  const IconComponent = badgeInfo.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className="relative"
    >
      <Badge 
        variant={badgeInfo.variant} 
        className={cn(
          "gap-1.5 px-3 py-1.5 font-semibold shadow-sm",
          "bg-gradient-to-r", badgeInfo.gradient,
          "text-white border-0 hover:shadow-md transition-all duration-200"
        )}
      >
        <IconComponent className="w-3.5 h-3.5" />
        {badgeInfo.label}
      </Badge>
    </motion.div>
  );
};

// ✅ Enhanced status badge with new design
const getStatusBadge = (status, t) => {
  const badges = {
    active: {
      variant: "success",
      icon: CheckCircle,
      label: t('status.active', { fallback: 'Active' }),
      className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
    },
    blocked: {
      variant: "danger",
      icon: Ban,
      label: t('status.blocked', { fallback: 'Blocked' }),
      className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
    },
    pending: {
      variant: "warning",
      icon: Clock,
      label: t('status.pending', { fallback: 'Pending' }),
      className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
    },
    inactive: {
      variant: "secondary",
      icon: XCircle,
      label: t('status.inactive', { fallback: 'Inactive' }),
      className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    }
  };

  const badgeInfo = badges[status] || badges.inactive;
  const IconComponent = badgeInfo.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <Badge 
        className={cn(
          "gap-1.5 px-3 py-1.5 font-medium border",
          badgeInfo.className,
          "hover:shadow-sm transition-all duration-200"
        )}
      >
        <IconComponent className="w-3.5 h-3.5" />
        {badgeInfo.label}
      </Badge>
    </motion.div>
  );
};

// ✅ Activity indicator component
const ActivityIndicator = ({ lastLogin, totalTransactions }) => {
  const isActive = lastLogin && new Date(lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isVeryActive = totalTransactions > 50;
  
  return (
    <motion.div 
      className="flex items-center gap-1"
      whileHover={{ scale: 1.1 }}
    >
      <div className={cn(
        "w-2 h-2 rounded-full",
        isVeryActive ? "bg-green-500 animate-pulse" :
        isActive ? "bg-yellow-500" : "bg-gray-300"
      )} />
      <span className="text-xs text-gray-500">
        {isVeryActive ? "Very Active" : isActive ? "Active" : "Inactive"}
      </span>
    </motion.div>
  );
};

// ✅ Main component
const ModernUsersTable = ({
  users = [],
  currentUser,
  isSuperAdmin,
  isAdmin,
  onOverview,
  onRoleChange,
  onBlock,
  onUnblock,
  onDelete,
  onBulkAction,
  actionLoadingUserId,
  isLoading = false
}) => {
  const { t, isRTL } = useTranslation();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { formatCurrency } = useCurrency();

  // ✅ Helper function to format amount with user's currency preference
  const formatUserAmount = useCallback((amount, userCurrencyPreference) => {
    const userCurrency = userCurrencyPreference || 'ILS'; // Default to ILS if no preference
    return formatCurrency(amount || 0, { currency: userCurrency });
  }, [formatCurrency]);

  // ✅ Clean state management - removed bulk functionality 
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    role: 'all',
    status: 'all',
    verified: 'all',
    activity: 'all'
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // ✅ Refs for virtualization and performance
  const tableRef = useRef(null);
  const searchInputRef = useRef(null);

  // ✅ Advanced filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filterConfig.role !== 'all') {
      filtered = filtered.filter(user => user.role === filterConfig.role);
    }

    // Status filter
    if (filterConfig.status !== 'all') {
      filtered = filtered.filter(user => user.status === filterConfig.status);
    }

    // Verified filter
    if (filterConfig.verified !== 'all') {
      filtered = filtered.filter(user => 
        filterConfig.verified === 'verified' ? user.email_verified : !user.email_verified
      );
    }

    // Activity filter
    if (filterConfig.activity !== 'all') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(user => {
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        switch (filterConfig.activity) {
          case 'active':
            return lastLogin && lastLogin > weekAgo;
          case 'inactive':
            return !lastLogin || lastLogin <= weekAgo;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      if (key === 'created_at' || key === 'last_login') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, filterConfig, sortConfig]);

  // ✅ Multi-select handlers (only work when multiSelectMode is enabled)
  const handleSelectAll = useCallback((checked) => {
    if (!multiSelectMode) return;
    if (checked) {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  }, [multiSelectMode, filteredAndSortedUsers]);

  const handleSelectUser = useCallback((userId, checked) => {
    if (!multiSelectMode) return;
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  }, [multiSelectMode, selectedUsers]);

  // ✅ Toggle multi-select mode
  const toggleMultiSelectMode = useCallback(() => {
    setMultiSelectMode(prev => !prev);
    setSelectedUsers(new Set()); // Clear selections when toggling
  }, []);

  // ✅ Sort handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // ✅ Row expansion handler
  const toggleRowExpansion = useCallback((userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  }, [expandedRows]);

  // ✅ Bulk action handler for server-side bulk operations
  const handleBulkAction = useCallback(async (action) => {
    if (!multiSelectMode || selectedUsers.size === 0) {
      addNotification({
        type: 'warning',
        message: t('bulk.noSelection', { fallback: 'No users selected' }),
        duration: 3000
      });
      return;
    }

    try {
      const userIds = Array.from(selectedUsers);
      
      // Call the onBulkAction prop if provided, otherwise show not supported message
      if (onBulkAction) {
        await onBulkAction(action, userIds);
        setSelectedUsers(new Set()); // Clear selections after success
      } else {
        addNotification({
          type: 'error',
          message: t('bulk.notSupported', { fallback: 'Bulk actions not supported' }),
          duration: 3000
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('bulk.actionError', { fallback: 'Bulk action failed' }),
        duration: 4000
      });
    }
  }, [multiSelectMode, selectedUsers, onBulkAction, addNotification, t]);

  // ✅ Keyboard shortcuts for search and multi-select
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'm':
            e.preventDefault();
            toggleMultiSelectMode();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [toggleMultiSelectMode]);

  // ✅ Header component
  const TableHeader = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Top controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <motion.div variants={itemVariants}>
            <Input
              ref={searchInputRef}
              icon={Search}
              placeholder={t('users.searchPlaceholder', { 
                fallback: 'Search users by name, email, username...' 
              })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </motion.div>
        </div>
        
        <div className="flex gap-2">
          <motion.div variants={itemVariants}>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {t('common.filters', { fallback: 'Filters' })}
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              variant={multiSelectMode ? 'primary' : 'outline'}
              size="md"
              onClick={toggleMultiSelectMode}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              {t('buttons.multiSelect', { fallback: 'Multi Select' })}
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="px-3"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('filters.role', { fallback: 'Role' })}
                  </label>
                  <select
                    value={filterConfig.role}
                    onChange={(e) => setFilterConfig(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('filters.allRoles', { fallback: 'All Roles' })}</option>
                    <option value="user">{t('roles.user', { fallback: 'User' })}</option>
                    <option value="admin">{t('roles.admin', { fallback: 'Admin' })}</option>
                    <option value="super_admin">{t('roles.superAdmin', { fallback: 'Super Admin' })}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('filters.status', { fallback: 'Status' })}
                  </label>
                  <select
                    value={filterConfig.status}
                    onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('filters.allStatuses', { fallback: 'All Statuses' })}</option>
                    <option value="active">{t('status.active', { fallback: 'Active' })}</option>
                    <option value="blocked">{t('status.blocked', { fallback: 'Blocked' })}</option>
                    <option value="pending">{t('status.pending', { fallback: 'Pending' })}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('filters.verified', { fallback: 'Email Verified' })}
                  </label>
                  <select
                    value={filterConfig.verified}
                    onChange={(e) => setFilterConfig(prev => ({ ...prev, verified: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('filters.allVerified', { fallback: 'All' })}</option>
                    <option value="verified">{t('filters.verified', { fallback: 'Verified' })}</option>
                    <option value="unverified">{t('filters.unverified', { fallback: 'Unverified' })}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('filters.activity', { fallback: 'Activity' })}
                  </label>
                  <select
                    value={filterConfig.activity}
                    onChange={(e) => setFilterConfig(prev => ({ ...prev, activity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">{t('filters.allActivity', { fallback: 'All' })}</option>
                    <option value="active">{t('filters.activeUsers', { fallback: 'Active (7d)' })}</option>
                    <option value="inactive">{t('filters.inactiveUsers', { fallback: 'Inactive' })}</option>
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{filteredAndSortedUsers.length} {t('common.users', { fallback: 'users' })}</span>
          </div>
          {multiSelectMode && selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
              <CheckCircle className="w-4 h-4" />
              <span>{selectedUsers.size} {t('common.selected', { fallback: 'selected' })}</span>
            </div>
          )}
          {multiSelectMode && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('multiSelect.hint', { fallback: 'Multi-select mode active - click users to select' })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Bulk actions - show when multi-select mode is active and users are selected */}
      <AnimatePresence>
        {multiSelectMode && selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-wrap gap-2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('block')}
              className="gap-2"
            >
              <Ban className="w-4 h-4" />
              {t('bulk.block', { fallback: 'Block Selected' })} ({selectedUsers.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('unblock')}
              className="gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {t('bulk.unblock', { fallback: 'Unblock Selected' })} ({selectedUsers.size})
            </Button>
            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                {t('bulk.delete', { fallback: 'Delete Selected' })} ({selectedUsers.size})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUsers(new Set())}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              {t('bulk.clearSelection', { fallback: 'Clear Selection' })}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ✅ Grid view component
  const GridView = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {filteredAndSortedUsers.map((user) => (
        <motion.div
          key={user.id}
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          className="group"
        >
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary-200 dark:hover:border-primary-700">
            <div className="flex items-start gap-3">
              {multiSelectMode && (
                <div className="flex items-center justify-center mt-1">
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectUser(user.id, e.target.checked);
                    }}
                    className="cursor-pointer"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={user.avatar}
                    name={`${user.first_name} ${user.last_name}`}
                    size="lg"
                    className="ring-2 ring-gray-200 dark:ring-gray-700"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {user.first_name} {user.last_name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="truncate">{user.email}</span>
                      {user.email_verified && <MailCheck className="w-4 h-4 text-green-600" />}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {getRoleBadge(user.role, t)}
                  {getStatusBadge(user.status, t)}
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>{t('fields.transactionCount', { fallback: 'Transactions' })}:</span>
                    <span className="font-medium">{user.total_transactions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('fields.totalSpent', { fallback: 'Total Spent' })}:</span>
                    <span className="font-medium">{formatUserAmount(user.total_amount, user.currency_preference)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('fields.joinDate', { fallback: 'Joined' })}:</span>
                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <ActivityIndicator 
                    lastLogin={user.last_login} 
                    totalTransactions={user.total_transactions}
                  />
                </div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOverview?.(user)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {user.id !== currentUser?.id && (
                    <>
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRoleChange?.(user)}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      {(isSuperAdmin || (isAdmin && user.role === 'user')) && (
                        <>
                          {user.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onBlock?.(user.id)}
                              disabled={actionLoadingUserId === user.id}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUnblock?.(user.id)}
                              disabled={actionLoadingUserId === user.id}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );

  // ✅ Table view component with sortable headers
  const SortableHeader = ({ column, children }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 text-left w-full hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {children}
      {sortConfig.key === column && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {sortConfig.direction === 'asc' ? 
            <SortAsc className="w-4 h-4" /> : 
            <SortDesc className="w-4 h-4" />
          }
        </motion.div>
      )}
    </button>
  );

  const TableView = () => (
    <Card className="overflow-hidden">
      {/* Mobile view - enhanced cards */}
      <div className="block lg:hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {multiSelectMode && (
                <Checkbox
                  checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                  indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredAndSortedUsers.length}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectAll(e.target.checked);
                  }}
                  label={t('table.selectAll', { fallback: 'Select all' })}
                  className="cursor-pointer"
                />
              )}
            </div>
            <span className="text-sm text-gray-500">
              {filteredAndSortedUsers.length} {t('common.users', { fallback: 'users' })}
            </span>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="divide-y divide-gray-200 dark:divide-gray-700"
        >
          <AnimatePresence>
            {filteredAndSortedUsers.map((user) => (
              <motion.div
                key={user.id}
                variants={tableRowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {multiSelectMode && (
                    <div className="flex items-center justify-center mt-1">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectUser(user.id, e.target.checked);
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={user.avatar}
                        name={`${user.first_name} ${user.last_name}`}
                        size="md"
                        className="ring-2 ring-gray-200 dark:ring-gray-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.first_name} {user.last_name}
                          </h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleRowExpansion(user.id)}
                          >
                            {expandedRows.has(user.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate">{user.email}</span>
                          {user.email_verified && <MailCheck className="w-4 h-4 text-green-600" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {getRoleBadge(user.role, t)}
                      {getStatusBadge(user.status, t)}
                    </div>

                    <ActivityIndicator 
                      lastLogin={user.last_login} 
                      totalTransactions={user.total_transactions}
                    />

                    <AnimatePresence>
                      {expandedRows.has(user.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">{t('fields.transactionCount', { fallback: 'Transactions' })}:</span>
                              <span className="ml-1 font-medium">{user.total_transactions || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">{t('fields.totalSpent', { fallback: 'Total' })}:</span>
                              <span className="ml-1 font-medium">{formatUserAmount(user.total_amount, user.currency_preference)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">{t('fields.joinDate', { fallback: 'Joined' })}:</span>
                              <span className="ml-1 font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">{t('fields.lastLogin', { fallback: 'Last login' })}:</span>
                              <span className="ml-1 font-medium">
                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOverview?.(user)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              {t('buttons.overview', { fallback: 'Overview' })}
                            </Button>
                            {user.id !== currentUser?.id && (
                              <>
                                {isSuperAdmin && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onRoleChange?.(user)}
                                    className="gap-2"
                                  >
                                    <Shield className="w-4 h-4" />
                                    {t('buttons.roleChange', { fallback: 'Role' })}
                                  </Button>
                                )}
                                {(isSuperAdmin || (isAdmin && user.role === 'user')) && (
                                  <>
                                    {user.status === 'active' ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onBlock?.(user.id)}
                                        disabled={actionLoadingUserId === user.id}
                                        loading={actionLoadingUserId === user.id}
                                        className="gap-2"
                                      >
                                        <Ban className="w-4 h-4" />
                                        {t('buttons.block', { fallback: 'Block' })}
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUnblock?.(user.id)}
                                        disabled={actionLoadingUserId === user.id}
                                        loading={actionLoadingUserId === user.id}
                                        className="gap-2"
                                      >
                                        <UserCheck className="w-4 h-4" />
                                        {t('buttons.unblock', { fallback: 'Unblock' })}
                                      </Button>
                                    )}
                                  </>
                                )}
                                {(isSuperAdmin || (isAdmin && user.role === 'user')) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete?.(user.id)}
                                    disabled={actionLoadingUserId === user.id}
                                    loading={actionLoadingUserId === user.id}
                                    className="gap-2 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {t('buttons.delete', { fallback: 'Delete' })}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full" ref={tableRef}>
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {multiSelectMode && (
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                      indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredAndSortedUsers.length}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectAll(e.target.checked);
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortableHeader column="first_name">
                  {t('table.user', { fallback: 'User' })}
                </SortableHeader>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortableHeader column="role">
                  {t('table.role', { fallback: 'Role' })}
                </SortableHeader>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortableHeader column="status">
                  {t('table.status', { fallback: 'Status' })}
                </SortableHeader>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.activity', { fallback: 'Activity' })}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortableHeader column="total_transactions">
                  {t('fields.transactionCount', { fallback: 'Transactions' })}
                </SortableHeader>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <SortableHeader column="created_at">
                  {t('table.joinDate', { fallback: 'Join Date' })}
                </SortableHeader>
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.actions', { fallback: 'Actions' })}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {filteredAndSortedUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    index % 2 === 0 && "bg-gray-50/30 dark:bg-gray-800/20"
                  )}
                >
                  {multiSelectMode && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user.id, e.target.checked);
                          }}
                          className="cursor-pointer"
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar}
                        name={`${user.first_name} ${user.last_name}`}
                        size="md"
                        className="ring-2 ring-gray-200 dark:ring-gray-700"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate">{user.email}</span>
                          {user.email_verified && <MailCheck className="w-4 h-4 text-green-600" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role, t)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status, t)}
                  </td>
                  <td className="px-6 py-4">
                    <ActivityIndicator 
                      lastLogin={user.last_login} 
                      totalTransactions={user.total_transactions}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{user.total_transactions || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOverview?.(user)}
                        className="p-2"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                       {user.id !== currentUser?.id && (
                        <>
                           {isSuperAdmin && (
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={() => onRoleChange?.(user)}
                               className="p-2"
                             >
                               <Shield className="w-4 h-4" />
                             </Button>
                           )}
                           {(isSuperAdmin || (isAdmin && user.role === 'user')) && (
                             <>
                               {user.status === 'active' ? (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={() => onBlock?.(user.id)}
                                   disabled={actionLoadingUserId === user.id}
                                   loading={actionLoadingUserId === user.id}
                                   className="p-2"
                                 >
                                   <Ban className="w-4 h-4" />
                                 </Button>
                               ) : (
                                 <Button
                                   size="sm"
                                   variant="ghost"
                                   onClick={() => onUnblock?.(user.id)}
                                   disabled={actionLoadingUserId === user.id}
                                   loading={actionLoadingUserId === user.id}
                                   className="p-2"
                                 >
                                   <UserCheck className="w-4 h-4" />
                                 </Button>
                               )}
                             </>
                           )}
                           {(isSuperAdmin || (isAdmin && user.role === 'user')) && (
                             <Button
                               size="sm"
                               variant="ghost"
                               onClick={() => onDelete?.(user.id)}
                               disabled={actionLoadingUserId === user.id}
                               loading={actionLoadingUserId === user.id}
                               className="p-2 text-red-600 hover:text-red-700"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           )}
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredAndSortedUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('users.noUsers', { fallback: 'No users found' })}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('users.noUsersDescription', { 
              fallback: 'Try adjusting your search or filter criteria.' 
            })}
          </p>
        </motion.div>
      )}
    </Card>
  );

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3"></div>
        </div>
        <Card className="p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ✅ Main render
  return (
    <div className="space-y-6">
      <TableHeader />
      {viewMode === 'grid' ? <GridView /> : <TableView />}
    </div>
  );
};

export default ModernUsersTable;
