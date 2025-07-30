/**
 * Centralized Category Icons Configuration
 * Single source of truth for all category icons across the application
 */

import {
  Tag, Star, Sparkles, Crown, Gift, Heart, Shield,
  ShoppingCart, ShoppingBag, Palette, Camera, Smartphone, Laptop,
  Home, Zap, Car, Fuel, Phone, MapPin, Bus,
  Utensils, UtensilsCrossed, Coffee, Pizza, Wine,
  Plane, Briefcase, Book, GraduationCap,
  Dumbbell, Pill, Baby, PawPrint,
  DollarSign, CreditCard, Banknote, PiggyBank, TrendingUp, TrendingDown,
  Music, Gamepad2, Tv, Film,
  Wallet, Award, Building, FileText, MoreHorizontal, Circle, User,
  Receipt, Code,
  // Additional icons needed for CategoryFormFields
  PieChart, BarChart3, Percent, Target, Video, Radio, Headphones, Disc,
  Globe, Settings, Activity, Wifi, Monitor, Mouse, Keyboard,
  Train, Bike, Truck, Ship, Navigation, Stethoscope, Cross,
  Brain, Eye, Thermometer, Bookmark, Flag, Hash, Square, Triangle, Hexagon,
  // Missing critical icons
  ArrowUpDown, Pin, PinOff
} from 'lucide-react';

/**
 * Icon definitions organized by category for easy management
 */
export const iconCategories = {
  general: [
    { name: 'tag', icon: Tag, label: 'General' },
    { name: 'star', icon: Star, label: 'Favorite' },
    { name: 'sparkles', icon: Sparkles, label: 'Special' },
    { name: 'crown', icon: Crown, label: 'Premium' },
    { name: 'gift', icon: Gift, label: 'Gifts' },
    { name: 'heart', icon: Heart, label: 'Love' },
    { name: 'shield', icon: Shield, label: 'Protection' },
    { name: 'circle', icon: Circle, label: 'Default' }
  ],
  shopping: [
    { name: 'shopping-cart', icon: ShoppingCart, label: 'Shopping' },
    { name: 'shopping-bag', icon: ShoppingBag, label: 'Shopping Bag' },
    { name: 'palette', icon: Palette, label: 'Fashion' },
    { name: 'camera', icon: Camera, label: 'Electronics' },
    { name: 'smartphone', icon: Smartphone, label: 'Phone' },
    { name: 'laptop', icon: Laptop, label: 'Computer' }
  ],
  home: [
    { name: 'home', icon: Home, label: 'Home' },
    { name: 'zap', icon: Zap, label: 'Utilities' },
    { name: 'phone', icon: Phone, label: 'Bills' },
    { name: 'map-pin', icon: MapPin, label: 'Location' }
  ],
  transport: [
    { name: 'car', icon: Car, label: 'Car' },
    { name: 'bus', icon: Bus, label: 'Public Transport' },
    { name: 'plane', icon: Plane, label: 'Travel' },
    { name: 'fuel', icon: Fuel, label: 'Gas' }
  ],
  food: [
    { name: 'utensils', icon: Utensils, label: 'Restaurant' },
    { name: 'coffee', icon: Coffee, label: 'Coffee' },
    { name: 'pizza', icon: Pizza, label: 'Fast Food' },
    { name: 'wine', icon: Wine, label: 'Drinks' }
  ],
  work: [
    { name: 'briefcase', icon: Briefcase, label: 'Work' },
    { name: 'user', icon: User, label: 'Freelance' },
    { name: 'book', icon: Book, label: 'Education' },
    { name: 'graduation-cap', icon: GraduationCap, label: 'Learning' },
    { name: 'building', icon: Building, label: 'Business' },
    { name: 'file-text', icon: FileText, label: 'Documents' }
  ],
  health: [
    { name: 'heart', icon: Heart, label: 'Health' },
    { name: 'dumbbell', icon: Dumbbell, label: 'Fitness' },
    { name: 'pill', icon: Pill, label: 'Medicine' },
    { name: 'baby', icon: Baby, label: 'Baby' },
    { name: 'paw-print', icon: PawPrint, label: 'Pets' }
  ],
  money: [
    { name: 'dollar-sign', icon: DollarSign, label: 'Money' },
    { name: 'wallet', icon: Wallet, label: 'Wallet' },
    { name: 'credit-card', icon: CreditCard, label: 'Credit Card' },
    { name: 'banknote', icon: Banknote, label: 'Cash' },
    { name: 'piggy-bank', icon: PiggyBank, label: 'Savings' },
    { name: 'trending-up', icon: TrendingUp, label: 'Investment' },
    { name: 'trending-down', icon: TrendingDown, label: 'Expense' },
    { name: 'award', icon: Award, label: 'Bonus' }
  ],
  entertainment: [
    { name: 'music', icon: Music, label: 'Music' },
    { name: 'gamepad2', icon: Gamepad2, label: 'Gaming' },
    { name: 'tv', icon: Tv, label: 'TV' },
    { name: 'film', icon: Film, label: 'Movies' }
  ]
};

