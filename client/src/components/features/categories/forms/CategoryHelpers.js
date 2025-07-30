/**
 * 🛠️ CATEGORY HELPERS - COMMON UTILITIES
 * Shared utilities for all category form components
 * Features: Data formatting, Default values, Color management, Icon utilities
 * @version 3.0.0 - NEW CLEAN ARCHITECTURE
 */

/**
 * 📊 Category Types Configuration
 */
export const CATEGORY_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income'
};

export const CATEGORY_TYPE_OPTIONS = [
  {
    value: CATEGORY_TYPES.EXPENSE,
    label: 'expense',
    color: 'red',
    icon: 'TrendingDown',
    description: 'For expenses and costs'
  },
  {
    value: CATEGORY_TYPES.INCOME,
    label: 'income', 
    color: 'green',
    icon: 'TrendingUp',
    description: 'For income and earnings'
  }
];

/**
 * 🎨 Color Palette Configuration
 */
export const COLOR_PALETTE = [
  { name: 'Blue', value: '#3B82F6', category: 'primary' },
  { name: 'Red', value: '#EF4444', category: 'primary' },
  { name: 'Green', value: '#10B981', category: 'primary' },
  { name: 'Yellow', value: '#F59E0B', category: 'primary' },
  { name: 'Purple', value: '#8B5CF6', category: 'primary' },
  { name: 'Pink', value: '#EC4899', category: 'primary' },
  { name: 'Cyan', value: '#06B6D4', category: 'secondary' },
  { name: 'Lime', value: '#84CC16', category: 'secondary' },
  { name: 'Orange', value: '#F97316', category: 'secondary' },
  { name: 'Indigo', value: '#6366F1', category: 'secondary' },
  { name: 'Teal', value: '#14B8A6', category: 'secondary' },
  { name: 'Rose', value: '#F43F5E', category: 'secondary' },
  { name: 'Slate', value: '#64748B', category: 'neutral' },
  { name: 'Gray', value: '#6B7280', category: 'neutral' },
  { name: 'Zinc', value: '#71717A', category: 'neutral' },
  { name: 'Stone', value: '#78716C', category: 'neutral' }
];

/**
 * 🎨 Icon Categories Configuration
 */
export const ICON_CATEGORIES = [
  {
    id: 'finance',
    label: 'Finance',
    icons: [
      'DollarSign', 'CreditCard', 'TrendingUp', 'TrendingDown', 
      'PieChart', 'BarChart3', 'Percent', 'Target'
    ]
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icons: [
      'Coffee', 'Utensils', 'Car', 'Home', 'Heart', 'Star',
      'ShoppingBag', 'Gift', 'Crown', 'Award'
    ]
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icons: [
      'Music', 'Film', 'Gamepad2', 'Book', 'Camera', 'Video',
      'Tv', 'Radio', 'Headphones', 'Disc'
    ]
  },
  {
    id: 'technology',
    label: 'Technology',
    icons: [
      'Smartphone', 'Globe', 'Zap', 'Settings', 'Activity', 'Wifi',
      'Monitor', 'Laptop', 'Mouse', 'Keyboard'
    ]
  },
  {
    id: 'transport',
    label: 'Transport',
    icons: [
      'Car', 'Plane', 'Train', 'Bus', 'Bike', 'Truck',
      'Ship', 'Fuel', 'Navigation', 'MapPin'
    ]
  },
  {
    id: 'health',
    label: 'Health',
    icons: [
      'Heart', 'Activity', 'Dumbbell', 'Pill', 'Stethoscope', 'Cross',
      'Shield', 'Brain', 'Eye', 'Thermometer'
    ]
  },
  {
    id: 'general',
    label: 'General',
    icons: [
      'Tag', 'Bookmark', 'Flag', 'Pin', 'Hash', 'Circle',
      'Square', 'Triangle', 'Hexagon', 'Star'
    ]
  }
];

/**
 * 📝 Get Default Category Data
 */
export const getDefaultCategoryData = (initialData = null, mode = 'create') => {
  const defaults = {
    name: '',
    description: '',
    icon: 'Tag',
    color: '#3B82F6',
    type: CATEGORY_TYPES.EXPENSE,
    isPinned: false,
    isHidden: false,
    sortOrder: 0
  };

  // If no initial data, return defaults
  if (!initialData) {
    return defaults;
  }

  // Handle different modes
  const baseData = {
    ...defaults,
    name: initialData.name || '',
    description: initialData.description || '',
    icon: initialData.icon || 'Tag',
    color: initialData.color || '#3B82F6',
    type: initialData.type || CATEGORY_TYPES.EXPENSE,
    isPinned: initialData.isPinned !== undefined ? initialData.isPinned : false,
    isHidden: initialData.isHidden !== undefined ? initialData.isHidden : false,
    sortOrder: initialData.sortOrder || 0
  };

  // For duplicate mode, modify the name
  if (mode === 'duplicate') {
    baseData.name = `Copy of ${baseData.name}`;
  }

  return baseData;
};

