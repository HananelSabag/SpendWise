// components/layout/AuthLayout.jsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import FloatingMenu from '../common/FloatingMenu';
import AccessibilityMenu from '../common/AccessibilityMenu';
import { Languages } from 'lucide-react';

const AuthLayout = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const isRTL = language === 'he';

  return (
    <div className="min-h-screen gradient-primary flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <div className="block lg:hidden px-8 pt-8">
        <div className="max-w-md mx-auto text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <div className={cn(
              'w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center',
              isRTL ? 'ml-2' : 'mr-2'
            )}>
              <span className="text-2xl text-white font-bold">S</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">SpendWise</h1>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Branding Section - Desktop */}
        <div className={cn(
          'hidden lg:flex lg:w-1/2 p-12 items-center justify-center',
          isRTL ? 'lg:order-2' : 'lg:order-1'
        )}>
          <div className="max-w-lg">
            <Link to="/" className="flex items-center mb-8">
              <div className={cn(
                'w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center',
                isRTL ? 'ml-4' : 'mr-4'
              )}>
                <span className="text-2xl text-white font-bold">S</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white">SpendWise</h1>
            </Link>
            
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              {t('auth.welcomeTitle')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {t('auth.welcomeDescription')}
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center text-primary-500 dark:text-primary-400 mb-4 last:mb-0">
                  <div className={cn(
                    'w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center',
                    isRTL ? 'ml-3' : 'mr-3'
                  )}>
                    <span className="text-lg">✓</span>
                  </div>
                  <span className="font-medium">{t(`auth.features.feature${num}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className={cn(
          'w-full lg:w-1/2 flex items-center justify-center p-8',
          isRTL ? 'lg:order-1' : 'lg:order-2'
        )}>
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Floating Menu */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
        ]}
      />
      
      {/* Accessibility Menu */}
      <AccessibilityMenu />
    </div>
  );
};

export default AuthLayout;