/**
 * Flattened icon mapping for quick lookups
 */
export const iconMap = Object.values(iconCategories)
  .flat()
  .reduce((acc, iconDef) => {
    acc[iconDef.name] = iconDef.icon;
    return acc;
  }, {});

/**
 * Additional icon mappings for database icon names (PascalCase from DB)
 */
export const dbIconMap = {
  // Common database icon names (exact matches from DB)
  'Briefcase': Briefcase,
  'Receipt': Receipt, 
  'UtensilsCrossed': UtensilsCrossed,
  'Car': Car,
  'Code': Code,
  'Gamepad2': Gamepad2,
  'TrendingUp': TrendingUp,
  'ShoppingBag': ShoppingBag,
  'Heart': Heart,
  'MoreHorizontal': MoreHorizontal,
  'DollarSign': DollarSign,
  'Tag': Tag,
  'Circle': Circle,
  'User': User,
  'Film': Film,
  'Zap': Zap,
  'ShoppingCart': ShoppingCart,
  'Building': Building,
  'CreditCard': CreditCard,
  'Home': Home,
  'Plane': Plane,
  'Fuel': Fuel,
  'Music': Music,
  'Tv': Tv,
  'Book': Book,
  'GraduationCap': GraduationCap,
  'Dumbbell': Dumbbell,
  'Pill': Pill,
  'Baby': Baby,
  'PawPrint': PawPrint,
  'Smartphone': Smartphone,
  'Laptop': Laptop,
  'Coffee': Coffee,
  'Pizza': Pizza,
  'Wine': Wine,
  'Utensils': Utensils,
  'Banknote': Banknote,
  'PiggyBank': PiggyBank,
  'TrendingDown': TrendingDown,
  'Award': Award,
  'FileText': FileText,
  'Bus': Bus,
  'MapPin': MapPin,
  'Phone': Phone,
  'Palette': Palette,
  'Camera': Camera,
  'Star': Star,
  'Gift': Gift,
  'Shield': Shield,
  'Crown': Crown,
  'Sparkles': Sparkles,
  'Wallet': Wallet,
  
  // Additional icons for CategoryFormFields
  'PieChart': PieChart,
  'BarChart3': BarChart3,
  'Percent': Percent,
  'Target': Target,
  'Video': Video,
  'Radio': Radio,
  'Headphones': Headphones,
  'Disc': Disc,
  'Globe': Globe,
  'Settings': Settings,
  'Activity': Activity,
  'Wifi': Wifi,
  'Monitor': Monitor,
  'Mouse': Mouse,
  'Keyboard': Keyboard,
  'Train': Train,
  'Bike': Bike,
  'Truck': Truck,
  'Ship': Ship,
  'Navigation': Navigation,
  'Stethoscope': Stethoscope,
  'Cross': Cross,
  'Brain': Brain,
  'Eye': Eye,
  'Thermometer': Thermometer,
  'Bookmark': Bookmark,
  'Flag': Flag,
  'Hash': Hash,
  'Square': Square,
  'Triangle': Triangle,
  'Hexagon': Hexagon,
  'ArrowUpDown': ArrowUpDown,
  'Pin': Pin,
  'PinOff': PinOff,
  
  // Lowercase versions
  'briefcase': Briefcase,
  'receipt': Receipt,
  'utensilscrossed': UtensilsCrossed,
  'car': Car,
  'code': Code,
  'gamepad2': Gamepad2,
  'trending-up': TrendingUp,
  'trendingup': TrendingUp,
  'shopping-bag': ShoppingBag,
  'shoppingbag': ShoppingBag,
  'heart': Heart,
  'more-horizontal': MoreHorizontal,
  'morehorizontal': MoreHorizontal,
  'dollar-sign': DollarSign,
  'dollarsign': DollarSign,
  'tag': Tag,
  'circle': Circle,
  'user': User,
  'film': Film,
  
  // Lowercase versions of new icons
  'piechart': PieChart,
  'pie-chart': PieChart,
  'barchart3': BarChart3,
  'bar-chart-3': BarChart3,
  'percent': Percent,
  'target': Target,
  'video': Video,
  'radio': Radio,
  'headphones': Headphones,
  'disc': Disc,
  'globe': Globe,
  'settings': Settings,
  'activity': Activity,
  'wifi': Wifi,
  'monitor': Monitor,
  'mouse': Mouse,
  'keyboard': Keyboard,
  'train': Train,
  'bike': Bike,
  'truck': Truck,
  'ship': Ship,
  'navigation': Navigation,
  'stethoscope': Stethoscope,
  'cross': Cross,
  'brain': Brain,
  'eye': Eye,
  'thermometer': Thermometer,
  'bookmark': Bookmark,
  'flag': Flag,
  'hash': Hash,
  'square': Square,
  'triangle': Triangle,
  'hexagon': Hexagon,
  'arrowupdown': ArrowUpDown,
  'arrow-up-down': ArrowUpDown,
  'pin': Pin,
  'pinoff': PinOff,
  'pin-off': PinOff
};

