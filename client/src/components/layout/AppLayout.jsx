// components/layout/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PageContainer from './PageContainer';
import AccessibilityMenu from '../common/AccessibilityMenu';
import FloatingMenu from '../common/FloatingMenu';
import { Languages, DollarSign } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';

const AppLayout = () => {
  const { t, toggleLanguage, language } = useLanguage();
  const { toggleCurrency } = useCurrency();
  const isRTL = language === 'he';

  return (
    <div 
      className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Header />
      
      <main className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
      
      <Footer />
      
      {/* Accessibility Menu */}
      <AccessibilityMenu />
      
      {/* Floating Menu */}
      <FloatingMenu
        buttons={[
          {
            label: t('floatingMenu.changeLanguage'),
            icon: Languages,
            onClick: toggleLanguage,
          },
          {
            label: t('floatingMenu.switchCurrency'),
            icon: DollarSign,
            onClick: toggleCurrency,
          },
        ]}
      />
    </div>
  );
};

export default AppLayout;