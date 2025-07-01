// components/layout/Header.jsx - MINIMAL RTL FIXES ONLY
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
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

import { cn } from '../../utils/helpers';
import { Avatar } from '../ui';
import CategoryManager from '../features/categories/CategoryManager';
import RecurringModal from '../features/transactions/RecurringModal';
import ExchangeCalculator from '../features/exchange/ExchangeCalculator';
import OnboardingModal from '../features/onboarding/OnboardingModal';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPanelsDropdown, setShowPanelsDropdown] = useState(false);
  const [showMobilePanels, setShowMobilePanels] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showExchangeCalculator, setShowExchangeCalculator] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { user, logout, isAuthenticated, isLoggingOut, isLoading, isInitialized } = useAuth();
  const { t, language, sessionLanguage, toggleLanguage } = useLanguage();
  const { toggleTheme, isDark, sessionTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const isHebrew = language === 'he';
  
  const themeSessionOverride = sessionTheme && sessionTheme !== (user?.preferences?.theme || 'light');
  const languageSessionOverride = sessionLanguage && sessionLanguage !== (user?.preferences?.language || 'en');
  
  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLanguageToggle = () => {
    toggleLanguage();
  };

  const handleOpenCategoryManager = () => {
    setShowCategoryManager(true);
    setShowPanelsDropdown(false);
    setShowMobilePanels(false);
    setIsOpen(false);
  };

  const handleOpenRecurringModal = () => {
    setShowRecurringModal(true);
    setShowPanelsDropdown(false);
    setShowMobilePanels(false);
    setIsOpen(false);
  };

  const handleOpenExchangeCalculator = () => {
    setShowExchangeCalculator(true);
    setShowPanelsDropdown(false);
    setShowMobilePanels(false);
    setIsOpen(false);
  };

  const handleEditTransaction = (transaction, editSingle = false) => {
    setShowRecurringModal(false);
    navigate('/transactions', { 
      state: { 
        editTransaction: transaction, 
        editingSingle: editSingle 
      } 
    });
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
    closed: { opacity: 0, x: isHebrew ? 20 : -20 },
    open: { opacity: 1, x: 0 }
  };

  // Navigation items - same order for all languages
  const navigationItems = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.transactions'), href: '/transactions', icon: CreditCard },
    { name: t('nav.profile'), href: '/profile', icon: User }
  ];

  // Panel options
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
    },
    {
      name: t('nav.exchangeCalculator'),
      icon: DollarSign,
      onClick: handleOpenExchangeCalculator,
      description: t('nav.exchangeCalculatorDesc')
    }
  ];

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

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      setShowDropdown(false);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left side in English / Right side in Hebrew - Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  SpendWise
                </h1>
              </div>
            </div>

            {/* Center section - Navigation */}
            <div className={cn(
              "hidden md:flex items-center",
              isHebrew ? "flex-row-reverse gap-8" : "gap-8"
            )}>
              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isHebrew && "flex-row-reverse",
                    isActivePath(item.href)
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}

              {/* Panels Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPanelsDropdown(!showPanelsDropdown)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors",
                    isHebrew && "flex-row-reverse"
                  )}
                >
                  <Layers className="w-4 h-4" />
                  {t('nav.panels')}
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    showPanelsDropdown && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showPanelsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={cn(
                        "absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50",
                        // 🚀 ONLY FIX: Proper RTL positioning for panels dropdown
                        isHebrew ? "right-0" : "left-0"
                      )}
                    >
                      {panelOptions.map((option) => (
                        <button
                          key={option.name}
                          onClick={option.onClick}
                          className={cn(
                            "w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors",
                            isHebrew ? "text-right flex-row-reverse" : "text-left"
                          )}
                        >
                          <option.icon className="w-4 h-4 mt-0.5 text-primary-500" />
                          <div className={isHebrew ? "text-right" : "text-left"}>
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
            </div>

            {/* Controls - same order for mobile, RTL for desktop */}
            <div className={cn(
              "flex items-center gap-2",
              "md:gap-2",
              isHebrew ? "md:flex-row-reverse" : ""
            )}>
              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                className={cn(
                  "p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative",
                  themeSessionOverride && "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                )}
                aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
                title={themeSessionOverride ? `Session Override: ${sessionTheme} (Saved: ${user?.preferences?.theme || 'light'})` : `Click to switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
                {themeSessionOverride && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
              </button>

              {/* Language Toggle */}
              <button
                onClick={handleLanguageToggle}
                className={cn(
                  "p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative",
                  languageSessionOverride && "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                )}
                aria-label={t('common.toggleLanguage')}
                title={languageSessionOverride ? `Session Override: ${sessionLanguage === 'he' ? 'עברית' : 'English'} (Saved: ${user?.preferences?.language === 'he' ? 'עברית' : 'English'})` : undefined}
              >
                <Globe className="w-5 h-5" />
                {languageSessionOverride && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
              </button>

              {/* Desktop User Dropdown */}
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

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={cn(
                        "absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50",
                        // 🚀 ONLY FIX: User dropdown positioning stays as original
                        isHebrew ? 'left-0' : 'right-0'
                      )}
                    >
                      <div className={cn(
                        "px-4 py-2 border-b border-gray-100 dark:border-gray-700",
                        isHebrew && "text-right"
                      )}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                        {(themeSessionOverride || languageSessionOverride) && (
                          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            {t('common.sessionOverrideActive')}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2",
                          isHebrew ? "text-right flex-row-reverse" : "text-left"
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        {t('nav.profile')}
                      </button>

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowOnboarding(true);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors',
                          isHebrew ? "text-right flex-row-reverse" : "text-left"
                        )}
                      >
                        <HelpCircle className="w-4 h-4" />
                        {t('nav.help')}
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={cn(
                          "w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50",
                          isHebrew ? "text-right flex-row-reverse" : "text-left"
                        )}
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? t('common.loading') : t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
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
                {/* Navigation Items */}
                {navigationItems.map((item) => (
                  <motion.button
                    key={item.name}
                    variants={itemVariants}
                    onClick={(e) => handleNavClick(item, e)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isHebrew && "flex-row-reverse text-right",
                      isActivePath(item.href)
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </motion.button>
                ))}

                {/* Mobile Panels */}
                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => setShowMobilePanels(!showMobilePanels)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors",
                      isHebrew && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-3",
                      isHebrew && "flex-row-reverse"
                    )}>
                      <Layers className="w-5 h-5" />
                      {t('nav.panels')}
                    </div>
                    <ChevronRight 
                      className={cn(
                        'w-4 h-4 transition-transform',
                        showMobilePanels && 'rotate-90',
                        isHebrew && !showMobilePanels && 'rotate-180'
                      )} 
                    />
                  </button>

                  <AnimatePresence>
                    {showMobilePanels && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "mt-2 space-y-1 overflow-hidden",
                          isHebrew ? "mr-8" : "ml-8"
                        )}
                      >
                        {panelOptions.map((option) => (
                          <button
                            key={option.name}
                            onClick={option.onClick}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                              isHebrew && "flex-row-reverse text-right"
                            )}
                          >
                            <option.icon className="w-4 h-4" />
                            {option.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Mobile Help */}
                <motion.button
                  variants={itemVariants}
                  onClick={() => {
                    setIsOpen(false);
                    setShowOnboarding(true);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
                    isHebrew && "flex-row-reverse text-right"
                  )}
                >
                  <HelpCircle className="w-5 h-5" />
                  {t('nav.help')}
                </motion.button>

                {/* Mobile User Section */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2 mb-2">
                    <div className={cn(
                      "flex items-center gap-3",
                      isHebrew && "flex-row-reverse"
                    )}>
                      <Avatar
                        size="sm"
                        name={user?.username}
                        src={user?.preferences?.profilePicture}
                      />
                      <div className={isHebrew ? "text-right" : "text-left"}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {(themeSessionOverride || languageSessionOverride) && (
                      <div className={cn(
                        "mt-2 text-xs text-amber-600 dark:text-amber-400",
                        isHebrew ? "text-right" : "text-left"
                      )}>
                        {t('common.sessionOverrideActive')}
                      </div>
                    )}
                  </div>

                  <motion.button
                    variants={itemVariants}
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50",
                      isHebrew && "flex-row-reverse text-right"
                    )}
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

      {/* Click Outside Handlers */}
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

      {/* Modals */}
      {showCategoryManager && (
        <CategoryManager
          isOpen={showCategoryManager}
          onClose={() => setShowCategoryManager(false)}
        />
      )}

      {showRecurringModal && (
        <RecurringModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          onEdit={handleEditTransaction}
          onSuccess={() => {
            // Optionally refresh data or show success message
          }}
        />
      )}

      {showExchangeCalculator && (
        <ExchangeCalculator
          isOpen={showExchangeCalculator}
          onClose={() => setShowExchangeCalculator(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          forceShow={true}
        />
      )}
    </>
  );
};

export default Header;