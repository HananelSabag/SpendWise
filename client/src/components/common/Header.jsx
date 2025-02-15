import React, { useEffect, useRef } from "react"; 
import { Menu, UserCircle, ClipboardList, LogOut, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

const Header = ({ isMenuOpen, setIsMenuOpen, title, greeting }) => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const menuRef = useRef(null);  

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsMenuOpen]);

  // Close menu when changing route
  useEffect(() => {
    return () => setIsMenuOpen(false);
  }, [setIsMenuOpen]);

  const MenuContent = () => (
    <div className="py-2">
      <Link
        to="/"
        className="flex items-center px-4 py-2 text-sm text-primary-700 hover:bg-gray-50 w-full"
        onClick={() => setIsMenuOpen(false)}
      >
        <Home className="h-4 w-4 mr-2 text-primary-700" />
        {t("home.nav.overview")}
      </Link>
      <Link
        to="/profile"
        className="flex items-center px-4 py-2 text-sm text-primary-700 hover:bg-gray-50 w-full"
        onClick={() => setIsMenuOpen(false)}
      >
        <UserCircle className="h-4 w-4 mr-2 text-primary-700" />
        {t("home.nav.profile")}
      </Link>
      <Link
        to="/transactions"
        className="flex items-center px-4 py-2 text-sm text-primary-600 hover:bg-gray-50 w-full"
        onClick={() => setIsMenuOpen(false)}
      >
        <ClipboardList className="h-4 w-4 mr-2" />
        {t("home.nav.transctionsMangment")}
      </Link>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logout();
        }}
        className="flex items-center px-4 py-2 text-sm text-error hover:bg-gray-50 w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t("home.nav.logout")}
      </button>
    </div>
  );

  return (
    <header className="bg-primary-300/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <h1 className="text-2xl font-bold text-primary-500">SpendWise</h1>
          </div>

          {/* Desktop Title/Greeting */}
          <div className="hidden md:flex flex-1 justify-center mr-32">
            <h1
              className={`text-3xl font-bold ${greeting
                  ? "bg-clip-text text-transparent bg-gradient-to-r from-gray-400 to-gray-700"
                  : "text-black text-opacity-80"
                } drop-shadow-sm`}
              style={{
                fontFamily: "'Poppins', sans-serif",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                letterSpacing: "-0.5px",
              }}
            >
              {greeting || title}
            </h1>
          </div>

          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Menu Dropdown */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg overflow-hidden
                             transform transition-all duration-200 ease-out
                             origin-top-right z-50">
                <MenuContent />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Title/Greeting Row */}
        <div className="md:hidden text-center py-2">
          <h2
            className={`text-lg font-medium ${greeting
                ? "text-gray-600"
                : "text-gray-700"
              } truncate px-2`}
          >
            {greeting || title}
          </h2>
        </div>
      </div>
    </header>
  );
};

export default Header;