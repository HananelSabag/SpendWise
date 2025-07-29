/**
 * 🎯 HEADER COMPONENT - SIMPLIFIED ORCHESTRATOR!
 * 🚀 Mobile-first, Component-based, Clean architecture
 * Features: Component orchestration, Modal management, Performance optimized
 * @version 2.0.0 - COMPLETE REFACTOR
 */

import React, { useState, useCallback, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Shield } from 'lucide-react';

// ✅ Import Zustand stores
import { 
  useAuth, 
  useTranslation, 
  useTheme,
  useIsAdmin,
  useIsSuperAdmin
} from '../../stores';

// ✅ Import extracted components
import MobileNavigation from './MobileNavigation';
import UserMenu from './UserMenu';
import QuickPanels from './QuickPanels';
import HeaderActions from './HeaderActions';

import { cn } from '../../utils/helpers';
import { LoadingSpinner } from '../ui';

// ✅ Lazy-loaded modals for performance
const CategoryManager = React.lazy(() => import('../features/categories/CategoryManager'));
const RecurringSetupModal = React.lazy(() => import('../features/transactions/modals/RecurringSetupModal'));
const ExchangeCalculator = React.lazy(() => import('../features/exchange/ExchangeCalculator'));
const OnboardingModal = React.lazy(() => import('../features/onboarding/OnboardingModal'));

const Header = () => {
  // ✅ Zustand stores
  const { user, isAuthenticated } = useAuth();
  const { t, isRTL } = useTranslation();
  const { isDark } = useTheme();
  const isAdmin = useIsAdmin();
  const isSuperAdmin = useIsSuperAdmin();

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // ✅ Modal management
  const openModal = useCallback((modalType) => {
    setActiveModal(modalType);
    setIsMobileMenuOpen(false); // Close mobile menu when opening modal
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // ✅ Early return for unauthenticated users
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* ✅ Main Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700",
          "supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ✅ Left side - Logo & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile Navigation */}
              <MobileNavigation
                isOpen={isMobileMenuOpen}
                setIsOpen={setIsMobileMenuOpen}
                onOpenModal={openModal}
              />

              {/* Logo */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center"
                >
                  <span className="text-white font-bold text-lg">S</span>
                </motion.div>
                <span className="hidden sm:block text-xl font-bold">
                  {t('common.appName', { fallback: 'SpendWise' })}
                </span>
              </button>
            </div>

            {/* ✅ Center - Main Navigation (Desktop) - CLEANED UP */}
            <nav className="hidden lg:flex items-center space-x-8">
              {[
                { name: t('nav.dashboard'), href: '/', current: location.pathname === '/' },
                { name: t('nav.transactions'), href: '/transactions', current: location.pathname === '/transactions' },
                { name: t('nav.analytics'), href: '/analytics', current: location.pathname === '/analytics' }
                // ✅ REMOVED: Profile (moved to user dropdown only)
                // ✅ REMOVED: Admin Dashboard (moved to user dropdown only)
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-1",
                    item.current
                      ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>

            {/* ✅ Right side - Actions & User Menu */}
            <div className="flex items-center space-x-3">
              {/* Quick Panels (Desktop) - KEPT AS REQUESTED */}
              <QuickPanels onOpenModal={openModal} />

              {/* Header Actions - SIMPLIFIED (removed settings, moved to user menu) */}
              <HeaderActions onOpenModal={openModal} />

              {/* User Menu - ENHANCED (contains all other options) */}
              <UserMenu />
            </div>
          </div>
        </div>
      </motion.header>

      {/* ✅ Modals */}
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      }>
        {activeModal === 'categories' && (
          <CategoryManager
            isOpen={true}
            onClose={closeModal}
          />
        )}
        
        {activeModal === 'recurring' && (
          <RecurringSetupModal
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