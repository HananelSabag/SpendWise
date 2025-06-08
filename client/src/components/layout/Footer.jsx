// components/layout/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { ExternalLink, Mail, Phone, Heart, Info } from 'lucide-react';
import AccessibilityStatement from '../common/AccessibilityStatement';

const Footer = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'he';
  const currentYear = new Date().getFullYear();
  const [showAccessibilityStatement, setShowAccessibilityStatement] = useState(false);

  // Only use the navigation links that exist in our app
  const navigation = {
    main: [
      { name: t('nav.dashboard'), href: '/' },
      { name: t('nav.transactions'), href: '/transactions' },
      { name: t('nav.profile'), href: '/profile' },
    ],
    legal: [
      { name: t('footer.privacy'), href: '#', onClick: () => {} },
      { name: t('footer.terms'), href: '#', onClick: () => {} },
      { 
        name: t('footer.accessibility'), 
        href: '#', 
        onClick: () => setShowAccessibilityStatement(true) 
      },
    ],
    social: [
      { name: 'GitHub', href: 'https://github.com/your-repo/spendwise' },
      { name: 'Twitter', href: 'https://twitter.com/spendwise' },
    ],
  };

  return (
    <>
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo and Mission */}
            <div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-xl text-white font-bold">S</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-800 dark:text-white">SpendWise</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                {t('footer.description')}
              </p>
            </div>

            {/* Navigation Links */}
            <div className={`md:${isRTL ? 'mr-auto' : 'ml-auto'} grid grid-cols-2 gap-8`}>
              {/* Pages */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('footer.navigation')}
                </h3>
                <ul className="mt-4 space-y-2">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link 
                        to={item.href} 
                        className="text-base text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('footer.legal')}
                </h3>
                <ul className="mt-4 space-y-2">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a 
                        href={item.href} 
                        onClick={(e) => {
                          e.preventDefault();
                          if (item.onClick) item.onClick();
                        }}
                        className="text-base text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('footer.supportTitle')}
              </h3>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {t('footer.supportDescription')}
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <Mail className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-gray-600 dark:text-gray-400`}>
                    support@spendwise.com
                  </span>
                </li>
                <li className="flex items-start">
                  <Phone className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-gray-600 dark:text-gray-400`}>
                    +972-3-1234567
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('footer.copyright', { year: currentYear })}
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                {navigation.social.map((item) => (
                  <a 
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    <span className="sr-only">{item.name}</span>
                    <ExternalLink className="h-5 w-5" aria-hidden="true" />
                  </a>
                ))}
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                  <span>{t('footer.madeWith')}</span>
                  <Heart className="h-4 w-4 mx-1 text-red-500" />
                  <span>{t('footer.inIsrael')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Accessibility Statement Modal */}
      <AccessibilityStatement 
        isOpen={showAccessibilityStatement} 
        onClose={() => setShowAccessibilityStatement(false)} 
      />
    </>
  );
};

export default Footer;