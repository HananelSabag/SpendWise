import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../../utils/helpers';

const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getRandomColor = (name) => {
  if (!name) return 'bg-gray-400';
  
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  
  // Generate a consistent color based on the name
  const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

const Avatar = ({
  name,
  src,
  size = 'medium',
  className = '',
  ...props
}) => {
  const sizes = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg'
  };
  
  const sizeClass = sizes[size] || sizes.medium;
  const initials = getInitials(name);
  const bgColor = getRandomColor(name);
  
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
        sizeClass,
        !src && bgColor,
        className
      )}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={name || 'Avatar'} 
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span className="font-medium text-white">
          {initials}
        </span>
      ) : (
        <User className="text-white w-1/2 h-1/2" />
      )}
    </div>
  );
};

export default Avatar;
