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
  Search, Grid, List,
  // Icons for preview
  Circle, Heart, DollarSign, ShoppingBag, Car, Home, Coffee,
  Briefcase, Receipt, CreditCard, Plane, Music, Book, Pill, Utensils,
  Building, Film, Code, Gamepad2, User, MoreHorizontal, Zap
} from 'lucide-react';

// Simple icon mapping for category types
const typeIcons = {
  'TrendingUp': TrendingUp,
  'TrendingDown': TrendingDown
};

// Simple icon mapping for preview (same as SimpleIconSelector)
const previewIcons = {
  'Tag': Tag, 'Circle': Circle, 'Heart': Heart, 'DollarSign': DollarSign,
  'ShoppingBag': ShoppingBag, 'Car': Car, 'Home': Home, 'Coffee': Coffee,
  'Briefcase': Briefcase, 'Receipt': Receipt, 'CreditCard': CreditCard,
  'Plane': Plane, 'Music': Music, 'Book': Book, 'Pill': Pill, 'Utensils': Utensils,
  'TrendingUp': TrendingUp, 'Building': Building, 'Film': Film, 'Code': Code,
  'Gamepad2': Gamepad2, 'User': User, 'MoreHorizontal': MoreHorizontal, 'Zap': Zap
};

// ✅ Import Zustand stores
import { useTranslation } from '../../../../stores';

import { Card, Switch, Badge, Input, Button } from '../../../ui';
import { getFieldError } from './CategoryValidation';
import { 
  CATEGORY_TYPES, 
  CATEGORY_TYPE_OPTIONS,
  COLOR_PALETTE
} from './CategoryHelpers';
import SimpleIconSelector from './SimpleIconSelector';
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
      <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        {colorCategories[selectedCategory].map((color) => (
          <motion.button
            key={color.value}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(color.value)}
            className={cn(
              "relative w-12 h-12 sm:w-10 sm:h-10 rounded-xl border-3 transition-all duration-200 shadow-sm hover:shadow-md",
              value === color.value 
                ? "border-white scale-110 shadow-lg ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800" 
                : "border-gray-200 dark:border-gray-600 hover:border-white dark:hover:border-gray-400"
            )}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            {value === color.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-3 h-3 bg-white rounded-full shadow-lg ring-1 ring-gray-300" />
              </motion.div>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-xl bg-white dark:bg-gray-900 opacity-0 hover:opacity-20 transition-opacity duration-200"></div>
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

// Old IconSelector completely removed - using SimpleIconSelector now

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CATEGORY_TYPE_OPTIONS.map((option) => {
              const IconComponent = typeIcons[option.icon] || TrendingUp;
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFieldChange('type', option.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center min-h-[80px] flex flex-col items-center justify-center",
                    formData.type === option.value
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 shadow-lg transform scale-105"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:shadow-md"
                  )}
                >
                  <IconComponent className={cn(
                    "w-7 h-7 mb-2",
                    formData.type === option.value
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  )} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {t(`types.${option.label}`)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Icon Selector */}
          <motion.div variants={fieldVariants} className="lg:col-span-1">
            <SimpleIconSelector
              value={formData.icon}
              onChange={(icon) => handleFieldChange('icon', icon)}
              error={getFieldError('icon', validationErrors)}
            />
          </motion.div>

          {/* Color Picker */}
          <motion.div variants={fieldVariants} className="lg:col-span-1">
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
                previewIcons[formData.icon] || Tag,
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