/**
 * 📱 MOBILE NAVIGATION - Mobile-First Navigation Component
 * Extracted from Header.jsx for better performance and maintainability
 * Features: Hamburger menu, Mobile drawer, Touch-friendly navigation
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
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
  Settings,
  ChevronRight,
  Tag,
  Clock,
  HelpCircle,
  Shield,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation,
  useIsAdmin,
  useIsSuperAdmin
} from '../../stores';

import { cn } from '../../utils/helpers';
import { Avatar, Button } from '../ui';

/**
 * 📱 Mobile Navigation Component
 */
const MobileNavigation = ({ 
  isOpen, 
  setIsOpen, 
  onOpenModal,
  className = '' 
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const translationResult = useTranslation();
  const { t, isRTL = false } = translationResult || { t: (key) => key, isRTL: false };
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();
  
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Navigation items with fallbacks
  const navigationItems = [
    {
      name: t('nav.dashboard') || 'Dashboard',
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    },
    {
      name: t('nav.transactions') || 'Transactions', 
      href: '/transactions',
      icon: CreditCard,
      current: location.pathname === '/transactions'
    },
    {
      name: t('nav.analytics') || 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname === '/analytics'
    },
    {
      name: t('nav.profile') || 'Profile',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile'
    }
  ];

  // ✅ Admin navigation (if user is admin or super admin)
  const adminItems = (isAdmin || isSuperAdmin) ? [
    {
      name: t('nav.adminDashboard') || 'Admin Dashboard',
      href: '/admin',
      icon: Shield,
      current: location.pathname.startsWith('/admin')
    }
  ] : [];

  // ✅ Quick actions (mobile panels)
  const quickActions = [
    {
      name: t('common.categoryManager', { fallback: t('common.categories') }),
      description: t('common.manageCategoriesDesc'),
      icon: Tag,
      color: 'blue',
      onClick: () => {
        onOpenModal?.('categories');
        setIsOpen(false);
      }
    },
    {
      name: t('common.recurringManager', { fallback: t('common.recurring') }),
      description: t('common.recurringTransactionsDesc'),
      icon: Clock,
      color: 'green',
      onClick: () => {
        onOpenModal?.('recurring');
        setIsOpen(false);
      }
    },
    {
      name: t('common.calculator'),
      description: t('common.quickCalculatorDesc'),
      icon: Activity,
      color: 'purple',
      onClick: () => {
        onOpenModal?.('exchange');
        setIsOpen(false);
      }
    }
  ];

  // ✅ Debug logging (moved after all variable declarations)
  if (import.meta.env.DEV && isOpen) {
    console.log('🔍 Mobile Navigation Debug:', {
      isOpen,
      navigationItems,
      navigationItemsLength: navigationItems.length,
      isAuthenticated,
      user: user?.email,
      isAdmin,
      isSuperAdmin,
      adminItems,
      adminItemsLength: adminItems.length,
      quickActions,
      quickActionsLength: quickActions.length,
      translations: {
        dashboard: t('nav.dashboard'),
        transactions: t('nav.transactions'),
        analytics: t('nav.analytics'),
        profile: t('nav.profile'),
        navigation: t('nav.navigation'),
        quickActions: t('common.quickActions'),
        administration: t('nav.administration')
      },
      navigationItemsDetails: navigationItems.map(item => ({
        name: item.name,
        href: item.href,
        current: item.current,
        translationResult: item.name
      }))
    });
  }

  // ✅ Handle navigation
  const handleNavigation = useCallback((href) => {
    navigate(href);
    setIsOpen(false);
  }, [navigate, setIsOpen]);

  // ✅ Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, setIsOpen, navigate]);

  return (
    <>
      {/* ✅ Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
        aria-label={isOpen ? t('common.closeMenu') : t('common.openMenu')}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* ✅ Mobile slide-out drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-[55] lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ 
                x: isRTL ? '100%' : '-100%',
                opacity: 0 
              }}
              animate={{ 
                x: 0,
                opacity: 1 
              }}
              exit={{ 
                x: isRTL ? '100%' : '-100%',
                opacity: 0 
              }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className={cn(
                "fixed top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-gray-900 shadow-xl z-[60] overflow-hidden",
                isRTL ? "right-0" : "left-0"
              )}
              style={{ height: '100dvh' }}
            >
                              <div className="flex flex-col h-full min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={user?.avatar || user?.profile_picture_url || user?.profilePicture}
                      alt={user?.username || user?.name || user?.email}
                      size="md"
                      fallback={user?.username?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0)}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.username || user?.name || t('common.user') || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-2 overflow-y-auto min-h-0">
                  {/* Main Navigation */}
                  <div className="px-4 mb-6 min-h-0">
                                          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {t('nav.navigation') || 'Navigation'}
                      </h3>
                      <nav className="space-y-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleNavigation(item.href)}
                            className={cn(
                              "w-full flex items-center px-4 py-4 rounded-lg text-left transition-colors min-h-[48px]",
                              item.current
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            <Icon className="w-5 h-5 mr-3" />
                            <span className="font-medium">{item.name}</span>
                            {item.current && (
                              <ChevronRight className={cn("w-4 h-4 ml-auto", isRTL && "rotate-180")} />
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Quick Actions */}
                  {quickActions.length > 0 && (
                    <div className="px-4 mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {t('common.quickActions') || 'Quick Actions'}
                      </h3>
                      <div className="space-y-2">
                        {quickActions.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.name}
                              onClick={action.onClick}
                              className="w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center mr-3",
                                action.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                                action.color === 'green' && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                                action.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {action.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {action.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Admin Section */}
                  {adminItems.length > 0 && (
                    <div className="px-4 mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        {t('nav.administration') || 'Administration'}
                      </h3>
                                              <nav className="space-y-2">
                        {adminItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.name}
                              onClick={() => handleNavigation(item.href)}
                              className={cn(
                                "w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors",
                                item.current
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                              )}
                            >
                              <Icon className="w-5 h-5 mr-3" />
                              <span className="font-medium">{item.name}</span>
                              {item.current && (
                                <ChevronRight className={cn("w-4 h-4 ml-auto", isRTL && "rotate-180")} />
                              )}
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('auth.logout') || 'Logout'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation; 