// components/layout/Header.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  CreditCard, 
  User, 
  LogOut,
  Moon,
  Sun,
  Bell,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Avatar } from '../ui';
import { cn } from '../../utils/helpers';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { darkMode, setDarkMode } = useAccessibility();
  const location = useLocation();
  const { pathname } = location;
  const isRTL = language === 'he';
  
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

  // Updated navigation items - only include pages that exist
  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.transactions'), href: '/transactions', icon: CreditCard },
    { name: t('nav.profile'), href: '/profile', icon: User }
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700 dark:from-primary-400 dark:to-primary-600">
                  SpendWise
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-4 rtl:space-x-reverse">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActivePath(item.href)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                  aria-current={isActivePath(item.href) ? 'page' : undefined}
                >
                  <item.icon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center">
            {/* Theme toggle */}
            <button
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={t('common.toggleTheme')}
            >
              <Sun className="h-5 w-5 hidden dark:block" />
              <Moon className="h-5 w-5 block dark:hidden" />
            </button>
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 hidden sm:block ml-2"
              aria-label={t('common.toggleLanguage')}
            >
              <span className="text-sm font-medium">
                {language === 'en' ? 'עב' : 'EN'}
              </span>
            </button>

            {/* User Dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  id="user-menu"
                  aria-haspopup="true"
                >
                  <span className="sr-only">{t('common.openUserMenu')}</span>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Avatar 
                      size="small" 
                      name={user?.username || 'User'} 
                      src={user?.avatar} 
                    />
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.username || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </button>
              </div>
              
              {/* User Dropdown Menu */}
              {showDropdown && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  
                  {/* Profile Link */}
                  <Link
                    to="/profile" // ✅ תיקון הניתוב לפרופיל
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'text-gray-700 dark:text-gray-300'
                    )}
                    onClick={() => setShowDropdown(false)}
                  >
                    <User className="w-4 h-4" />
                    {t('nav.profile')}
                  </Link>
                  
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4 mr-3 text-red-500 dark:text-red-400" />
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden ml-3">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-expanded={isOpen}
              >
                <span className="sr-only">
                  {isOpen ? t('common.closeMenu') : t('common.openMenu')}
                </span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={menuVariants}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
          {navigation.map((item) => (
            <motion.div key={item.name} variants={itemVariants}>
              <Link
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActivePath(item.href)
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
                aria-current={isActivePath(item.href) ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                {item.name}
              </Link>
            </motion.div>
          ))}
        </div>
        
        {/* Mobile menu additional actions */}
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center px-5">
            <div className="flex-shrink-0">
              <Avatar size="small" name={user?.username || 'User'} src={user?.avatar} />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                {user?.username || 'User'}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          </div>
          
          <div className="mt-3 px-2 space-y-1">
            <motion.div variants={itemVariants}>
              <button
                onClick={() => {
                  toggleLanguage();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {language === 'en' ? 'עברית' : 'English'}
              </button>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800"
              >
                <LogOut className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'} text-red-500 dark:text-red-400`} />
                {t('auth.logout')}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default Header;