/**
 * Smart category icon mapping based on category names
 * Maps common category names to appropriate icons
 */
export const categoryIconMap = {
  // Income categories  
  salary: 'dollar-sign',
  freelance: 'user',
  investment: 'trending-up',
  investments: 'trending-up',
  'quick income': 'zap',
  gift: 'gift',
  bonus: 'award',
  rental: 'home',
  business: 'building',
  
  // Hebrew income categories
  'משכורת': 'dollar-sign',
  'עבודה עצמאית': 'user', 
  'השקעות': 'trending-up',
  'הכנסה מהירה': 'zap',
  
  // Expense categories
  groceries: 'shopping-cart',
  transportation: 'car',
  entertainment: 'film',
  'quick expense': 'zap',
  general: 'circle',
  
  // Hebrew expense categories
  'מכולת': 'shopping-cart',
  'תחבורה': 'car',
  'בידור': 'film',
  'הוצאה מהירה': 'zap', 
  'כללי': 'circle',
  
  // Additional expense categories
  food: 'utensils',
  restaurant: 'utensils',
  transport: 'car',
  car: 'car',
  gas: 'fuel',
  fuel: 'fuel',
  travel: 'plane',
  shopping: 'shopping-cart',
  clothes: 'palette',
  fashion: 'palette',
  bills: 'file-text',
  utilities: 'zap',
  electricity: 'zap',
  water: 'zap',
  internet: 'phone',
  phone: 'smartphone',
  movies: 'film',
  music: 'music',
  games: 'gamepad2',
  gaming: 'gamepad2',
  health: 'heart',
  medical: 'pill',
  medicine: 'pill',
  fitness: 'dumbbell',
  gym: 'dumbbell',
  education: 'book',
  learning: 'graduation-cap',
  books: 'book',
  home: 'home',
  rent: 'home',
  pets: 'paw-print',
  baby: 'baby',
  
  // Fallbacks
  general: 'tag',
  other: 'more-horizontal',
  default: 'circle'
};

