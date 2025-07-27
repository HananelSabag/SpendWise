/**
 * 📋 TEMPLATE GRID - Template Display Grid
 * Extracted from massive InitialTemplatesStep.jsx for better organization
 * Features: Grid layout, Search functionality, Selection management, Animations
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, Filter, Plus } from 'lucide-react';

// ✅ Import stores and components
import { useTranslation } from '../../../../../stores';
import { Input, Button, Badge } from '../../../../ui';
import TemplateCard from './TemplateCard';
import CustomTemplateForm from './CustomTemplateForm';
import { filterTemplates } from './TemplateLibrary';
import { cn } from '../../../../../utils/helpers';

/**
 * 📋 Template Grid Component
 */
const TemplateGrid = ({
  templates = [],
  selectedTemplates = [],
  onTemplateToggle,
  onCustomTemplateCreate,
  
  // Search & Filter
  searchTerm = '',
  onSearchChange,
  showSearch = true,
  
  // Custom template creation
  showCustomForm = false,
  onToggleCustomForm,
  
  // Layout options
  layout = 'grid', // grid, list
  columns = 'auto', // auto, 2, 3, 4
  showEmptyState = true,
  
  // Styling
  className = '',
  cardProps = {}
}) => {
  const { t, isRTL } = useTranslation('onboarding');

  // ✅ Filter templates based on search
  const filteredTemplates = useMemo(() => {
    return filterTemplates(templates, searchTerm);
  }, [templates, searchTerm]);

  // ✅ Grid column configuration
  const gridCols = useMemo(() => {
    if (columns === 'auto') {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
    return `grid-cols-${columns}`;
  }, [columns]);

  // ✅ Check if template is selected
  const isTemplateSelected = (template) => {
    return selectedTemplates.some(selected => selected.id === template.id);
  };

  // ✅ Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  // ✅ Empty state
  const renderEmptyState = () => {
    if (!showEmptyState) return null;

    const isSearchEmpty = searchTerm && filteredTemplates.length === 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full text-center py-12"
      >
        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          {isSearchEmpty ? (
            <Search className="w-8 h-8 text-gray-400" />
          ) : (
            <Grid className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isSearchEmpty 
            ? t('templates.search.noResults') 
            : t('templates.empty.title')
          }
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {isSearchEmpty 
            ? t('templates.search.noResultsDescription', { query: searchTerm })
            : t('templates.empty.description')
          }
        </p>
        
        {!isSearchEmpty && onToggleCustomForm && (
          <Button
            onClick={onToggleCustomForm}
            variant="primary"
            className="inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('templates.createFirst')}</span>
          </Button>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn("space-y-6", className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Search and Controls */}
      {(showSearch || onToggleCustomForm) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={t('templates.search.placeholder')}
                className="pl-10"
              />
              
              {/* Search results count */}
              {searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" size="sm">
                    {filteredTemplates.length}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Selection Summary */}
            {selectedTemplates.length > 0 && (
              <Badge variant="primary">
                {t('templates.selected', { count: selectedTemplates.length })}
              </Badge>
            )}

            {/* Custom Template Button */}
            {onToggleCustomForm && (
              <Button
                variant={showCustomForm ? "primary" : "outline"}
                onClick={onToggleCustomForm}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('templates.addCustom')}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Custom Template Form */}
      <AnimatePresence>
        {showCustomForm && (
          <CustomTemplateForm
            isOpen={showCustomForm}
            onSubmit={onCustomTemplateCreate}
            onCancel={onToggleCustomForm}
          />
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          layout === 'grid' 
            ? `grid gap-4 ${gridCols}` 
            : 'space-y-3'
        )}
      >
        <AnimatePresence mode="popLayout">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                variants={itemVariants}
                layout
              >
                <TemplateCard
                  template={template}
                  isSelected={isTemplateSelected(template)}
                  onToggle={onTemplateToggle}
                  size={layout === 'list' ? 'compact' : 'default'}
                  showCategory={true}
                  showFrequency={true}
                  {...cardProps}
                />
              </motion.div>
            ))
          ) : (
            renderEmptyState()
          )}
        </AnimatePresence>
      </motion.div>

      {/* Load More Button (if needed) */}
      {filteredTemplates.length > 12 && (
        <div className="text-center pt-4">
          <Button variant="outline">
            {t('templates.loadMore')}
          </Button>
        </div>
      )}

      {/* Summary Footer */}
      {selectedTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                {t('templates.summary.title')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('templates.summary.description', { 
                  count: selectedTemplates.length 
                })}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {selectedTemplates.length}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {t('templates.summary.templates')}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TemplateGrid; 