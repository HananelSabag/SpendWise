/**
 * 🦶 FOOTER — compact single-band design
 * Navigation removed (redundant with top/bottom nav).
 * Keeps legal links, contact, and branding.
 */

import React, { useState } from 'react';
import { Heart, Github, ExternalLink } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useTranslation } from '../../stores';
import BrandMark from '../common/BrandMark';

const AccessibilityStatement = lazy(() => import('../common/AccessibilityStatement'));
const PrivacyPolicyModal      = lazy(() => import('../common/PrivacyPolicyModal'));
const TermsOfServiceModal     = lazy(() => import('../common/TermsOfServiceModal'));

const Footer = () => {
  const { t, isRTL }  = useTranslation();
  const currentYear   = new Date().getFullYear();

  const [showAccess,  setShowAccess]  = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms,   setShowTerms]   = useState(false);

  const legalItems = [
    { label: t('footer.privacyPolicy',        { fallback: 'Privacy Policy' }),        onClick: () => setShowPrivacy(true) },
    { label: t('footer.termsOfService',       { fallback: 'Terms of Service' }),       onClick: () => setShowTerms(true)   },
    { label: t('footer.accessibilityStatement',{ fallback: 'Accessibility' }),         onClick: () => setShowAccess(true)  },
  ];

  const supportEmail = window.__SW_SUPPORT_EMAIL__ || 'spendwise.verifiction@gmail.com';

  return (
    <>
      <footer
        dir={isRTL ? 'rtl' : 'ltr'}
        className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700/40 pb-20 md:pb-0"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          {/* Single row: brand · legal links · contact */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            {/* Brand */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 shrink-0">
              <BrandMark size="sm" />
              <span className="font-bold text-indigo-600 dark:text-indigo-400">SpendWise</span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="flex items-center gap-1">
                {t('footer.madeWith', { fallback: 'Made with' })}
                <Heart className="w-3.5 h-3.5 text-red-500 inline" />
              </span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span>© {currentYear}</span>
            </div>

            {/* Legal + contact */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
              {legalItems.map(({ label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-start"
                >
                  {label}
                </button>
              ))}
              <a
                href={`mailto:${supportEmail}`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t('footer.contact', { fallback: 'Contact' })}
              </a>
              <a
                href="https://github.com/HananelSabag/SpendWise"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Suspense fallback={null}>
        <AccessibilityStatement isOpen={showAccess}  onClose={() => setShowAccess(false)}  />
        <PrivacyPolicyModal     isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        <TermsOfServiceModal    isOpen={showTerms}   onClose={() => setShowTerms(false)}   />
      </Suspense>
    </>
  );
};

export default Footer;
