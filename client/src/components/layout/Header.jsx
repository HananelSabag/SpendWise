// components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  UserCircle, 
  ClipboardList, 
  Home, 
  LogOut, 
  ChevronDown,
  Settings,
  User
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../ui/Dropdown';

const Header = ({ title, greeting }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const isRTL = language === 'he';
  
  const isHomePage = location.pathname === '/dashboard';
  const isTransactionsPage = location.pathname === '/transactions';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigationItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: t('nav.home'),
      show: !isHomePage
    },
    {
      path: '/transactions',
      icon: ClipboardList,
      label: t('nav.transactions'),
      show: !isTransactionsPage
    }
  ];

  return (
    <header className="bg-primary-400 dark:bg-primary-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <h1 className="text-xl font-bold text-white">SpendWise</h1>
          </Link>

          {/* Center Title/Greeting */}
          {(greeting || title) && (
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full">
                <h1 className="text-xl font-bold text-white">
                  {greeting || title}
                </h1>
              </div>
            </div>
          )}

          {/* Right Navigation */}
          <div className="flex items-center gap-2">
            {/* Navigation Buttons */}
            {navigationItems
              .filter(item => item.show)
              .map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  aria-label={item.label}
                  title={item.label}
                >
                  <item.icon className="h-6 w-6" />
                </button>
              ))}
            
            {/* User Menu */}
            <Dropdown
              trigger={
                <button className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center gap-1">
                  <UserCircle className="h-6 w-6" />
                  <ChevronDown className="h-4 w-4" />
                </button>
              }
              align="right"
            >
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                
                <Dropdown.Item onClick={() => navigate('/profile')}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('nav.profile')}
                  </div>
                </Dropdown.Item>
                
                <Dropdown.Item onClick={() => navigate('/settings')}>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t('nav.settings')}
                  </div>
                </Dropdown.Item>
                
                <Dropdown.Divider />
                
                <Dropdown.Item onClick={handleLogout} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </div>
                </Dropdown.Item>
              </div>
            </Dropdown>
          </div>
        </div>

        {/* Mobile Title */}
        {(greeting || title) && (
          <div className="sm:hidden text-center py-2 pb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg mx-auto inline-block px-4 py-1">
              <h2 className="text-lg font-medium text-white truncate px-2">
                {greeting || title}
              </h2>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;