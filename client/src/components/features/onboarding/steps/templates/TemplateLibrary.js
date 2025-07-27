/**
 * 📚 TEMPLATE LIBRARY - Predefined Templates Configuration
 * Extracted from massive InitialTemplatesStep.jsx for better organization
 * Features: Categorized templates, Localization support, Icon mappings
 * @version 3.0.0 - ONBOARDING REDESIGN
 */

import {
  Star, TrendingUp, TrendingDown, Home, Car, Utensils, 
  Heart, Briefcase, GraduationCap, ShoppingBag, Plane, 
  Gift, Coffee, Smartphone, Zap, Shield
} from 'lucide-react';

/**
 * 📚 Template Categories Configuration
 */
export const TEMPLATE_CATEGORIES = [
  { 
    id: 'popular', 
    labelKey: 'templates.categories.popular', 
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
  },
  { 
    id: 'income', 
    labelKey: 'templates.categories.income', 
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  { 
    id: 'essential', 
    labelKey: 'templates.categories.essential', 
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  { 
    id: 'lifestyle', 
    labelKey: 'templates.categories.lifestyle', 
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20'
  },
  { 
    id: 'custom', 
    labelKey: 'templates.categories.custom', 
    icon: ShoppingBag,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  }
];

/**
 * 📋 Predefined Template Library
 */
export const TEMPLATE_LIBRARY = {
  popular: [
    {
      id: 'salary',
      descriptionKey: 'templates.popular.salary',
      amount: 4000,
      type: 'income',
      frequency: 'monthly',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      category: 'salary',
      tags: ['work', 'primary-income'],
      priority: 1
    },
    {
      id: 'rent',
      descriptionKey: 'templates.popular.rent',
      amount: 1200,
      type: 'expense',
      frequency: 'monthly',
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      category: 'housing',
      tags: ['housing', 'essential'],
      priority: 2
    },
    {
      id: 'groceries',
      descriptionKey: 'templates.popular.groceries',
      amount: 300,
      type: 'expense',
      frequency: 'monthly',
      icon: ShoppingBag,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      category: 'food',
      tags: ['food', 'essential'],
      priority: 3
    },
    {
      id: 'netflix',
      descriptionKey: 'templates.popular.streaming',
      amount: 15,
      type: 'expense',
      frequency: 'monthly',
      icon: Smartphone,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      category: 'entertainment',
      tags: ['entertainment', 'subscription'],
      priority: 4
    },
    {
      id: 'car_payment',
      descriptionKey: 'templates.popular.carPayment',
      amount: 450,
      type: 'expense',
      frequency: 'monthly',
      icon: Car,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      category: 'transportation',
      tags: ['transportation', 'loan'],
      priority: 5
    }
  ],

  income: [
    {
      id: 'primary_salary',
      descriptionKey: 'templates.income.primarySalary',
      amount: 5000,
      type: 'income',
      frequency: 'monthly',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      category: 'salary',
      tags: ['work', 'primary-income'],
      priority: 1
    },
    {
      id: 'freelance',
      descriptionKey: 'templates.income.freelance',
      amount: 1500,
      type: 'income',
      frequency: 'monthly',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      category: 'freelance',
      tags: ['freelance', 'side-income'],
      priority: 2
    },
    {
      id: 'investment',
      descriptionKey: 'templates.income.investments',
      amount: 200,
      type: 'income',
      frequency: 'monthly',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      category: 'investment',
      tags: ['investment', 'passive-income'],
      priority: 3
    },
    {
      id: 'bonus',
      descriptionKey: 'templates.income.bonus',
      amount: 1000,
      type: 'income',
      frequency: 'quarterly',
      icon: Gift,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      category: 'bonus',
      tags: ['work', 'bonus'],
      priority: 4
    }
  ],

  essential: [
    {
      id: 'utilities',
      descriptionKey: 'templates.essential.utilities',
      amount: 150,
      type: 'expense',
      frequency: 'monthly',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      category: 'utilities',
      tags: ['utilities', 'essential'],
      priority: 1
    },
    {
      id: 'phone',
      descriptionKey: 'templates.essential.phone',
      amount: 80,
      type: 'expense',
      frequency: 'monthly',
      icon: Smartphone,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100 dark:bg-slate-900/20',
      category: 'communication',
      tags: ['phone', 'essential'],
      priority: 2
    },
    {
      id: 'insurance',
      descriptionKey: 'templates.essential.insurance',
      amount: 200,
      type: 'expense',
      frequency: 'monthly',
      icon: Shield,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      category: 'insurance',
      tags: ['insurance', 'essential'],
      priority: 3
    },
    {
      id: 'internet',
      descriptionKey: 'templates.essential.internet',
      amount: 60,
      type: 'expense',
      frequency: 'monthly',
      icon: Zap,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      category: 'utilities',
      tags: ['internet', 'essential'],
      priority: 4
    }
  ],

  lifestyle: [
    {
      id: 'gym',
      descriptionKey: 'templates.lifestyle.gym',
      amount: 30,
      type: 'expense',
      frequency: 'monthly',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      category: 'health',
      tags: ['health', 'fitness'],
      priority: 1
    },
    {
      id: 'coffee',
      descriptionKey: 'templates.lifestyle.coffee',
      amount: 80,
      type: 'expense',
      frequency: 'monthly',
      icon: Coffee,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      category: 'food',
      tags: ['food', 'daily'],
      priority: 2
    },
    {
      id: 'travel',
      descriptionKey: 'templates.lifestyle.travel',
      amount: 200,
      type: 'expense',
      frequency: 'monthly',
      icon: Plane,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100 dark:bg-sky-900/20',
      category: 'travel',
      tags: ['travel', 'savings'],
      priority: 3
    },
    {
      id: 'dining_out',
      descriptionKey: 'templates.lifestyle.diningOut',
      amount: 150,
      type: 'expense',
      frequency: 'monthly',
      icon: Utensils,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      category: 'food',
      tags: ['food', 'entertainment'],
      priority: 4
    }
  ]
};

/**
 * 🔍 Template Search and Filter Utilities
 */
export const filterTemplates = (templates, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') return templates;
  
  const search = searchTerm.toLowerCase().trim();
  
  return templates.filter(template => {
    // Search in description key (you'd need to resolve this with translations)
    const descMatch = template.descriptionKey.toLowerCase().includes(search);
    
    // Search in tags
    const tagsMatch = template.tags?.some(tag => 
      tag.toLowerCase().includes(search)
    );
    
    // Search in category
    const categoryMatch = template.category?.toLowerCase().includes(search);
    
    return descMatch || tagsMatch || categoryMatch;
  });
};

/**
 * 📊 Get Templates by Category
 */
export const getTemplatesByCategory = (categoryId) => {
  return TEMPLATE_LIBRARY[categoryId] || [];
};

/**
 * 🎯 Get Popular Templates (sorted by priority)
 */
export const getPopularTemplates = (limit = 4) => {
  return TEMPLATE_LIBRARY.popular
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
};

/**
 * 🏷️ Get All Template Categories
 */
export const getAllCategories = () => {
  return TEMPLATE_CATEGORIES;
};

/**
 * 🔍 Search Templates Across All Categories
 */
export const searchAllTemplates = (searchTerm) => {
  const allTemplates = Object.values(TEMPLATE_LIBRARY).flat();
  return filterTemplates(allTemplates, searchTerm);
};

/**
 * 📈 Get Template Statistics
 */
export const getTemplateStats = () => {
  const allTemplates = Object.values(TEMPLATE_LIBRARY).flat();
  
  return {
    total: allTemplates.length,
    byType: {
      income: allTemplates.filter(t => t.type === 'income').length,
      expense: allTemplates.filter(t => t.type === 'expense').length
    },
    byFrequency: {
      monthly: allTemplates.filter(t => t.frequency === 'monthly').length,
      quarterly: allTemplates.filter(t => t.frequency === 'quarterly').length,
      yearly: allTemplates.filter(t => t.frequency === 'yearly').length
    },
    categories: Object.keys(TEMPLATE_LIBRARY).length
  };
};

/**
 * 💡 Get Template Suggestions Based on User Data
 */
export const getTemplateSuggestions = (userProfile = {}) => {
  // This could be enhanced with ML/AI suggestions based on user profile
  // For now, return popular templates
  return getPopularTemplates(6);
}; 