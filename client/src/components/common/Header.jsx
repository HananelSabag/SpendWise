// components/common/Header.jsx
// Contextual header with user dropdown and dynamic navigation
import React, { useEffect, useRef, useState } from "react"; 
import { UserCircle, ClipboardList, Home, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

const Header = ({ title, greeting }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { logout } = useAuth();
  const userMenuRef = useRef(null);
  const isRTL = language === 'he';
  
  // State for user dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Determine if we're on the home page or transactions page
  const isHomePage = location.pathname === '/';
  const isTransactionsPage = location.pathname === '/transactions';

  // Enhanced click outside handling for user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && 
          !userMenuRef.current.contains(event.target) && 
          isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Enhanced logout handler
  const handleLogout = async () => {
    try {
      setIsUserMenuOpen(false);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation handlers
  const goToProfile = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  const goToTransactions = () => {
    navigate('/transactions');
  };
  
  const goToHome = () => {
    navigate('/');
  };

  // User menu dropdown
  const UserMenu = () => (
    <div className="py-2">
      <button
        onClick={goToProfile}
        className="flex items-center px-4 py-2 text-sm text-primary-700 hover:bg-gray-50 w-full dark:text-primary-400 dark:hover:bg-gray-800"
      >
        <UserCircle className="h-4 w-4 mr-2 text-primary-700 dark:text-primary-400" />
        {t("home.nav.profile")}
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center px-4 py-2 text-sm text-error hover:bg-gray-50 w-full dark:hover:bg-gray-800"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t("home.nav.logout")}
      </button>
    </div>
  );

  return (
    <header className="bg-primary-400 dark:bg-primary-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4 relative">
          {/* Logo area */}
          <div className="flex items-center gap-3 z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <h1 className="text-xl font-bold text-white">SpendWise</h1>
            </Link>
          </div>

          {/* Greeting - absolutely positioned with better mobile handling */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 mx-auto hidden sm:block">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full whitespace-nowrap">
              <h1 className="text-xl font-bold text-white">
                {greeting || title}
              </h1>
            </div>
          </div>

          {/* Right area - navigation buttons */}
          <div className="flex items-center gap-2 z-10">
            {/* Contextual button - changes based on current page */}
            {isHomePage && (
              <button 
                onClick={goToTransactions}
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                aria-label="Transactions"
                title={t("home.nav.transctionsMangment")}
              >
                <ClipboardList className="h-6 w-6" />
              </button>
            )}
            
            {isTransactionsPage && (
              <button 
                onClick={goToHome}
                className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                aria-label="Home"
                title={t("home.nav.overview")}
              >
                <Home className="h-6 w-6" />
              </button>
            )}
            
            {/* If we're not on home or transactions page, show both buttons */}
            {!isHomePage && !isTransactionsPage && (
              <>
                <button 
                  onClick={goToHome}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  aria-label="Home"
                  title={t("home.nav.overview")}
                >
                  <Home className="h-6 w-6" />
                </button>
                <button 
                  onClick={goToTransactions}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                  aria-label="Transactions"
                  title={t("home.nav.transctionsMangment")}
                >
                  <ClipboardList className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* User menu button with dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors flex items-center gap-1"
                aria-label="User Menu"
              >
                <UserCircle className="h-6 w-6" />
                <ChevronDown className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg overflow-hidden transform transition-all duration-200 ease-out origin-top-right z-50 dark:bg-gray-800 dark:border dark:border-gray-700">
                  <UserMenu />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile greeting - only visible on small screens */}
        <div className="sm:hidden text-center py-2 pb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg mx-auto inline-block px-4 py-1">
            <h2 className="text-lg font-medium text-white truncate px-2">
              {greeting || title}
            </h2>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;