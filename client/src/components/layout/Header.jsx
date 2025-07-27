/**
 * 🧭 HEADER COMPONENT - Mobile-First Navigation with Admin Support
 * Features: Zustand stores, Mobile-responsive, Admin navigation, OAuth integration
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  CreditCard,
  Layers,
  User,
  LogOut,
  Sun,
  Moon,
  Globe,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  Tag,
  Clock,
  HelpCircle,
  Shield,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useCurrency,
  useNotifications 
} from '../../stores';

import { cn } from '../../utils/helpers';
import { Avatar } from '../ui';

// Lazy-loaded modals for performance
const CategoryManager = React.lazy(() => import('../features/categories/CategoryManager'));
const RecurringModal = React.lazy(() => import('../features/transactions/RecurringModal'));
const ExchangeCalculator = React.lazy(() => import('../features/exchange/ExchangeCalculator'));
const OnboardingModal = React.lazy(() => import('../features/onboarding/OnboardingModal'));

const Header = () => {
  // ✅ Mobile-first state management
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPanelsDropdown, setShowPanelsDropdown] = useState(false);
  const [showMobilePanels, setShowMobilePanels] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  
  // ✅ NEW: Zustand stores (replacing Context API)
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { t, currentLanguage, isRTL, setLanguage } = useTranslation();
  const { theme, isDark, setTheme } = useTheme();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const { addNotification } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Enhanced modal management
  const openModal = useCallback((modalType) => {
    setActiveModal(modalType);
    setIsOpen(false); // Close mobile menu
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // ✅ Mobile-optimized logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      addNotification({
        type: 'success',
        message: t('auth.logoutSuccess', { fallback: 'Logged out successfully' })
      });
      navigate('/login');
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('errors.logoutFailed', { fallback: 'Logout failed' })
      });
    }
  }, [logout, navigate, t, addNotification]);

  // ✅ Enhanced language toggle with mobile support
  const handleLanguageToggle = useCallback(() => {
    const newLanguage = currentLanguage === 'en' ? 'he' : 'en';
    setLanguage(newLanguage);
    addNotification({
      type: 'info',
      message: t('common.languageChanged', { fallback: 'Language changed' })
    });
  }, [currentLanguage, setLanguage, t, addNotification]);

  // ✅ Theme toggle with mobile support
  const handleThemeToggle = useCallback(() => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    addNotification({
      type: 'info',
      message: t('common.themeChanged', { fallback: 'Theme changed' })
    });
  }, [isDark, setTheme, t, addNotification]);

  // ✅ Mobile-first navigation configuration
  const navigationConfig = useMemo(() => {
    const baseNavigation = [
      {
        name: t('nav.dashboard', { fallback: 'Dashboard' }),
        href: '/',
        icon: Home,
        current: location.pathname === '/'
      },
      {
        name: t('nav.transactions', { fallback: 'Transactions' }),
        href: '/transactions',
        icon: CreditCard,
        current: location.pathname === '/transactions'
      },
      {
        name: t('nav.analytics', { fallback: 'Analytics' }),
        href: '/analytics',
        icon: BarChart3,
        current: location.pathname.startsWith('/analytics')
      },
      {
        name: t('nav.profile', { fallback: 'Profile' }),
        href: '/profile',
        icon: User,
        current: location.pathname === '/profile'
      }
    ];

    // ✅ Add admin navigation if user has admin access
    if (user?.isAdmin) {
      baseNavigation.push({
        name: t('nav.admin', { fallback: 'Admin' }),
        href: '/admin',
        icon: Shield,
        current: location.pathname.startsWith('/admin'),
        badge: user?.isSuperAdmin ? 'SUPER' : 'ADMIN'
      });
    }

    return baseNavigation;
  }, [location.pathname, user, t]);

  // ✅ Admin sub-navigation
  const adminNavigation = useMemo(() => {
    if (!user?.isAdmin) return [];

    return [
      {
        name: t('nav.userManagement', { fallback: 'Users' }),
        href: '/admin/users',
        icon: Users,
        current: location.pathname === '/admin/users'
      },
      {
        name: t('nav.systemStats', { fallback: 'Statistics' }),
        href: '/admin/stats',
        icon: BarChart3,
        current: location.pathname === '/admin/stats'
      },
      {
        name: t('nav.activityLog', { fallback: 'Activity' }),
        href: '/admin/activity',
        icon: Activity,
        current: location.pathname === '/admin/activity'
      },
      ...(user?.isSuperAdmin ? [{
        name: t('nav.systemSettings', { fallback: 'Settings' }),
        href: '/admin/settings',
        icon: Settings,
        current: location.pathname === '/admin/settings'
      }] : [])
    ];
  }, [user, t, location.pathname]);

  // ✅ Quick panels configuration
  const quickPanels = useMemo(() => [
    {
      name: t('common.categories', { fallback: 'Categories' }),
      description: t('common.manageCategoriesDesc', { fallback: 'Manage your expense categories' }),
      icon: Tag,
      onClick: () => openModal('categories'),
      color: 'blue'
    },
    {
      name: t('common.recurring', { fallback: 'Recurring' }),
      description: t('common.manageRecurringDesc', { fallback: 'Manage recurring transactions' }),
      icon: Clock,
      onClick: () => openModal('recurring'),
      color: 'green'
    },
    {
      name: t('common.exchange', { fallback: 'Exchange' }),
      description: t('common.currencyExchangeDesc', { fallback: 'Currency exchange calculator' }),
      icon: DollarSign,
      onClick: () => openModal('exchange'),
      color: 'purple'
    },
    {
      name: t('common.help', { fallback: 'Help' }),
      description: t('common.onboardingDesc', { fallback: 'Getting started guide' }),
      icon: HelpCircle,
      onClick: () => openModal('onboarding'),
      color: 'orange'
    }
  ], [t, openModal]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <header className={cn(
        "bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40",
        isRTL && "rtl"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ✅ Mobile-first logo and hamburger */}
            <div className="flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-expanded="false"
              >
                <span className="sr-only">{t('nav.openMenu', { fallback: 'Open main menu' })}</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
                <button
                  onClick={() => navigate('/')}
                  className="text-2xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  SpendWise
                </button>
              </div>
            </div>

            {/* ✅ Desktop navigation */}
            <nav className="hidden lg:flex lg:space-x-8">
              {navigationConfig.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
                      item.current
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* ✅ Right side actions */}
            <div className="flex items-center space-x-3">
              {/* Desktop quick panels */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setShowPanelsDropdown(!showPanelsDropdown)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {t('common.quickPanels', { fallback: 'Panels' })}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                <AnimatePresence>
                  {showPanelsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {quickPanels.map((panel) => {
                          const Icon = panel.icon;
                          return (
                            <button
                              key={panel.name}
                              onClick={panel.onClick}
                              className="p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center mb-2",
                                panel.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                                panel.color === 'green' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                                panel.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                                panel.color === 'orange' && "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                {panel.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {panel.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme toggle */}
              <button
                onClick={handleThemeToggle}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                title={t('common.toggleTheme', { fallback: 'Toggle theme' })}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Language toggle */}
              <button
                onClick={handleLanguageToggle}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                title={t('common.toggleLanguage', { fallback: 'Toggle language' })}
              >
                <Globe className="w-5 h-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Avatar
                    src={user?.avatar}
                    alt={user?.username || user?.email}
                    size="sm"
                    fallback={user?.username?.charAt(0) || user?.email?.charAt(0)}
                  />
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username || t('common.user', { fallback: 'User' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowDropdown(false);
                          }}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <User className="w-4 h-4 mr-3" />
                          {t('nav.profile', { fallback: 'Profile' })}
                        </button>
                        
                        {user?.isAdmin && (
                          <button
                            onClick={() => {
                              navigate('/admin');
                              setShowDropdown(false);
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            {t('nav.admin', { fallback: 'Admin Panel' })}
                            {user?.isSuperAdmin && (
                              <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                                SUPER
                              </span>
                            )}
                          </button>
                        )}

                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          {t('auth.logout', { fallback: 'Logout' })}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Mobile navigation menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="px-4 pt-2 pb-3 space-y-1">
                {/* Mobile navigation links */}
                {navigationConfig.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-base font-medium rounded-md",
                        item.current
                          ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Mobile admin sub-navigation */}
                {user?.isAdmin && location.pathname.startsWith('/admin') && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {t('nav.admin', { fallback: 'Admin' })}
                    </h3>
                    {adminNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            navigate(item.href);
                            setIsOpen(false);
                          }}
                          className={cn(
                            "flex items-center w-full px-6 py-2 text-sm font-medium rounded-md",
                            item.current
                              ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Mobile quick panels */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowMobilePanels(!showMobilePanels)}
                    className="flex items-center justify-between w-full px-3 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center">
                      <Layers className="w-5 h-5 mr-3" />
                      {t('common.quickPanels', { fallback: 'Quick Panels' })}
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      showMobilePanels && "rotate-90"
                    )} />
                  </button>

                  <AnimatePresence>
                    {showMobilePanels && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1"
                      >
                        {quickPanels.map((panel) => {
                          const Icon = panel.icon;
                          return (
                            <button
                              key={panel.name}
                              onClick={() => {
                                panel.onClick();
                                setIsOpen(false);
                              }}
                              className="flex items-center w-full px-6 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                            >
                              <Icon className="w-4 h-4 mr-3" />
                              {panel.name}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ✅ Click outside to close dropdowns */}
      {(showDropdown || showPanelsDropdown || isOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowDropdown(false);
            setShowPanelsDropdown(false);
            setIsOpen(false);
          }}
        />
      )}

      {/* ✅ Lazy-loaded modals */}
      <Suspense fallback={null}>
        {activeModal === 'categories' && (
          <CategoryManager
            isOpen={true}
            onClose={closeModal}
          />
        )}
        
        {activeModal === 'recurring' && (
          <RecurringModal
            isOpen={true}
            onClose={closeModal}
          />
        )}
        
        {activeModal === 'exchange' && (
          <ExchangeCalculator
            isOpen={true}
            onClose={closeModal}
          />
        )}
        
        {activeModal === 'onboarding' && (
          <OnboardingModal
            isOpen={true}
            onClose={closeModal}
          />
        )}
      </Suspense>
    </>
  );
};

export default Header;