/**
 * ♿ ACCESSIBILITY STATEMENT - MOBILE-FIRST
 * Enhanced accessibility statement with better information
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, Keyboard, Volume2, Monitor, Smartphone,
  CheckCircle, AlertCircle, Mail, ExternalLink, Heart,
  Settings, Users, Globe, Book, HelpCircle
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import { useTranslation, useTheme } from '../../stores';

import { Button, Card, Badge, Modal } from '../ui';
import { cn } from '../../utils/helpers';

const AccessibilityStatement = ({ 
  isOpen, 
  onClose,
  className = '' 
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL, currentLanguage } = useTranslation('accessibility');
  const { isDark } = useTheme();

  const [activeSection, setActiveSection] = useState('overview');

  // Accessibility features we support
  const accessibilityFeatures = [
    {
      id: 'screenReader',
      title: t('statement.features.screenReader.title'),
      description: t('statement.features.screenReader.description'),
      icon: Volume2,
      status: 'full',
      details: [
        t('statement.features.screenReader.detail1'),
        t('statement.features.screenReader.detail2'),
        t('statement.features.screenReader.detail3')
      ]
    },
    {
      id: 'keyboard',
      title: t('statement.features.keyboard.title'),
      description: t('statement.features.keyboard.description'),
      icon: Keyboard,
      status: 'full',
      details: [
        t('statement.features.keyboard.detail1'),
        t('statement.features.keyboard.detail2'),
        t('statement.features.keyboard.detail3')
      ]
    },
    {
      id: 'visual',
      title: t('statement.features.visual.title'),
      description: t('statement.features.visual.description'),
      icon: Eye,
      status: 'full',
      details: [
        t('statement.features.visual.detail1'),
        t('statement.features.visual.detail2'),
        t('statement.features.visual.detail3')
      ]
    },
    {
      id: 'mobile',
      title: t('statement.features.mobile.title'),
      description: t('statement.features.mobile.description'),
      icon: Smartphone,
      status: 'full',
      details: [
        t('statement.features.mobile.detail1'),
        t('statement.features.mobile.detail2'),
        t('statement.features.mobile.detail3')
      ]
    },
    {
      id: 'cognitive',
      title: t('statement.features.cognitive.title'),
      description: t('statement.features.cognitive.description'),
      icon: Monitor,
      status: 'partial',
      details: [
        t('statement.features.cognitive.detail1'),
        t('statement.features.cognitive.detail2'),
        t('statement.features.cognitive.detail3')
      ]
    }
  ];

  // Standards we comply with
  const standards = [
    {
      name: 'WCAG 2.1',
      level: 'AA',
      description: t('statement.standards.wcag.description'),
      status: 'compliant'
    },
    {
      name: 'Section 508',
      level: 'Compliant',
      description: t('statement.standards.section508.description'),
      status: 'compliant'
    },
    {
      name: 'ADA',
      level: 'Title III',
      description: t('statement.standards.ada.description'),
      status: 'compliant'
    },
    {
      name: 'EN 301 549',
      level: 'European',
      description: t('statement.standards.en301549.description'),
      status: 'partial'
    }
  ];

  // Known limitations
  const limitations = [
    {
      issue: t('statement.limitations.charts.issue'),
      impact: t('statement.limitations.charts.impact'),
      workaround: t('statement.limitations.charts.workaround'),
      status: 'planned'
    },
    {
      issue: t('statement.limitations.pdf.issue'),
      impact: t('statement.limitations.pdf.impact'),
      workaround: t('statement.limitations.pdf.workaround'),
      status: 'in-progress'
    }
  ];

  // Navigation sections
  const sections = [
    { id: 'overview', label: t('statement.sections.overview'), icon: Shield },
    { id: 'features', label: t('statement.sections.features'), icon: CheckCircle },
    { id: 'standards', label: t('statement.sections.standards'), icon: Book },
    { id: 'limitations', label: t('statement.sections.limitations'), icon: AlertCircle },
    { id: 'contact', label: t('statement.sections.contact'), icon: Mail }
  ];

  // Get status configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'full':
      case 'compliant':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          icon: CheckCircle,
          label: t('statement.status.full')
        };
      case 'partial':
      case 'in-progress':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          icon: AlertCircle,
          label: t('statement.status.partial')
        };
      case 'planned':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          icon: HelpCircle,
          label: t('statement.status.planned')
        };
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          icon: AlertCircle,
          label: t('statement.status.unknown')
        };
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start space-x-3">
                <Heart className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    {t('statement.overview.commitment.title')}
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                    {t('statement.overview.commitment.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p>{t('statement.overview.introduction')}</p>
              <p>{t('statement.overview.scope')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  WCAG 2.1 AA
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('statement.overview.compliance')}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Date().getFullYear()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('statement.overview.lastUpdated')}
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            {accessibilityFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              const statusConfig = getStatusConfig(feature.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FeatureIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        
                        <div className={cn(
                          "flex items-center space-x-1 px-2 py-1 rounded-full text-xs",
                          statusConfig.bgColor
                        )}>
                          <StatusIcon className={cn("w-3 h-3", statusConfig.color)} />
                          <span className={statusConfig.color}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                        {feature.description}
                      </p>
                      
                      <div className="space-y-1">
                        {feature.details.map((detail, index) => (
                          <div key={index} className="flex items-start space-x-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case 'standards':
        return (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {t('statement.standards.introduction')}
            </p>
            
            {standards.map((standard) => {
              const statusConfig = getStatusConfig(standard.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={standard.name} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {standard.name}
                      </h3>
                      <Badge variant="secondary" size="sm" className="mt-1">
                        {standard.level}
                      </Badge>
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-1 px-3 py-1 rounded-full",
                      statusConfig.bgColor
                    )}>
                      <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
                      <span className={cn("text-sm font-medium", statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {standard.description}
                  </p>
                </Card>
              );
            })}
          </div>
        );

      case 'limitations':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    {t('statement.limitations.title')}
                  </h3>
                  <p className="text-orange-800 dark:text-orange-200 text-sm">
                    {t('statement.limitations.description')}
                  </p>
                </div>
              </div>
            </div>

            {limitations.map((limitation, index) => {
              const statusConfig = getStatusConfig(limitation.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                        {limitation.issue}
                      </h3>
                      
                      <div className={cn(
                        "flex items-center space-x-1 px-2 py-1 rounded-full text-xs ml-3",
                        statusConfig.bgColor
                      )}>
                        <StatusIcon className={cn("w-3 h-3", statusConfig.color)} />
                        <span className={statusConfig.color}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('statement.limitations.impact')}:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {limitation.impact}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('statement.limitations.workaround')}:
                        </span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {limitation.workaround}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300">
              {t('statement.contact.introduction')}
            </p>

            <div className="grid gap-4">
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('statement.contact.email.title')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {t('statement.contact.email.description')}
                    </p>
                    <a 
                      href="mailto:accessibility@spendwise.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      accessibility@spendwise.com
                    </a>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('statement.contact.community.title')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {t('statement.contact.community.description')}
                    </p>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('statement.contact.community.join')}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t('statement.contact.responseTime')}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('statement.title')}
      maxWidth="4xl"
    >
      <div 
        className="flex flex-col lg:flex-row gap-6 max-h-[80vh]"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Navigation sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="space-y-2">
            {sections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "primary" : "outline"}
                  onClick={() => setActiveSection(section.id)}
                  className="w-full justify-start"
                >
                  <SectionIcon className="w-4 h-4 mr-3" />
                  {section.label}
                </Button>
              );
            })}
          </div>

          {/* Quick settings */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('statement.quickSettings')}
            </h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Open accessibility menu */}}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('statement.openAccessibilityMenu')}
              </Button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderSectionContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('statement.footer.lastUpdated')}: {new Date().toLocaleDateString()} |{' '}
          <a 
            href="#" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('statement.footer.viewHistory')}
          </a>
        </p>
      </div>
    </Modal>
  );
};

export default AccessibilityStatement;