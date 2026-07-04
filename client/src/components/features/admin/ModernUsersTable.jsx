import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search, SortAsc, SortDesc, Users,
  Eye, Shield, Crown, User, Ban, UserCheck, Trash2, MailCheck,
  CheckCircle, XCircle, Check, MoreHorizontal,
} from 'lucide-react';

import { useTranslation, useCurrency } from '../../../stores';
import { Avatar } from '../../ui';
import { cn } from '../../../utils/helpers';

// ─── Role pill ──────────────────────────────────────────────────────────────

const RolePill = ({ role }) => {
  const { t } = useTranslation('admin');
  const config = {
    super_admin: {
      label: t('roles.superAdmin'),
      Icon: Crown,
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    },
    admin: {
      label: t('roles.admin'),
      Icon: Shield,
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    },
    user: {
      label: t('roles.user'),
      Icon: User,
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
  };
  const { label, Icon, className } = config[role] || config.user;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// ─── Status indicator ───────────────────────────────────────────────────────

const StatusDot = ({ status }) => {
  const { t } = useTranslation('admin');
  const config = {
    active:   { label: t('status.active'),               dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400' },
    blocked:  { label: t('status.blocked'),              dot: 'bg-red-500',    text: 'text-red-700 dark:text-red-400' },
    pending:  { label: t('status.pending'),              dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
    inactive: { label: t('status.inactive') || 'Inactive', dot: 'bg-gray-400',  text: 'text-gray-500 dark:text-gray-400' },
  };
  const { label, dot, text } = config[status] || config.inactive;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', text)}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
      {label}
    </span>
  );
};

// ─── Per-row action dropdown ─────────────────────────────────────────────────

const RowActions = ({
  user, currentUser, isSuperAdmin, isAdmin, actionLoadingUserId,
  onOverview, onRoleChange, onBlock, onUnblock, onDelete,
}) => {
  const { t, isRTL } = useTranslation('admin');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const isLoading = actionLoadingUserId === user.id;
  const isSelf    = user.id === currentUser?.id;
  const canManage = isSuperAdmin || (isAdmin && user.role === 'user');

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        disabled={isLoading}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        ) : (
          <MoreHorizontal className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className={cn(
          'absolute top-full mt-1 w-44 bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden',
          isRTL ? 'left-0' : 'right-0',
        )}>
          <MenuItem
            icon={Eye}
            label={t('buttons.viewDetails')}
            onClick={() => { onOverview?.(user); setOpen(false); }}
          />

          {!isSelf && isSuperAdmin && (
            <MenuItem
              icon={Shield}
              label={t('buttons.roleChange')}
              onClick={() => { onRoleChange?.(user); setOpen(false); }}
            />
          )}

          {!isSelf && canManage && (
            <>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
              {user.status === 'active' ? (
                <MenuItem
                  icon={Ban}
                  label={t('buttons.blockUser')}
                  className="text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => { onBlock?.(user.id); setOpen(false); }}
                />
              ) : (
                <MenuItem
                  icon={UserCheck}
                  label={t('buttons.unblockUser')}
                  className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => { onUnblock?.(user.id); setOpen(false); }}
                />
              )}
              <MenuItem
                icon={Trash2}
                label={t('dialogs.deleteUser.title')}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => { onDelete?.(user.id); setOpen(false); }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300',
      'hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors',
      className,
    )}
  >
    <Icon className="w-4 h-4 shrink-0" />
    {label}
  </button>
);

// ─── Sortable column header ──────────────────────────────────────────────────

const Th = ({ column, sortConfig, onSort, children, className }) => (
  <th
    className={cn(
      'px-4 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap',
      className,
    )}
  >
    {column ? (
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {children}
        {sortConfig.key === column && (
          sortConfig.direction === 'asc'
            ? <SortAsc className="w-3.5 h-3.5" />
            : <SortDesc className="w-3.5 h-3.5" />
        )}
      </button>
    ) : children}
  </th>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const relativeDate = (dateStr, t) => {
  if (!dateStr) return '—';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return t ? t('timeAgo.today') : 'Today';
  if (days === 1) return t ? t('timeAgo.yesterday') : 'Yesterday';
  if (days < 30) return t ? t('timeAgo.daysAgo', { days }) : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ─── Main component ──────────────────────────────────────────────────────────

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
}) => {
  const { t, isRTL } = useTranslation('admin');
  const { formatCurrency } = useCurrency();
  const formatAmount = useCallback(
    (amount, currency) => formatCurrency(amount || 0, { currency: currency || 'ILS' }),
    [formatCurrency],
  );

  const [searchTerm,     setSearchTerm]     = useState('');
  const [roleFilter,     setRoleFilter]     = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [sortConfig,     setSortConfig]     = useState({ key: 'created_at', direction: 'desc' });
  const [multiSelect,    setMultiSelect]    = useState(false);
  const [selectedUsers,  setSelectedUsers]  = useState(new Set());
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q),
      );
    }
    if (roleFilter   !== 'all') result = result.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') result = result.filter(u => u.status === statusFilter);

    result.sort((a, b) => {
      const { key, direction } = sortConfig;
      let av = a[key], bv = b[key];
      if (key === 'created_at' || key === 'last_login') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      } else if (typeof av === 'string') {
        av = av.toLowerCase(); bv = (bv || '').toLowerCase();
      }
      if (av < bv) return direction === 'asc' ? -1 : 1;
      if (av > bv) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, statusFilter, sortConfig]);

  const handleSort        = useCallback((key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  }, []);
  const handleSelectAll   = useCallback((checked) => {
    setSelectedUsers(checked ? new Set(filtered.map(u => u.id)) : new Set());
  }, [filtered]);
  const handleSelectUser  = useCallback((id, checked) => {
    const next = new Set(selectedUsers);
    checked ? next.add(id) : next.delete(id);
    setSelectedUsers(next);
  }, [selectedUsers]);
  const toggleMultiSelect = useCallback(() => {
    setMultiSelect(p => !p);
    setSelectedUsers(new Set());
  }, []);
  const handleBulkAction  = useCallback(async (action) => {
    if (!selectedUsers.size) return;
    await onBulkAction?.(action, Array.from(selectedUsers));
    setSelectedUsers(new Set());
  }, [selectedUsers, onBulkAction]);

  const allChecked  = filtered.length > 0 && selectedUsers.size === filtered.length;
  const someChecked = selectedUsers.size > 0 && !allChecked;
  const isFiltered  = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

  const actionProps = { currentUser, isSuperAdmin, isAdmin, actionLoadingUserId, onOverview, onRoleChange, onBlock, onUnblock, onDelete };

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Search + Filters ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none',
            isRTL ? 'right-3.5' : 'left-3.5',
          )} />
          <input
            ref={searchRef}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className={cn(
              'w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400',
              'text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4',
            )}
          />
        </div>

        {/* Filter selects */}
        <div className="flex gap-2 shrink-0">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">{t('filters.allRoles')}</option>
            <option value="user">{t('roles.user')}</option>
            <option value="admin">{t('roles.admin')}</option>
            <option value="super_admin">{t('roles.superAdmin')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">{t('filters.allStatuses')}</option>
            <option value="active">{t('status.active')}</option>
            <option value="blocked">{t('status.blocked')}</option>
            <option value="pending">{t('status.pending')}</option>
          </select>

          {/* Multi-select toggle */}
          <button
            onClick={toggleMultiSelect}
            title={t('buttons.multiSelect')}
            className={cn(
              'px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              multiSelect
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            )}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bulk-action bar ───────────────────────────────────────────── */}
      {multiSelect && selectedUsers.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {selectedUsers.size} {t('common.selected')}
          </span>
          <div className="flex gap-2 ms-auto flex-wrap">
            <BulkBtn icon={Ban}       label={t('buttons.block')}   color="orange" onClick={() => handleBulkAction('block')} />
            <BulkBtn icon={UserCheck} label={t('buttons.unblock')} color="green"  onClick={() => handleBulkAction('unblock')} />
            {isSuperAdmin && (
              <BulkBtn icon={Trash2}  label={t('dialogs.deleteUser.confirm')} color="red" onClick={() => handleBulkAction('delete')} />
            )}
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {t('bulk.clearSelection')}
            </button>
          </div>
        </div>
      )}

      {/* ── Result count ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {isFiltered
            ? t('users.foundCount', { count: filtered.length })
            : t('users.totalCount', { count: filtered.length })}
        </span>
        {multiSelect && (
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {t('multiSelect.hint')}
          </span>
        )}
      </div>

      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <tr>
              {multiSelect && (
                <th className="ps-5 pe-3 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              <Th column="first_name" sortConfig={sortConfig} onSort={handleSort} className={multiSelect ? 'ps-2' : 'ps-5'}>
                {t('table.user')}
              </Th>
              <Th column="role"               sortConfig={sortConfig} onSort={handleSort}>{t('table.role')}</Th>
              <Th column="status"             sortConfig={sortConfig} onSort={handleSort}>{t('table.status')}</Th>
              <Th column="total_transactions" sortConfig={sortConfig} onSort={handleSort}>{t('fields.transactionCount')}</Th>
              <Th column="connections_count"  sortConfig={sortConfig} onSort={handleSort}>{t('fields.sources', { fallback: 'Sources' })}</Th>
              <Th column="created_at"         sortConfig={sortConfig} onSort={handleSort}>{t('table.joinDate')}</Th>
              <Th column="last_login"         sortConfig={sortConfig} onSort={handleSort}>{t('fields.lastLogin')}</Th>
              <th className="px-4 py-3.5 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {filtered.map(user => {
              const checked = selectedUsers.has(user.id);
              return (
                <tr
                  key={user.id}
                  onClick={multiSelect ? () => handleSelectUser(user.id, !checked) : undefined}
                  className={cn(
                    'transition-colors group',
                    multiSelect ? 'cursor-pointer' : '',
                    checked
                      ? 'bg-blue-50/60 dark:bg-blue-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/40',
                  )}
                >
                  {multiSelect && (
                    <td className="ps-5 pe-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => { e.stopPropagation(); handleSelectUser(user.id, e.target.checked); }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}

                  <td className={cn('py-3.5', multiSelect ? 'ps-2 pe-4' : 'px-5')}>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={`${user.first_name} ${user.last_name}`} size="md" />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="truncate">{user.email}</span>
                          {user.email_verified && <MailCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5"><RolePill role={user.role} /></td>
                  <td className="px-4 py-3.5"><StatusDot status={user.status} /></td>

                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                    {user.total_transactions || 0}
                  </td>

                  <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    <div className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                      {user.connections_count || 0}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {t('fields.cycleDay', { fallback: 'cycle' })} {user.billing_cycle_day ?? '—'}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {relativeDate(user.last_login, t)}
                  </td>

                  <td className="px-4 py-3.5 text-end">
                    <RowActions user={user} {...actionProps} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && <EmptyState />}
      </div>

      {/* ── Mobile list ───────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-2">
        {filtered.map(user => {
          const checked = selectedUsers.has(user.id);
          return (
            <div
              key={user.id}
              onClick={multiSelect ? () => handleSelectUser(user.id, !checked) : undefined}
              className={cn(
                'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3 transition-colors',
                multiSelect && 'cursor-pointer',
                checked && 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10',
              )}
            >
              {multiSelect && (
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => { e.stopPropagation(); handleSelectUser(user.id, e.target.checked); }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              )}

              <Avatar src={user.avatar} name={`${user.first_name} ${user.last_name}`} size="md" className="shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {user.first_name} {user.last_name}
                  </span>
                  {user.email_verified && <MailCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <RolePill role={user.role} />
                  <StatusDot status={user.status} />
                </div>
              </div>

              <RowActions user={user} {...actionProps} />
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BulkBtn = ({ icon: Icon, label, color, onClick }) => {
  const colors = {
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
    green:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
    red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
  };
  return (
    <button
      onClick={onClick}
      className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors', colors[color])}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
};

const EmptyState = () => {
  const { t } = useTranslation('admin');
  return (
    <div className="py-16 text-center">
      <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-600 dark:text-gray-400 font-medium">{t('users.noUsers')}</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('users.noUsersDescription')}</p>
    </div>
  );
};

export default ModernUsersTable;
