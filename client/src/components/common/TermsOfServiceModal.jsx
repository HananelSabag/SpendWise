/**
 * 📄 TERMS OF SERVICE MODAL - MOBILE-FIRST
 * Enhanced terms of service with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText, CheckCircle, ExternalLink, Shield, Users, Gavel } from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme } from '../../stores';

import { Button, Modal } from '../ui';
import { cn } from '../../utils/helpers';

const TermsOfServiceModal = ({ isOpen, onClose, onAccept }) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('legal');
  const { isDark } = useTheme();

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  // Handle scroll to track if user has read to the bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setHasScrolledToBottom(scrolledToBottom);
  };

  // Terms sections
  const termsSections = [
    {
      id: 'agreement',
      title: t('terms.sections.agreement.title'),
      icon: Gavel,
      content: t('terms.sections.agreement.content')
    },
    {
      id: 'services',
      title: t('terms.sections.services.title'),
      icon: Shield,
      content: t('terms.sections.services.content')
    },
    {
      id: 'privacy',
      title: t('terms.sections.privacy.title'),
      icon: Users,
      content: t('terms.sections.privacy.content')
    },
    {
      id: 'liability',
      title: t('terms.sections.liability.title'),
      icon: ScrollText,
      content: t('terms.sections.liability.content')
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('terms.title')}
      maxWidth="2xl"
      className="max-h-[90vh]"
    >
      <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <ScrollText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {t('terms.header.title')}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('terms.header.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="max-h-96 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          onScroll={handleScroll}
        >
          {termsSections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <SectionIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h4>
                </div>
                
                <div className="ml-9 prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Additional legal information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              {t('terms.additional.title')}
            </h4>
            
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>{t('terms.additional.dataProtection')}</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>{t('terms.additional.userRights')}</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>{t('terms.additional.support')}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        {!hasScrolledToBottom && (
          <div className="mt-4 text-center">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {t('terms.scrollToRead')} ↓
            </motion.div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('actions.cancel')}
          </Button>
          
          <Button
            variant="primary"
            onClick={() => {
              onAccept?.();
              onClose();
            }}
            disabled={!hasScrolledToBottom}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('terms.accept')}
          </Button>
        </div>

        {/* Legal links */}
        <div className="mt-4 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('terms.links.privacy')}
            </button>
            <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('terms.links.cookies')}
            </button>
            <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('terms.links.contact')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TermsOfServiceModal; 