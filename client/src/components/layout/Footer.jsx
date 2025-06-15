// components/layout/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ExternalLink, Mail, Heart, Info } from 'lucide-react';
import AccessibilityStatement from '../common/AccessibilityStatement';
import PrivacyPolicyModal from '../common/PrivacyPolicyModal';
import TermsOfServiceModal from '../common/TermsOfServiceModal';

const Footer = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const currentYear = new Date().getFullYear();
  const [showAccessibilityStatement, setShowAccessibilityStatement] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // Only use the navigation links that exist in our app
  const navigation = {
    main: [
      { name: t('nav.dashboard'), href: '/' },
      { name: t('nav.transactions'), href: '/transactions' },
      { name: t('nav.profile'), href: '/profile' },
    ],
    legal: [
      { 
        name: isRTL ? 'מדיניות פרטיות' : 'Privacy Policy', 
        href: '#', 
        onClick: () => setShowPrivacyPolicy(true)
      },
      { 
        name: isRTL ? 'תקנון השימוש' : 'Terms of Service', 
        href: '#', 
        onClick: () => setShowTermsOfService(true)
      },
      { 
        name: isRTL ? 'הצהרת נגישות' : 'Accessibility Statement', 
        href: '#', 
        onClick: () => setShowAccessibilityStatement(true) 
      },
      { 
        name: isRTL ? 'חוק הגנת הפרטיות' : 'Privacy Protection Law', 
        href: 'https://www.gov.il/he/departments/legalInfo/cpifp_law',
        external: true
      },
    ],
  };

  return (
    <>
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Logo and Mission */}
            <div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-lg text-white font-bold">S</span>
                </div>
                <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-lg font-bold text-gray-800 dark:text-white`}>SpendWise</span>
              </div>
              <p className={`mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL 
                  ? 'פלטפורמה חכמה לניהול כספים אישיים. עקוב אחר ההוצאות, חסוך כסף והשג יעדים פיננסיים.'
                  : 'Smart personal finance management platform. Track expenses, save money, and achieve your financial goals.'
                }
              </p>
            </div>

            {/* Navigation Links */}
            <div className={`md:${isRTL ? 'mr-auto' : 'ml-auto'} grid grid-cols-2 gap-6`}>
              {/* Pages */}
              <div className={isRTL ? 'order-2' : 'order-1'}>
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  {isRTL ? 'ניווט' : 'Navigation'}
                </h3>
                <ul className="space-y-2">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link 
                        to={item.href} 
                        className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div className={isRTL ? 'order-1' : 'order-2'}>
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  {isRTL ? 'משפטי' : 'Legal'}
                </h3>
                <ul className="space-y-2">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      {item.external ? (
                        <a 
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors inline-flex items-center"
                        >
                          {item.name}
                          <ExternalLink className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />
                        </a>
                      ) : (
                        <a 
                          href={item.href} 
                          onClick={(e) => {
                            e.preventDefault();
                            if (item.onClick) item.onClick();
                          }}
                          className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors cursor-pointer"
                        >
                          {item.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {isRTL ? 'תמיכה' : 'Support'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {isRTL 
                  ? 'יש לך שאלות? אנחנו כאן לעזור'
                  : 'Have questions? We are here to help'
                }
              </p>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail className="flex-shrink-0 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <a 
                  href="mailto:spendwise.verification@gmail.com"
                  className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
                >
                  spendwise.verification@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className={`flex flex-col md:flex-row justify-between items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isRTL 
                  ? `© ${currentYear} SpendWise. כל הזכויות שמורות.`
                  : `© ${currentYear} SpendWise. All rights reserved.`
                }
              </p>
              <div className={`flex items-center mt-4 md:mt-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <span>{isRTL ? 'נוצר עם' : 'Made with'}</span>
                  <Heart className="h-3 w-3 mx-1 text-red-500" />
                  <span>{isRTL ? 'בישראל' : 'in Israel'}</span>
                </div>
              </div>
            </div>
            
            {/* Legal Compliance Note */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                {isRTL 
                  ? 'האתר פועל בהתאם לחוק הגנת הפרטיות התשמ"א-1981 ולתקנותיו'
                  : 'This website operates in accordance with Israeli Privacy Protection Law 1981'
                }
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AccessibilityStatement 
        isOpen={showAccessibilityStatement} 
        onClose={() => setShowAccessibilityStatement(false)} 
      />
      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicy} 
        onClose={() => setShowPrivacyPolicy(false)} 
      />
      <TermsOfServiceModal 
        isOpen={showTermsOfService} 
        onClose={() => setShowTermsOfService(false)} 
      />
    </>
  );
};

export default Footer;