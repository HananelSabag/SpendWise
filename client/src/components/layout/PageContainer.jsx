// components/layout/PageContainer.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

const PageContainer = ({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = true,
  center = false
}) => {
  const maxWidths = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  };

  return (
    <div className={cn(
      'w-full',
      maxWidths[maxWidth],
      'mx-auto',
      padding && 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
      center && 'flex items-center justify-center min-h-full',
      className
    )}>
      {children}
    </div>
  );
};

export default PageContainer;