/**
 * 🏷️ CATEGORY FORM FIELDS - SHARED COMPONENTS
 * Eliminates duplication and provides consistent category form UX
 * Features: Icon selector, Color picker, Type toggle, Mobile-first
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

import React, { useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Palette, Type, TrendingUp, TrendingDown, 
  ArrowUpDown, Eye, EyeOff, Pin, PinOff,
  Search, Grid, List
} from 'lucide-react';

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Card, Switch, Badge, Input, Button } from '../../../ui';
import { getFieldError } from './CategoryValidation';
import { 
  CATEGORY_TYPES, 
  CATEGORY_TYPE_OPTIONS,
  COLOR_PALETTE,
  ICON_CATEGORIES,
  getIconSuggestions
} from './CategoryHelpers';
import { getIconComponent } from '../../../../config/categoryIcons';
import { cn } from '../../../../utils/helpers';

/**
 * 🎨 Color Picker Component
 */
const ColorPicker = ({ value, onChange, error }) => {
  const { t } = useTranslation('categories');
  const [selectedCategory, setSelectedCategory] = useState('primary');

  const colorCategories = {
    primary: COLOR_PALETTE.filter(c => c.category === 'primary'),
    secondary: COLOR_PALETTE.filter(c => c.category === 'secondary'),
    neutral: COLOR_PALETTE.filter(c => c.category === 'neutral')
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.color.label')} *
      </label>

      {/* Color Category Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {Object.keys(colorCategories).map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "primary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="flex-1 text-xs"
          >
            {t(`colors.${category}`)}
          </Button>
        ))}
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-8 gap-2">
        {colorCategories[selectedCategory].map((color) => (
          <motion.button
            key={color.value}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(color.value)}
            className={cn(
              "w-8 h-8 rounded-lg border-2 transition-all relative",
              value === color.value 
                ? "border-gray-900 dark:border-white scale-110" 
                : "border-gray-300 dark:border-gray-600 hover:scale-105"
            )}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            {value === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

/**
 * 🎯 Icon Selector Component
 */
const IconSelector = ({ value, onChange, categoryName = '', error }) => {
  const { t } = useTranslation('categories');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  // AI suggestions based on category name
  const aiSuggestions = useMemo(() => {
    return getIconSuggestions(categoryName);
  }, [categoryName]);

  // Filter icons
  const filteredIcons = useMemo(() => {
    let icons = ICON_CATEGORIES.find(cat => cat.id === selectedCategory)?.icons || [];

    if (searchQuery) {
      icons = icons.filter(icon => 
        icon.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return icons;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fields.icon.label')} *
      </label>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && categoryName && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">AI</span>
            </div>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('fields.icon.suggestions')}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {aiSuggestions.map((iconName) => {
              const IconComponent = getIconComponent(iconName);
              return (
                <motion.button
                  key={iconName}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onChange(iconName)}
                  className={cn(
                    "p-2 rounded-lg border transition-all",
                    value === iconName
                      ? "border-blue-500 bg-blue-100 dark:bg-blue-800"
                      : "border-blue-300 dark:border-blue-600 hover:border-blue-400"
                  )}
                >
                  <IconComponent className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t('fields.icon.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Icon Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {ICON_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "primary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="text-xs"
          >
            {t(`iconCategories.${category.id}`)}
          </Button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        {filteredIcons.map((iconName) => {
          const IconComponent = getIconComponent(iconName);
          return (
            <motion.button
              key={iconName}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(iconName)}
              className={cn(
                "p-2 rounded-lg border transition-all",
                value === iconName
                  ? "border-blue-500 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-300 text-gray-600 dark:text-gray-400"
              )}
            >
              <IconComponent className="w-5 h-5" />
            </motion.button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

/**
 * 🏷️ Category Form Fields Component
 */
const CategoryFormFields = ({
  formData,
  validationErrors = {},
  onFieldChange,
  showAdvanced = true,
  mode = 'create',
  className = ''
}) => {
  const { t, isRTL } = useTranslation('categories');

  // ✅ Field change handler
  const handleFieldChange = useCallback((field, value) => {
    onFieldChange?.(field, value);
  }, [onFieldChange]);

  // ✅ Animation variants
  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={cn("space-y-6", className)} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Tag className="w-5 h-5" />
          <span>{t('sections.basicInfo')}</span>
        </h3>

        {/* Name */}
        <motion.div variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fields.name.label')} *
          </label>
          <Input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder={t('fields.name.placeholder')}
            error={getFieldError('name', validationErrors)}
            className="w-full"
          />
          {getFieldError('name', validationErrors) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {getFieldError('name', validationErrors)}
            </p>
          )}
        </motion.div>

        {/* Description */}
        <motion.div variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fields.description.label')}
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder={t('fields.description.placeholder')}
            rows={3}
            className={cn(
              "w-full px-3 py-2 border rounded-lg resize-none",
              "bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "border-gray-300 dark:border-gray-600",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            )}
          />
          {getFieldError('description', validationErrors) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {getFieldError('description', validationErrors)}
            </p>
          )}
        </motion.div>

        {/* Category Type */}
        <motion.div variants={fieldVariants}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('fields.type.label')} *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_TYPE_OPTIONS.map((option) => {
              const IconComponent = getIconComponent(option.icon);
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFieldChange('type', option.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-center",
                    formData.type === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                  )}
                >
                  <IconComponent className={cn(
                    "w-6 h-6 mx-auto mb-1",
                    formData.type === option.value
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  )} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {t(`types.${option.label}`)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t(`types.${option.label}Description`)}
                  </div>
                </motion.button>
              );
            })}
          </div>
          {getFieldError('type', validationErrors) && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {getFieldError('type', validationErrors)}
            </p>
          )}
        </motion.div>
      </div>

      {/* Visual Customization */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>{t('sections.visual')}</span>
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Icon Selector */}
          <motion.div variants={fieldVariants}>
            <IconSelector
              value={formData.icon}
              onChange={(icon) => handleFieldChange('icon', icon)}
              categoryName={formData.name}
              error={getFieldError('icon', validationErrors)}
            />
          </motion.div>

          {/* Color Picker */}
          <motion.div variants={fieldVariants}>
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleFieldChange('color', color)}
              error={getFieldError('color', validationErrors)}
            />
          </motion.div>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <motion.div variants={fieldVariants}>
          <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
              <Type className="w-5 h-5" />
              <span>{t('sections.advanced')}</span>
            </h3>

            <div className="space-y-4">
              {/* Pin Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Pin className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('fields.pinned.label')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('fields.pinned.description')}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={formData.isPinned || false}
                  onCheckedChange={(checked) => handleFieldChange('isPinned', checked)}
                />
              </div>

              {/* Hide Category */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <EyeOff className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('fields.hidden.label')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('fields.hidden.description')}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={formData.isHidden || false}
                  onCheckedChange={(checked) => handleFieldChange('isHidden', checked)}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Preview */}
      <motion.div variants={fieldVariants}>
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t('sections.preview')}
          </h3>
          
          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color }}
            >
              {React.createElement(
                getIconComponent(formData.icon),
                { className: "w-5 h-5 text-white" }
              )}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">
                {formData.name || t('preview.sampleName')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formData.description || t('preview.sampleDescription')}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {t(`types.${formData.type}`)}
              </Badge>
              {formData.isPinned && <Pin className="w-4 h-4 text-yellow-500" />}
              {formData.isHidden && <EyeOff className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CategoryFormFields; 