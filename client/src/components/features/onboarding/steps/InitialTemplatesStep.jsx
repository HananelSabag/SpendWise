/**
 * 📋 INITIAL TEMPLATES STEP - CLEAN ORCHESTRATOR
 * COMPLETELY REFACTORED from 623-line monster to clean orchestrator
 * Features: Component-based architecture, Extracted logic, Mobile-first, Performance optimized
 * @version 4.0.0 - COMPLETE REDESIGN SUCCESS! 🎉
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

// ✅ Import our NEW clean components
import TemplateCategories from './templates/TemplateCategories';
import TemplateGrid from './templates/TemplateGrid';
import { 
  TEMPLATE_LIBRARY, 
  TEMPLATE_CATEGORIES, 
  getTemplatesByCategory,
  getTemplateStats 
} from './templates/TemplateLibrary';

// ✅ Import stores
import { 
  useTranslation, 
  useNotifications 
} from '../../../../stores';

import { Badge } from '../../../ui';
import { cn } from '../../../../utils/helpers';

/**
 * 📋 Initial Templates Step - Clean Orchestrator
 */
const InitialTemplatesStep = ({
  data = [],
  onDataUpdate,
  onNext,
  onBack,
  onComplete,
  isFirstStep = false,
  isLastStep = false,
  isCompleting = false,
  className = ''
}) => {
  const { t, isRTL } = useTranslation('onboarding');
  const { addNotification } = useNotifications();

  // ✅ Local state
  const [selectedTemplates, setSelectedTemplates] = useState(data || []);
  const [currentCategory, setCurrentCategory] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // ✅ Get templates for current category
  const currentTemplates = useMemo(() => {
    return getTemplatesByCategory(currentCategory);
  }, [currentCategory]);

  // ✅ Template counts for categories
  const templateCounts = useMemo(() => {
    return Object.keys(TEMPLATE_LIBRARY).reduce((counts, categoryId) => {
      counts[categoryId] = TEMPLATE_LIBRARY[categoryId].length;
      return counts;
    }, {});
  }, []);

  // ✅ Handle template selection
  const handleTemplateToggle = useCallback((template) => {
    setSelectedTemplates(prev => {
      const isSelected = prev.some(t => t.id === template.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = prev.filter(t => t.id !== template.id);
      } else {
        newSelection = [...prev, template];
      }

      // Update parent data
      onDataUpdate?.(newSelection, false);
      
      return newSelection;
    });
  }, [onDataUpdate]);

  // ✅ Handle custom template creation
  const handleCustomTemplateCreate = useCallback((templateData) => {
    setSelectedTemplates(prev => {
      const newSelection = [...prev, templateData];
      onDataUpdate?.(newSelection, false);
      return newSelection;
    });

    setShowCustomForm(false);
    
    addNotification({
      type: 'success',
      message: t('templates.customCreated'),
      duration: 3000
    });
  }, [onDataUpdate, addNotification, t]);

  // ✅ Handle category change
  const handleCategoryChange = useCallback((categoryId) => {
    setCurrentCategory(categoryId);
    setSearchTerm(''); // Clear search when changing category
    
    if (categoryId === 'custom') {
      setShowCustomForm(true);
    } else {
      setShowCustomForm(false);
    }
  }, []);

  // ✅ Handle completion
  const handleComplete = useCallback(async () => {
    try {
      if (onComplete) {
        await onComplete(selectedTemplates);
      }

      addNotification({
        type: 'success',
        message: t('templates.setupComplete'),
        duration: 4000
      });

      onNext?.();
    } catch (error) {
      console.error('Template completion failed:', error);
      addNotification({
        type: 'error',
        message: t('templates.setupFailed'),
        duration: 5000
      });
    }
  }, [selectedTemplates, onComplete, addNotification, t, onNext]);

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6 h-full flex flex-col", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4 flex-shrink-0">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('templates.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('templates.subtitle')}
          </p>
        </div>

        {/* Selected count */}
        {selectedTemplates.length > 0 && (
          <Badge variant="primary" className="mx-auto">
            {t('templates.selected', { count: selectedTemplates.length })}
          </Badge>
        )}
      </motion.div>

      {/* Category Navigation */}
      <motion.div variants={itemVariants} className="flex-shrink-0">
        <TemplateCategories
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
          templateCounts={templateCounts}
          showCounts={true}
          layout="tabs"
        />
      </motion.div>

      {/* Templates Display */}
      <motion.div variants={itemVariants} className="flex-1 overflow-hidden">
        <TemplateGrid
          templates={currentTemplates}
          selectedTemplates={selectedTemplates}
          onTemplateToggle={handleTemplateToggle}
          onCustomTemplateCreate={handleCustomTemplateCreate}
          
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSearch={currentCategory !== 'custom'}
          
          showCustomForm={showCustomForm}
          onToggleCustomForm={() => setShowCustomForm(!showCustomForm)}
          
          layout="grid"
          columns="auto"
          showEmptyState={true}
          
          className="h-full overflow-y-auto"
        />
      </motion.div>

      {/* Continue Button */}
      {selectedTemplates.length > 0 && !isLastStep && (
        <motion.div
          variants={itemVariants}
          className="flex-shrink-0 text-center pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isCompleting 
                ? t('templates.setting') 
                : t('templates.continue', { count: selectedTemplates.length })
              }
            </span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InitialTemplatesStep; 