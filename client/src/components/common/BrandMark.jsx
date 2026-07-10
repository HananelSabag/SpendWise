import React from 'react';
import { cn } from '../../utils/helpers';

const sizes = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-9 w-9 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};

export default function BrandMark({ size = 'md', className, decorative = true }) {
  return (
    <img
      src="/favicon.ico"
      alt={decorative ? '' : 'SpendWise'}
      className={cn(sizes[size] || sizes.md, 'object-cover shadow-sm shrink-0', className)}
    />
  );
}

