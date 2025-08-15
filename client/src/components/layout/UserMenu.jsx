/**
 * 👤 USER MENU - Desktop User Dropdown Component
 * Extracted from Header.jsx for better performance and maintainability
 * Features: User profile, Admin options, Logout, Mobile-responsive
 * @version 2.1.0 - UX Simplified
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, User, LogOut, Shield, 
  Settings, HelpCircle
} from 'lucide-react';

// ✅ Import Zustand stores and hooks
import { 
  useAuth, 
  useTranslation,
  useNotifications,
  useIsAdmin,
  useIsSuperAdmin
} from '../../stores';
import { Avatar, Button } from '../ui';
import { cn } from '../../utils/helpers';
import OnboardingModal from '../features/onboarding/OnboardingModal';

const UserMenu = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const { t, isRTL = false } = useTranslation() || { t: (key) => key, isRTL: false };
  const { addNotification } = useNotifications();
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();
  const hasAdminAccess = Boolean(
    isSuperAdmin ||
    isAdmin ||
    (user && ['admin', 'super_admin'].includes(user.role))
  );
  
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Main user menu items - SIMPLIFIED
  const userMenuItems = [
    {
      name: t('nav.profile'),
      href: '/profile',
      icon: User,
      description: t('nav.profileDesc'),
      action: 'navigate'
    },
    {
      name: t('nav.help'),
      icon: HelpCircle,
      description: 'Restart setup guide',
      action: 'onboarding' // ✅ Special action to trigger onboarding
    }
  ];

  // ✅ Admin menu items - SIMPLIFIED PER USER REQUEST
  const adminMenuItems = hasAdminAccess ? [
    {
      name: t('nav.admin'),
      href: '/admin',
      icon: Shield,
      description: 'Admin Dashboard',
      action: 'navigate'
    },
    // ✅ System Settings - Only for super admin (includes user management)
    ...(isSuperAdmin ? [{
      name: 'System Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Manage users & system settings',
      action: 'navigate'
    }] : [])
  ] : [];

  // ✅ State for onboarding trigger
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ✅ Handle navigation
  const handleNavigation = useCallback((href) => {
    navigate(href);
    setShowDropdown(false);
  }, [navigate]);

  // ✅ Handle onboarding trigger
  const handleOnboardingTrigger = useCallback(() => {
    console.log('🎯 UserMenu - Triggering onboarding from Help button');
    setShowOnboarding(true);
    setShowDropdown(false);
    
    addNotification({
      type: 'info',
      message: 'Starting setup guide...',
      duration: 2000
    });
  }, [addNotification]);

  // ✅ Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    console.log('🎯 UserMenu - Onboarding completed from Help trigger');
    setShowOnboarding(false);
    
    addNotification({
      type: 'success',
      message: 'Setup guide completed!',
      duration: 3000
    });
  }, [addNotification]);

  // ✅ Handle onboarding close
  const handleOnboardingClose = useCallback(() => {
    console.log('🎯 UserMenu - Onboarding closed from Help trigger');
    setShowOnboarding(false);
  }, []);

  // ✅ Handle menu item actions
  const handleMenuItemClick = useCallback((item) => {
    if (item.action === 'onboarding') {
      handleOnboardingTrigger();
    } else if (item.action === 'navigate' && item.href) {
      handleNavigation(item.href);
    }
  }, [handleOnboardingTrigger, handleNavigation]);

  // ✅ Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowDropdown(false);
      
      addNotification({
        type: 'success',
        message: t('auth.logoutSuccess')
      });
      
      navigate('/auth/login');
    } catch (error) {
      addNotification({
        type: 'error',
        message: t('auth.logoutError')
      });
    }
  }, [logout, addNotification, t, navigate]);

  // ✅ Close dropdown when clicking outside
  const handleBackdropClick = useCallback(() => {
    setShowDropdown(false);
  }, []);

  return (
    <div className={cn("relative hidden lg:block", className)}>
      {/* User button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <Avatar
          src={user?.avatar || user?.profile_picture_url || user?.profilePicture}
          alt={user?.name || user?.email}
          size="sm"
          fallback={user?.name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0)}
        />
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.name || user?.username || t('common.user')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </p>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform",
          showDropdown && "rotate-180"
        )} />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-30 lg:hidden"
              onClick={handleBackdropClick}
            />
            
            {/* Dropdown content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
                isRTL ? "left-0" : "right-0"
              )}
            >
              <div className="p-4">
                {/* User info header */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Avatar
                    src={user?.avatar}
                    alt={user?.name || user?.email}
                    size="md"
                    fallback={user?.name?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name || user?.username || t('common.user')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                    {hasAdminAccess && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 mt-1">
                        <Shield className="w-3 h-3 mr-1" />
                        {t('common.admin')}
                      </span>
                    )}
                  </div>
                </div>

                {/* User menu items */}
                <div className="py-2">
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleMenuItemClick(item)}
                        className="w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Admin section */}
                {adminMenuItems.length > 0 && (
                  <div className="py-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center px-3 py-2">
                      <Shield className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('nav.administration')}
                      </span>
                    </div>
                    {adminMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleMenuItemClick(item)}
                          className="w-full flex items-center p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-red-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Logout */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 rounded-lg text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t('auth.logout')}
                      </p>
                      <p className="text-xs opacity-75">
                        {t('auth.logoutDesc')}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ Onboarding Modal - Triggered from Help button */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          onClose={handleOnboardingClose}
          onSkip={handleOnboardingClose}
          forceShow={true} // Force show when triggered manually
          previewOnly={true} // Do not change DB on help-triggered onboarding
        />
      )}
    </div>
  );
};

export default UserMenu; 