/**
 * 📊 Format Category for API
 */
export const formatCategoryForAPI = (formData, mode = 'create') => {
  const apiData = {
    name: formData.name.trim(),
    description: formData.description ? formData.description.trim() : null,
    icon: formData.icon,
    color: formData.color,
    type: formData.type,
    is_pinned: formData.isPinned,
    is_hidden: formData.isHidden,
    sort_order: formData.sortOrder
  };

  // Remove null/undefined values
  Object.keys(apiData).forEach(key => {
    if (apiData[key] === null || apiData[key] === undefined) {
      delete apiData[key];
    }
  });

  return apiData;
};

/**
 * 🎨 Get Category Type Info
 */
export const getCategoryTypeInfo = (type) => {
  return CATEGORY_TYPE_OPTIONS.find(option => option.value === type) || CATEGORY_TYPE_OPTIONS[0];
};

/**
 * 🎨 Get Color Palette by Category
 */
export const getColorsByCategory = (category = 'all') => {
  if (category === 'all') return COLOR_PALETTE;
  return COLOR_PALETTE.filter(color => color.category === category);
};

/**
 * 🎨 Get Random Color
 */
export const getRandomColor = () => {
  const primaryColors = getColorsByCategory('primary');
  return primaryColors[Math.floor(Math.random() * primaryColors.length)].value;
};

/**
 * 🎯 Get Icon Suggestions Based on Name
 */
export const getIconSuggestions = (categoryName) => {
  if (!categoryName) return ['Tag', 'Circle', 'Star'];
  
  const suggestions = {
    'food': ['Utensils', 'Coffee', 'ShoppingBag'],
    'drink': ['Coffee', 'Wine', 'Utensils'],
    'restaurant': ['Utensils', 'Coffee', 'Star'],
    'transport': ['Car', 'Plane', 'Bus'],
    'car': ['Car', 'Fuel', 'Tool'],
    'gas': ['Fuel', 'Car', 'DollarSign'],
    'entertainment': ['Music', 'Film', 'Gamepad2'],
    'movie': ['Film', 'Tv', 'Camera'],
    'music': ['Music', 'Headphones', 'Radio'],
    'health': ['Heart', 'Activity', 'Cross'],
    'doctor': ['Stethoscope', 'Cross', 'Heart'],
    'gym': ['Dumbbell', 'Activity', 'Heart'],
    'shopping': ['ShoppingBag', 'Tag', 'Star'],
    'clothes': ['ShoppingBag', 'Tag', 'Heart'],
    'home': ['Home', 'Settings', 'Tool'],
    'rent': ['Home', 'Key', 'DollarSign'],
    'work': ['Briefcase', 'Target', 'Award'],
    'salary': ['DollarSign', 'TrendingUp', 'Award'],
    'business': ['Briefcase', 'TrendingUp', 'Target'],
    'education': ['Book', 'GraduationCap', 'Brain'],
    'technology': ['Smartphone', 'Laptop', 'Globe'],
    'phone': ['Smartphone', 'Phone', 'Signal'],
    'internet': ['Globe', 'Wifi', 'Monitor']
  };

  const name = categoryName.toLowerCase();
  
  // Find exact matches first
  for (const [key, icons] of Object.entries(suggestions)) {
    if (name.includes(key)) {
      return icons;
    }
  }
  
  // Fallback suggestions
  return ['Tag', 'Circle', 'Star'];
};

/**
 * 🔍 Filter Categories by Search
 */
export const filterCategoriesByText = (categories, searchText) => {
  if (!categories || !Array.isArray(categories)) return [];
  if (!searchText || searchText.trim() === '') return categories;
  
  const search = searchText.toLowerCase().trim();
  
  return categories.filter(category => 
    category.name?.toLowerCase().includes(search) ||
    category.description?.toLowerCase().includes(search)
  );
};

/**
 * 📊 Sort Categories
 */
export const sortCategories = (categories, sortBy = 'name', sortOrder = 'asc') => {
  if (!categories || !Array.isArray(categories)) return [];
  const sorted = [...categories];
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'type':
        aValue = a.type || '';
        bValue = b.type || '';
        break;
      case 'usage':
        aValue = a.transactionCount || 0;
        bValue = b.transactionCount || 0;
        break;
      case 'created':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      case 'updated':
        aValue = new Date(a.updatedAt || a.createdAt || 0);
        bValue = new Date(b.updatedAt || b.createdAt || 0);
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
};

/**
 * 🎨 Generate Category Summary
 */
export const generateCategorySummary = (category, analytics = null) => {
  const summary = {
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    transactionCount: analytics?.transactionCount || 0,
    totalAmount: analytics?.totalAmount || 0,
    averageAmount: analytics?.averageAmount || 0,
    trend: analytics?.trend || 0,
    lastUsed: analytics?.lastUsed || null
  };

  return summary;
}; 