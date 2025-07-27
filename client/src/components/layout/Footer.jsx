/**
 * 🦶 FOOTER COMPONENT - Mobile-First Responsive Footer
 * Features: Zustand stores, Mobile-responsive, Modern design
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Mail, Heart, Info, Github, Twitter, Shield } from 'lucide-react';

// ✅ NEW: Import Zustand stores (replaces Context API!)
import { useTranslation, useAuth } from '../../stores';

import AccessibilityStatement from '../common/AccessibilityStatement';
import PrivacyPolicyModal from '../common/PrivacyPolicyModal';
import TermsOfServiceModal from '../common/TermsOfServiceModal';

const Footer = () => {
  // ✅ NEW: Zustand stores (replacing Context API)
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  
  const currentYear = new Date().getFullYear();
  const [showAccessibilityStatement, setShowAccessibilityStatement] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // ✅ Mobile-first navigation configuration
  const navigation = {
    main: [
      { name: t('nav.dashboard', { fallback: 'Dashboard' }), href: '/' },
      { name: t('nav.transactions', { fallback: 'Transactions' }), href: '/transactions' },
      { name: t('nav.analytics', { fallback: 'Analytics' }), href: '/analytics' },
      { name: t('nav.profile', { fallback: 'Profile' }), href: '/profile' },
    ],
    admin: user?.isAdmin ? [
      { name: t('nav.admin', { fallback: 'Admin' }), href: '/admin' },
      { name: t('nav.userManagement', { fallback: 'Users' }), href: '/admin/users' },
      { name: t('nav.systemStats', { fallback: 'Statistics' }), href: '/admin/stats' },
      ...(user?.isSuperAdmin ? [
        { name: t('nav.systemSettings', { fallback: 'Settings' }), href: '/admin/settings' }
      ] : [])
    ] : [],
    legal: [
      { 
        name: t('footer.privacyPolicy', { fallback: 'Privacy Policy' }), 
        href: '#', 
        onClick: () => setShowPrivacyPolicy(true)
      },
      { 
        name: t('footer.termsOfService', { fallback: 'Terms of Service' }), 
        href: '#', 
        onClick: () => setShowTermsOfService(true)
      },
      { 
        name: t('footer.accessibilityStatement', { fallback: 'Accessibility Statement' }), 
        href: '#', 
        onClick: () => setShowAccessibilityStatement(true) 
      },
      { 
        name: t('footer.privacyProtectionLaw', { fallback: 'Privacy Protection Law' }), 
        href: 'https://www.gov.il/he/departments/legalInfo/cpifp_law',
        external: true
      },
    ],
    support: [
      { 
        name: t('footer.help', { fallback: 'Help Center' }), 
        href: '/help'
      },
      { 
        name: t('footer.contact', { fallback: 'Contact Us' }), 
        href: 'mailto:support@spendwise.app',
        external: true
      },
      { 
        name: t('footer.documentation', { fallback: 'Documentation' }), 
        href: '/docs'
      }
    ]
  };

  // ✅ Social media links
  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/spendwise',
      icon: Github
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/spendwise',
      icon: Twitter
    }
  ];

  return (
    <>
      <footer className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 ${isRTL ? 'rtl' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ✅ Main footer content */}
          <div className="py-8 lg:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* ✅ Company info */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <div className="flex items-center mb-4">
                  <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    SpendWise
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                  {t('footer.description', { 
                    fallback: 'Take control of your finances with intelligent expense tracking and analytics.' 
                  })}
                </p>
                
                {/* Social links - Mobile optimized */}
                <div className="flex space-x-4">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                        aria-label={item.name}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* ✅ Main navigation */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                  {t('footer.navigation', { fallback: 'Navigation' })}
                </h4>
                <ul className="space-y-3">
                  {navigation.main.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ✅ Admin navigation (if user is admin) */}
              {user?.isAdmin && navigation.admin.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      {t('footer.adminPanel', { fallback: 'Admin Panel' })}
                    </div>
                  </h4>
                  <ul className="space-y-3">
                    {navigation.admin.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ✅ Support links */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                  {t('footer.support', { fallback: 'Support' })}
                </h4>
                <ul className="space-y-3">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center"
                        >
                          {item.name}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <Link
                          to={item.href}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {item.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ✅ Legal links - Responsive positioning */}
              <div className={user?.isAdmin ? '' : 'lg:col-start-4'}>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                  {t('footer.legal', { fallback: 'Legal' })}
                </h4>
                <ul className="space-y-3">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center"
                        >
                          {item.name}
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <button
                          onClick={item.onClick}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left"
                        >
                          {item.name}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ✅ Bottom section - Mobile optimized */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Copyright */}
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  © {currentYear} SpendWise. 
                  <span className="mx-1 flex items-center">
                    {t('footer.madeWith', { fallback: 'Made with' })}
                    <Heart className="w-4 h-4 mx-1 text-red-500" />
                    {t('footer.byTeam', { fallback: 'by the SpendWise team' })}
                  </span>
                </span>
              </div>

              {/* Version info */}
              <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
                <span>v2.0.0</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  {t('footer.poweredBy', { fallback: 'Powered by Zustand & React' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ✅ Modals */}
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