/**
 * Get icon component by name (handles both kebab-case and PascalCase from DB)
 * @param {string} iconName - Name of the icon
 * @returns {React.Component} Icon component
 */
export const getIconComponent = (iconName) => {
  if (!iconName) {
    return Circle;
  }
  
  // Try database icon mapping first (for PascalCase names from DB)
  if (dbIconMap[iconName]) {
    return dbIconMap[iconName];
  }
  
  // Try regular icon mapping (kebab-case)
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }
  
  // Try lowercase version
  const lowerName = iconName.toLowerCase();
  if (dbIconMap[lowerName]) {
    return dbIconMap[lowerName];
  }
  
  // Log missing icons for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.warn('🎯 Missing icon:', iconName, '- add to categoryIcons.js');
  }
  
  return Circle;
};

/**
 * Get appropriate icon for a category based on its name
 * @param {string} categoryName - Category name
 * @returns {string} Icon name
 */
export const getIconForCategory = (categoryName) => {
  if (!categoryName) return 'circle';
  
  const name = categoryName.toLowerCase().trim();
  
  // Direct match first
  if (categoryIconMap[name]) {
    return categoryIconMap[name];
  }
  
  // Partial match
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }
  
  return 'circle';
};

/**
 * Get color class for category type
 * @param {string} categoryType - Category type (income/expense) 
 * @returns {string} CSS classes for styling
 */
export const getColorForCategory = (categoryType) => {
  switch (categoryType) {
    case 'income':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    case 'expense':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
  }
};

/**
 * Get gradient colors for category type
 * @param {string} categoryType - Category type
 * @returns {string} Gradient CSS classes
 */
export const getGradientForCategory = (categoryType) => {
  switch (categoryType) {
    case 'income':
      return 'from-green-400 to-emerald-500';
    case 'expense':
      return 'from-red-400 to-rose-500';
    default:
      return 'from-gray-400 to-slate-500';
  }
};

/**
 * Category themes configuration for organizing categories into logical groups
 */
export const categoryConfig = {
  themes: {
    daily: {
      name: 'Daily Expenses',
      name_he: 'הוצאות יומיות',
      icon: 'coffee',
      color: 'bg-blue-500',
      categories: ['food', 'coffee', 'groceries', 'transport', 'fuel', 'gas', 'car', 'utensils', 'restaurant']
    },
    bills: {
      name: 'Bills & Utilities',
      name_he: 'חשבונות ושירותים',
      icon: 'file-text',
      color: 'bg-orange-500',
      categories: ['bills', 'utilities', 'electricity', 'water', 'internet', 'phone', 'rent', 'insurance']
    },
    lifestyle: {
      name: 'Lifestyle',
      name_he: 'אורח חיים',
      icon: 'heart',
      color: 'bg-pink-500',
      categories: ['shopping', 'entertainment', 'health', 'fitness', 'travel', 'movies', 'music', 'personal care']
    },
    professional: {
      name: 'Professional',
      name_he: 'מקצועי',
      icon: 'briefcase',
      color: 'bg-purple-500',
      categories: ['work', 'business', 'education', 'books', 'learning', 'gifts & donations']
    },
    income: {
      name: 'Income Sources',
      name_he: 'מקורות הכנסה',
      icon: 'trending-up',
      color: 'bg-green-500',
      categories: ['salary', 'freelance', 'investment', 'bonus', 'rental', 'gift', 'government', 'other income']
    },
    miscellaneous: {
      name: 'Other',
      name_he: 'אחר',
      icon: 'more-horizontal',
      color: 'bg-gray-500',
      categories: ['other', 'general', 'default', 'other expense', 'miscellaneous income']
    }
  }
};

/**
 * Export all icons for components that need the full list
 */
export const allIcons = Object.values(iconCategories).flat();

export default {
  iconCategories,
  iconMap,
  categoryIconMap,
  getIconComponent,
  getIconForCategory,
  getColorForCategory,
  getGradientForCategory,
  categoryConfig,
  allIcons
};
