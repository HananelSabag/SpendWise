// components/layout/Header.jsx
import React, { useState } from 'react';
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
  Settings,
  ChevronDown,
  ChevronRight,
  Tag,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/helpers';
import { Avatar } from '../ui'; // Add Avatar import
import CategoryManager from '../features/categories/CategoryManager';
import RecurringModal from '../features/transactions/RecurringModal';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPanelsDropdown, setShowPanelsDropdown] = useState(false);
  const [showMobilePanels, setShowMobilePanels] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  
  // ✅ IMPROVED: Better authentication state handling
  const { user, logout, isAuthenticated, isLoggingOut, isLoading, isInitialized } = useAuth();
  const { t, language, sessionLanguage, toggleLanguage } = useLanguage();
  const { toggleTheme, isDark, sessionTheme } = useTheme();
  const navigate = useNavigate();
  
  const location = useLocation();
  const isRTL = language === 'he';
  
  // ✅ VERIFIED: Session-only theme toggle - no database updates
  const handleThemeToggle = () => {
    console.log('🎨 [HEADER] Session-only theme toggle triggered');
    toggleTheme(); // This calls changeThemeSession() - session only!
  };

  // ✅ VERIFIED: Session-only language toggle - no database updates
  const handleLanguageToggle = () => {
    console.log('🌐 [HEADER] Session-only language toggle triggered');
    toggleLanguage(); // This calls changeLanguageSession() - session only!
  };

  // ✅ NEW: Handle panel modal opening
  const handleOpenCategoryManager = () => {
    setShowCategoryManager(true);
    setShowPanelsDropdown(false);
    setShowMobilePanels(false);
    setIsOpen(false);
  };

  // ✅ FIXED: Update the handleOpenRecurringModal function
  const handleOpenRecurringModal = () => {
    console.log('🔄 [HEADER] Opening recurring modal from navigation');
    setShowRecurringModal(true);
    setShowPanelsDropdown(false);
    setShowMobilePanels(false);
    setIsOpen(false);
  };

  // ✅ FIXED: Add proper handleEditTransaction function
  const handleEditTransaction = (transaction, editSingle = false) => {
    console.log('✏️ [HEADER] Edit transaction triggered from recurring modal:', { 
      transactionId: transaction?.id, 
      editSingle 
    });
    
    // Close recurring modal first
    setShowRecurringModal(false);
    
    // Navigate to transactions page with edit state
    navigate('/transactions', { 
      state: { 
        editTransaction: transaction, 
        editingSingle: editSingle 
      } 
    });
  };

  // Check if the path is active
  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Animation variants
  const menuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, staggerChildren: 0.07 }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: isRTL ? 20 : -20 },
    open: { opacity: 1, x: 0 }
  };

  // ✅ UPDATED: Navigation items for desktop
  const desktopNavigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.transactions'), href: '/transactions', icon: CreditCard },
    { name: t('nav.profile'), href: '/profile', icon: User }
  ];

  // ✅ NEW: Mobile navigation including panels and logout
  const mobileNavigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.transactions'), href: '/transactions', icon: CreditCard },
    { name: t('nav.profile'), href: '/profile', icon: User }
  ];

  // ✅ NEW: Panel options
  const panelOptions = [
    {
      name: t('nav.categoryManager'),
      icon: Tag,
      onClick: handleOpenCategoryManager,
      description: t('nav.categoryManagerDesc')
    },
    {
      name: t('nav.recurringManager'),
      icon: Clock,
      onClick: handleOpenRecurringModal,
      description: t('nav.recurringManagerDesc')
    }
  ];

  // Handle navigation click
  const handleNavClick = (item, e) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
      setIsOpen(false);
    } else {
      navigate(item.href);
      setIsOpen(false);
    }
  };

  // Handle logout with loading state
  const handleLogout = async () => {
    try {
      setIsOpen(false);
      setShowDropdown(false);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // ✅ IMPROVED: Better authentication check - wait for initialization
  if (!isInitialized || isLoading) {
    return (
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  SpendWise
                </h1>
              </div>
            </div>
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Don't render if not authenticated after initialization
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  SpendWise
                </h1>
              </div>
            </div>

            {/* ✅ UPDATED: Desktop Navigation with Panels dropdown */}
            <nav className="hidden md:flex items-center space-x-8" dir={isRTL ? 'rtl' : 'ltr'}>
              {desktopNavigation.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActivePath(item.href)
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}

              {/* ✅ NEW: Panels Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPanelsDropdown(!showPanelsDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  {t('nav.panels')}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Panels Dropdown Menu */}
                <AnimatePresence>
                  {showPanelsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={cn(
                        "absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50",
                        isRTL ? 'right-0' : 'left-0'
                      )}
                    >
                      {panelOptions.map((option) => (
                        <button
                          key={option.name}
                          onClick={option.onClick}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors"
                        >
                          <option.icon className="w-4 h-4 mt-0.5 text-primary-500" />
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {option.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* ✅ Theme toggle - Session only with indicator */}
              <button
                onClick={handleThemeToggle}
                className={cn(
                  "p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative",
                  sessionTheme && "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                )}
                aria-label={t('common.toggleTheme')}
                title={sessionTheme ? `Session Override: ${sessionTheme}` : undefined}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                {/* Session override indicator */}
                {sessionTheme && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
              </button>

              {/* ✅ Language toggle - Session only with indicator */}
              <button
                onClick={handleLanguageToggle}
                className={cn(
                  "p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative",
                  sessionLanguage && "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                )}
                aria-label={t('common.toggleLanguage')}
                title={sessionLanguage ? `Session Override: ${sessionLanguage === 'he' ? 'עברית' : 'English'}` : undefined}
              >
                <Globe className="w-5 h-5" />
                {/* Session override indicator */}
                {sessionLanguage && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
              </button>

              {/* ✅ UPDATED: Desktop-only User dropdown with profile picture */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={t('common.openUserMenu')}
                >
                  <Avatar
                    size="sm"
                    name={user?.username}
                    src={user?.preferences?.profilePicture}
                  />
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Desktop Dropdown menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={cn(
                        "absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50",
                        isRTL ? 'left-0' : 'right-0'
                      )}
                    >
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                        {/* ✅ ADD: Session override indicators in dropdown */}
                        {(sessionTheme || sessionLanguage) && (
                          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            Session overrides active
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        {t('nav.profile')}
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? t('common.loading') : t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isOpen ? t('common.closeMenu') : t('common.openMenu')}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ✅ UPDATED: Mobile menu with Panels and Logout */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="px-4 py-4 space-y-2">
                {/* Regular navigation items */}
                {mobileNavigation.map((item) => (
                  <motion.button
                    key={item.name}
                    variants={itemVariants}
                    onClick={(e) => handleNavClick(item, e)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActivePath(item.href)
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </motion.button>
                ))}

                {/* ✅ NEW: Mobile Panels with expandable menu */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => setShowMobilePanels(!showMobilePanels)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5" />
                      {t('nav.panels')}
                    </div>
                    <ChevronRight 
                      className={cn(
                        'w-4 h-4 transition-transform',
                        showMobilePanels && 'rotate-90'
                      )} 
                    />
                  </button>

                  {/* Mobile Panels Submenu */}
                  <AnimatePresence>
                    {showMobilePanels && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 mt-2 space-y-1 overflow-hidden"
                      >
                        {panelOptions.map((option) => (
                          <button
                            key={option.name}
                            onClick={option.onClick}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <option.icon className="w-4 h-4" />
                            {option.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ✅ NEW: Mobile User Section */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {/* Session override indicators */}
                    {(sessionTheme || sessionLanguage) && (
                      <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        Session overrides active
                      </div>
                    )}
                  </div>

                  {/* ✅ NEW: Mobile Logout */}
                  <motion.button
                    variants={itemVariants}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-5 h-5" />
                    {isLoggingOut ? t('common.loading') : t('nav.logout')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ✅ Click outside handlers */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDropdown(false)}
        />
      )}
      {showPanelsDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowPanelsDropdown(false)}
        />
      )}

      {/* ✅ FIXED: Modals with proper state management */}
      {showCategoryManager && (
        <CategoryManager
          isOpen={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {showRecurringModal && (
        <RecurringModal
          isOpen={showRecurringModal}
          onClose={() => {
            console.log('❌ [HEADER] Closing recurring modal');
            setShowRecurringModal(false);
          }}
          onEdit={handleEditTransaction} // ✅ FIXED: Pass the edit handler
          onSuccess={() => {
            console.log('✅ [HEADER] Recurring modal operation successful');
            // Optionally refresh data or show success message
          }}
        />
      )}
    </>
  );
};

export default Header;