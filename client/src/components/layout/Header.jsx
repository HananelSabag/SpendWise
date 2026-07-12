import React, { useState, useCallback, Suspense, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  BarChart3,
  Calculator,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User,
  Wrench
} from 'lucide-react';

import {
  useAuth,
  useTranslation,
  useNotifications,
  useIsAdmin,
  useIsSuperAdmin
} from '../../stores';
import { useAppStore } from '../../stores';

import HeaderActions from './HeaderActions';
import NotificationBell from './NotificationBell';

import { cn } from '../../utils/helpers';
import { Avatar, LoadingSpinner } from '../ui';
import ModernOnboardingModal from '../features/onboarding/ModernOnboardingModal';
import BrandMark from '../common/BrandMark';

const ExchangeCalculator = React.lazy(() => import('../features/exchange/ExchangeCalculator'));
const HelpCenter = React.lazy(() => import('../features/help/HelpCenter'));

const SIDEBAR_EXPANDED = '17rem';
const SIDEBAR_COLLAPSED = '5rem';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, isRTL = false, currentLanguage } = useTranslation();
  const { addNotification } = useNotifications();
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();
  const hasAdminAccess = Boolean(isSuperAdmin || isAdmin || ['admin', 'super_admin'].includes(user?.role));
  const maintenanceMode = useAppStore((s) => s.maintenanceMode);

  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sw_desktop_sidebar_collapsed') === '1';
    } catch (_) {
      return false;
    }
  });
  const [activeModal, setActiveModal] = useState(null);

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  useEffect(() => {
    document.documentElement.style.setProperty('--sw-sidebar-width', sidebarWidth);
    document.documentElement.dataset.sidebarSide = isRTL ? 'right' : 'left';
    try {
      localStorage.setItem('sw_desktop_sidebar_collapsed', isCollapsed ? '1' : '0');
    } catch (_) {}
  }, [isCollapsed, isRTL, sidebarWidth]);

  const openModal = useCallback((modalType) => {
    setActiveModal(modalType);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  useEffect(() => {
    const openOnboarding = () => setActiveModal('onboarding');
    const closeOnboarding = () => setActiveModal(null);
    const openExchange = () => setActiveModal('exchange');
    const openHelp = () => setActiveModal('help');

    window.addEventListener('open-onboarding', openOnboarding);
    window.addEventListener('close-onboarding', closeOnboarding);
    window.addEventListener('open-exchange', openExchange);
    window.addEventListener('open-help', openHelp);

    return () => {
      window.removeEventListener('open-onboarding', openOnboarding);
      window.removeEventListener('close-onboarding', closeOnboarding);
      window.removeEventListener('open-exchange', openExchange);
      window.removeEventListener('open-help', openHelp);
    };
  }, []);

  const go = useCallback((href) => {
    navigate(href);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      addNotification({
        type: 'success',
        message: t('auth.logoutSuccess')
      });
      navigate('/login');
    } catch (_) {
      addNotification({
        type: 'error',
        message: t('auth.logoutError')
      });
    }
  }, [logout, addNotification, t, navigate]);

  const navItems = useMemo(() => ([
    {
      key: 'dashboard',
      label: t('nav.dashboard') || 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: location.pathname === '/'
    },
    {
      key: 'transactions',
      label: t('nav.transactions') || 'Transactions',
      href: '/transactions',
      icon: CreditCard,
      active: location.pathname.startsWith('/transactions')
    },
    {
      key: 'insights',
      label: currentLanguage === 'he' ? 'תובנות' : 'Insights',
      href: '/insights',
      icon: BarChart3,
      active: location.pathname.startsWith('/insights')
    },
    {
      key: 'bank-sync',
      label: t('bankSync.title') || 'Bank Sync',
      href: '/bank-sync',
      icon: Building2,
      active: location.pathname.startsWith('/bank-sync')
    }
  ]), [currentLanguage, location.pathname, t]);

  const accountItems = useMemo(() => ([
    {
      key: 'profile',
      label: t('nav.profile') || 'Profile',
      href: '/profile',
      icon: User,
      active: location.pathname.startsWith('/profile')
    },
    ...(hasAdminAccess ? [{
      key: 'admin',
      label: t('nav.admin') || 'Admin',
      href: '/admin',
      icon: Shield,
      active: location.pathname.startsWith('/admin')
    }] : []),
    ...(isSuperAdmin ? [{
      key: 'settings',
      label: t('nav.systemSettings') || 'System Settings',
      href: '/admin/settings',
      icon: Settings,
      active: location.pathname.startsWith('/admin/settings')
    }] : [])
  ]), [hasAdminAccess, isSuperAdmin, location.pathname, t]);

  const toolItems = useMemo(() => ([
    {
      key: 'exchange',
      label: currentLanguage === 'he' ? 'המרת מטבע' : 'Exchange',
      icon: Calculator,
      onClick: () => openModal('exchange')
    },
    {
      key: 'help',
      label: t('nav.help') || 'Help',
      icon: HelpCircle,
      onClick: () => openModal('onboarding')
    }
  ]), [currentLanguage, openModal, t]);

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    return (
      <button
        type="button"
        onClick={() => item.href ? go(item.href) : item.onClick?.()}
        title={isCollapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={item.active ? 'page' : undefined}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors min-h-[44px]',
          isCollapsed && 'justify-center px-2',
          item.active
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {item.active && (
          <span
            className={cn(
              'absolute top-2 bottom-2 w-1 rounded-full bg-primary-500',
              isRTL ? 'right-0' : 'left-0'
            )}
          />
        )}
      </button>
    );
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: isRTL ? 24 : -24 }}
        animate={{ opacity: 1, x: 0, width: sidebarWidth }}
        transition={{ duration: 0.22 }}
        className={cn(
          'hidden lg:flex fixed top-0 bottom-0 z-40 flex-col border-gray-200/80 bg-white/92 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/92',
          isRTL ? 'right-0 border-l' : 'left-0 border-r'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex h-16 items-center gap-3 px-4 border-b border-gray-200/70 dark:border-gray-800/70">
          <button
            type="button"
            onClick={() => go('/')}
            className={cn(
              'flex min-w-0 items-center gap-3 text-primary-700 dark:text-primary-300',
              isCollapsed && 'w-full justify-center'
            )}
            aria-label="SpendWise"
          >
            <BrandMark size="md" />
            {!isCollapsed && (
              <div className="min-w-0 text-start">
                <p className="text-base font-bold leading-tight text-gray-950 dark:text-white">
                  {t('common.appName', { fallback: 'SpendWise' })}
                </p>
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  {t('nav.overview') || 'Overview'}
                </p>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="ms-auto p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title={t('common.close', { fallback: 'Close' })}
              aria-label={t('common.close', { fallback: 'Close' })}
            >
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="mx-auto mt-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title={t('common.openMenu') || 'Open menu'}
            aria-label={t('common.openMenu') || 'Open menu'}
          >
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {(isAdmin || isSuperAdmin) && maintenanceMode && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
              isCollapsed && 'justify-center px-2'
            )}>
              <Wrench className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <span className="text-xs font-semibold truncate">
                  {t('admin.settings.maintenanceMode', { fallback: 'Maintenance Mode' })}
                </span>
              )}
            </div>
          )}

          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('nav.navigation') || 'Navigation'}
              </p>
            )}
            {navItems.map((item) => <NavButton key={item.key} item={item} />)}
          </div>

          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('nav.tools') || 'Tools'}
              </p>
            )}
            {toolItems.map((item) => <NavButton key={item.key} item={item} />)}
          </div>

          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t('common.account', { fallback: 'Account' })}
              </p>
            )}
            {accountItems.map((item) => <NavButton key={item.key} item={item} />)}
          </div>
        </div>

        <div className="border-t border-gray-200/70 dark:border-gray-800/70 p-3 space-y-3">
          <div className={cn('flex items-center gap-2', isCollapsed ? 'justify-center flex-col' : 'justify-between')}>
            <NotificationBell />
            <HeaderActions onOpenModal={openModal} className={isCollapsed ? 'flex-col space-x-0 gap-1' : ''} />
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2 dark:bg-gray-900/80">
              <Avatar
                src={user?.avatar || user?.profile_picture_url || user?.profilePicture}
                alt={user?.name || user?.email}
                size="sm"
                fallback={user?.name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0)}
              />
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || user?.username || t('common.user')}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title={t('auth.logout')}
                aria-label={t('auth.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title={t('auth.logout')}
              aria-label={t('auth.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.aside>

      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      }>
        {activeModal === 'exchange' && (
          <ExchangeCalculator
            isOpen={true}
            onClose={closeModal}
          />
        )}

        {activeModal === 'onboarding' && (
          <ModernOnboardingModal
            isOpen={true}
            onClose={closeModal}
            previewOnly={false}
          />
        )}

        {activeModal === 'help' && (
          <HelpCenter isOpen={true} onClose={closeModal} />
        )}
      </Suspense>
    </>
  );
};

export default Header;
