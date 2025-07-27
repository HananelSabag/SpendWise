/**
 * 🔒 PRIVACY POLICY MODAL - MOBILE-FIRST
 * Enhanced privacy policy with better UX
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Eye, Database, Lock, Globe, Users, 
  CheckCircle, AlertCircle, ExternalLink, Info
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme } from '../../stores';

import { Button, Modal, Badge } from '../ui';
import { cn } from '../../utils/helpers';

const PrivacyPolicyModal = ({ isOpen, onClose, onAccept }) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('legal');
  const { isDark } = useTheme();

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // Handle scroll to track if user has read to the bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setHasScrolledToBottom(scrolledToBottom);
  };

  // Privacy sections
  const privacySections = [
    {
      id: 'dataCollection',
      title: t('privacy.sections.dataCollection.title'),
      icon: Database,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      content: t('privacy.sections.dataCollection.content'),
      importance: 'high'
    },
    {
      id: 'dataUsage',
      title: t('privacy.sections.dataUsage.title'),
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      content: t('privacy.sections.dataUsage.content'),
      importance: 'high'
    },
    {
      id: 'dataSecurity',
      title: t('privacy.sections.dataSecurity.title'),
      icon: Lock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      content: t('privacy.sections.dataSecurity.content'),
      importance: 'high'
    },
    {
      id: 'thirdParty',
      title: t('privacy.sections.thirdParty.title'),
      icon: Globe,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      content: t('privacy.sections.thirdParty.content'),
      importance: 'medium'
    },
    {
      id: 'userRights',
      title: t('privacy.sections.userRights.title'),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      content: t('privacy.sections.userRights.content'),
      importance: 'high'
    }
  ];

  // Data protection highlights
  const protectionHighlights = [
    {
      icon: Shield,
      title: t('privacy.protection.encryption.title'),
      description: t('privacy.protection.encryption.description')
    },
    {
      icon: Lock,
      title: t('privacy.protection.access.title'),
      description: t('privacy.protection.access.description')
    },
    {
      icon: Database,
      title: t('privacy.protection.storage.title'),
      description: t('privacy.protection.storage.description')
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('privacy.title')}
      maxWidth="2xl"
      className="max-h-[90vh]"
    >
      <div style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                {t('privacy.header.title')}
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('privacy.header.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Protection highlights */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {protectionHighlights.map((highlight, index) => {
            const HighlightIcon = highlight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
              >
                <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <HighlightIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                  {highlight.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {highlight.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Content */}
        <div 
          className="max-h-80 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          onScroll={handleScroll}
        >
          {privacySections.map((section, index) => {
            const SectionIcon = section.icon;
            const isSelected = selectedSection === section.id;
            
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "border rounded-xl p-4 transition-all cursor-pointer",
                  isSelected 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                onClick={() => setSelectedSection(isSelected ? null : section.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      section.bgColor
                    )}>
                      <SectionIcon className={cn("w-4 h-4", section.color)} />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={section.importance === 'high' ? 'destructive' : 'secondary'}
                          size="xs"
                        >
                          {t(`privacy.importance.${section.importance}`)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {section.importance === 'high' && (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Contact information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {t('privacy.contact.title')}
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <p>{t('privacy.contact.email')}: privacy@spendwise.com</p>
                    <p>{t('privacy.contact.address')}: 123 Privacy Street, Data City, DC 12345</p>
                    <p>{t('privacy.contact.phone')}: +1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Last updated */}
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('privacy.lastUpdated')}: {new Date().toLocaleDateString()}
            </p>
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
              {t('privacy.scrollToRead')} ↓
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
            {t('actions.close')}
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
            {t('privacy.understood')}
          </Button>
        </div>

        {/* Legal links */}
        <div className="mt-4 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('privacy.links.gdpr')}
            </button>
            <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('privacy.links.ccpa')}
            </button>
            <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('privacy.links.cookies')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal; 