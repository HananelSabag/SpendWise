/**
 * 📋 INITIAL TEMPLATES STEP - MOBILE-FIRST
 * Enhanced template selection for onboarding
 * NOW WITH ZUSTAND STORES! 🎉
 * @version 2.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Check, Star, TrendingUp, TrendingDown, Home,
  Car, Utensils, Heart, Briefcase, GraduationCap,
  ShoppingBag, Plane, Gift, Coffee, Smartphone,
  ChevronRight, Sparkles, Target, Filter
} from 'lucide-react';

// ✅ NEW: Import from Zustand stores instead of Context
import {
  useTranslation,
  useCurrency,
  useTheme,
  useNotifications,
  useAuth
} from '../../../../stores';

import { Button, Card, Badge, Input } from '../../../ui';
import { cn } from '../../../../utils/helpers';

const InitialTemplatesStep = ({
  onNext,
  onPrevious,
  onComplete,
  className = ''
}) => {
  // ✅ NEW: Use Zustand stores
  const { t, isRTL } = useTranslation('onboarding');
  const { formatCurrency } = useCurrency();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTemplate, setCustomTemplate] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'other',
    frequency: 'monthly'
  });

  // Template categories
  const categories = [
    { id: 'popular', label: t('templates.categories.popular'), icon: Star },
    { id: 'income', label: t('templates.categories.income'), icon: TrendingUp },
    { id: 'essential', label: t('templates.categories.essential'), icon: Home },
    { id: 'lifestyle', label: t('templates.categories.lifestyle'), icon: Heart },
    { id: 'custom', label: t('templates.categories.custom'), icon: Plus }
  ];

  // Predefined templates
  const templateLibrary = {
    popular: [
      {
        id: 'salary',
        description: t('templates.popular.salary'),
        amount: 4000,
        type: 'income',
        frequency: 'monthly',
        icon: Briefcase,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        category: 'salary'
      },
      {
        id: 'rent',
        description: t('templates.popular.rent'),
        amount: 1200,
        type: 'expense',
        frequency: 'monthly',
        icon: Home,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        category: 'housing'
      },
      {
        id: 'groceries',
        description: t('templates.popular.groceries'),
        amount: 300,
        type: 'expense',
        frequency: 'monthly',
        icon: ShoppingBag,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        category: 'food'
      },
      {
        id: 'netflix',
        description: t('templates.popular.streaming'),
        amount: 15,
        type: 'expense',
        frequency: 'monthly',
        icon: Smartphone,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        category: 'entertainment'
      }
    ],
    income: [
      {
        id: 'salary2',
        description: t('templates.income.primarySalary'),
        amount: 5000,
        type: 'income',
        frequency: 'monthly',
        icon: Briefcase,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        category: 'salary'
      },
      {
        id: 'freelance',
        description: t('templates.income.freelance'),
        amount: 1500,
        type: 'income',
        frequency: 'monthly',
        icon: GraduationCap,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        category: 'freelance'
      },
      {
        id: 'investment',
        description: t('templates.income.investments'),
        amount: 200,
        type: 'income',
        frequency: 'monthly',
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        category: 'investment'
      }
    ],
    essential: [
      {
        id: 'utilities',
        description: t('templates.essential.utilities'),
        amount: 150,
        type: 'expense',
        frequency: 'monthly',
        icon: Home,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        category: 'utilities'
      },
      {
        id: 'phone',
        description: t('templates.essential.phone'),
        amount: 50,
        type: 'expense',
        frequency: 'monthly',
        icon: Smartphone,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
        category: 'utilities'
      },
      {
        id: 'insurance',
        description: t('templates.essential.insurance'),
        amount: 100,
        type: 'expense',
        frequency: 'monthly',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20',
        category: 'healthcare'
      }
    ],
    lifestyle: [
      {
        id: 'gym',
        description: t('templates.lifestyle.gym'),
        amount: 30,
        type: 'expense',
        frequency: 'monthly',
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        category: 'health'
      },
      {
        id: 'coffee',
        description: t('templates.lifestyle.coffee'),
        amount: 80,
        type: 'expense',
        frequency: 'monthly',
        icon: Coffee,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20',
        category: 'food'
      },
      {
        id: 'travel',
        description: t('templates.lifestyle.travel'),
        amount: 200,
        type: 'expense',
        frequency: 'monthly',
        icon: Plane,
        color: 'text-sky-600',
        bgColor: 'bg-sky-100 dark:bg-sky-900/20',
        category: 'travel'
      }
    ]
  };

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (currentCategory === 'custom') return [];
    
    const templates = templateLibrary[currentCategory] || [];
    if (!searchTerm) return templates;
    
    return templates.filter(template =>
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentCategory, searchTerm]);

  // Handle template selection
  const toggleTemplate = useCallback((template) => {
    setSelectedTemplates(prev => {
      const isSelected = prev.some(t => t.id === template.id);
      if (isSelected) {
        return prev.filter(t => t.id !== template.id);
      } else {
        return [...prev, template];
      }
    });
  }, []);

  // Handle custom template creation
  const handleCreateCustom = useCallback(() => {
    if (!customTemplate.description || !customTemplate.amount) {
      addNotification({
        type: 'error',
        title: t('templates.validation.required'),
        duration: 3000
      });
      return;
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      ...customTemplate,
      amount: parseFloat(customTemplate.amount),
      icon: customTemplate.type === 'income' ? TrendingUp : TrendingDown,
      color: customTemplate.type === 'income' ? 'text-green-600' : 'text-red-600',
      bgColor: customTemplate.type === 'income' 
        ? 'bg-green-100 dark:bg-green-900/20' 
        : 'bg-red-100 dark:bg-red-900/20',
      isCustom: true
    };

    setSelectedTemplates(prev => [...prev, newTemplate]);
    setCustomTemplate({
      description: '',
      amount: '',
      type: 'expense',
      category: 'other',
      frequency: 'monthly'
    });
    setIsCreatingCustom(false);

    addNotification({
      type: 'success',
      title: t('templates.customCreated'),
      duration: 3000
    });
  }, [customTemplate, addNotification, t]);

  // Handle completion
  const handleComplete = useCallback(async () => {
    try {
      if (onComplete) {
        await onComplete(selectedTemplates);
      }

      addNotification({
        type: 'success',
        title: t('templates.setupComplete'),
        description: t('templates.templatesAdded', { count: selectedTemplates.length }),
        duration: 4000
      });

      onNext?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('templates.setupFailed'),
        description: error.message,
        duration: 5000
      });
    }
  }, [selectedTemplates, onComplete, addNotification, t, onNext]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05
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
      className={cn("space-y-6", className)}
      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
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

      {/* Category tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {categories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <Button
                key={category.id}
                variant={currentCategory === category.id ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentCategory(category.id);
                  setSearchTerm('');
                  setIsCreatingCustom(false);
                }}
                className="flex items-center"
              >
                <CategoryIcon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Search (for non-custom categories) */}
        {currentCategory !== 'custom' && (
          <Input
            placeholder={t('templates.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md mx-auto"
          />
        )}
      </motion.div>

      {/* Template grid */}
      <motion.div variants={itemVariants}>
        {currentCategory === 'custom' ? (
          /* Custom template creation */
          <Card className="p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              {t('templates.createCustom')}
            </h3>

            <div className="space-y-4">
              {/* Type selection */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={customTemplate.type === 'income' ? 'primary' : 'outline'}
                  onClick={() => setCustomTemplate(prev => ({ ...prev, type: 'income' }))}
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <TrendingUp className="w-5 h-5 mb-1" />
                  {t('templates.income')}
                </Button>
                <Button
                  variant={customTemplate.type === 'expense' ? 'primary' : 'outline'}
                  onClick={() => setCustomTemplate(prev => ({ ...prev, type: 'expense' }))}
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <TrendingDown className="w-5 h-5 mb-1" />
                  {t('templates.expense')}
                </Button>
              </div>

              {/* Description */}
              <Input
                placeholder={t('templates.customDescriptionPlaceholder')}
                value={customTemplate.description}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
              />

              {/* Amount */}
              <Input
                type="number"
                placeholder="0.00"
                value={customTemplate.amount}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, amount: e.target.value }))}
              />

              {/* Frequency */}
              <select
                value={customTemplate.frequency}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="monthly">{t('templates.frequency.monthly')}</option>
                <option value="weekly">{t('templates.frequency.weekly')}</option>
                <option value="yearly">{t('templates.frequency.yearly')}</option>
              </select>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingCustom(false)}
                  className="flex-1"
                >
                  {t('actions.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateCustom}
                  className="flex-1"
                >
                  {t('templates.create')}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Template selection grid */
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplates.some(t => t.id === template.id);
              const TemplateIcon = template.icon;

              return (
                <motion.div
                  key={template.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all border-2",
                      isSelected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                    onClick={() => toggleTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        template.bgColor
                      )}>
                        <TemplateIcon className={cn("w-5 h-5", template.color)} />
                      </div>
                      
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected
                          ? "border-primary-500 bg-primary-500"
                          : "border-gray-300 dark:border-gray-600"
                      )}>
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                      {template.description}
                    </h3>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={template.type === 'income' ? 'success' : 'destructive'}
                        size="sm"
                      >
                        {template.type === 'income' ? '+' : '-'}
                        {formatCurrency(template.amount)}
                      </Badge>
                      
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t(`templates.frequency.${template.frequency}`)}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredTemplates.length === 0 && currentCategory !== 'custom' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? t('templates.noResults') : t('templates.noTemplates')}
            </p>
          </div>
        )}
      </motion.div>

      {/* Selected templates preview */}
      {selectedTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="max-w-md mx-auto"
        >
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-center">
              {t('templates.selectedTemplates')}
            </h4>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="font-medium">{template.description}</span>
                  <Badge 
                    variant={template.type === 'income' ? 'success' : 'destructive'}
                    size="xs"
                  >
                    {template.type === 'income' ? '+' : '-'}
                    {formatCurrency(template.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-center pt-6"
      >
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          {t('navigation.previous')}
        </Button>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => onNext?.()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('navigation.skipForNow')}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleComplete}
            disabled={selectedTemplates.length === 0}
            className="min-w-[120px]"
          >
            <Target className="w-4 h-4 mr-2" />
            {selectedTemplates.length > 0 
              ? t('templates.setupTemplates', { count: selectedTemplates.length })
              : t('navigation.continue')
            }
            <ChevronRight className={cn("w-4 h-4", isRTL ? "mr-2" : "ml-2")} />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InitialTemplatesStep; 