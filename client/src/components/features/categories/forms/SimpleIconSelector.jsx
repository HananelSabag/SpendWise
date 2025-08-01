import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../utils/helpers';

// Import icons directly from lucide-react
import {
  Tag, Circle, Heart, DollarSign, ShoppingBag, Car, Home, Coffee,
  Briefcase, Receipt, CreditCard, Plane, Music, Book, Pill, Utensils,
  TrendingUp, Building, Film, Code, Gamepad2, User, MoreHorizontal, Zap
} from 'lucide-react';

/**
 * Simple Icon Selector - REBUILT FROM SCRATCH
 * No complex mapping, no validation, just works!
 */
const SimpleIconSelector = ({ value, onChange, error }) => {
  
  // Direct icon mapping - simple and bulletproof
  const ICONS = {
    'Tag': Tag,
    'Circle': Circle,
    'Heart': Heart,
    'DollarSign': DollarSign,
    'ShoppingBag': ShoppingBag,
    'Car': Car,
    'Home': Home,
    'Coffee': Coffee,
    'Briefcase': Briefcase,
    'Receipt': Receipt,
    'CreditCard': CreditCard,
    'Plane': Plane,
    'Music': Music,
    'Book': Book,
    'Pill': Pill,
    'Utensils': Utensils,
    'TrendingUp': TrendingUp,
    'Building': Building,
    'Film': Film,
    'Code': Code,
    'Gamepad2': Gamepad2,
    'User': User,
    'MoreHorizontal': MoreHorizontal,
    'Zap': Zap
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Icon *
      </label>

      {/* Simple Icon Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
        {Object.entries(ICONS).map(([iconName, IconComponent]) => (
          <motion.button
            key={iconName}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(iconName)}
            className={cn(
              "p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center",
              value === iconName
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-300 text-gray-600 dark:text-gray-400"
            )}
            title={iconName}
          >
            <IconComponent className="w-5 h-5" />
          </motion.button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default SimpleIconSelector;