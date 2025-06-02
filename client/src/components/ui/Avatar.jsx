import React, { useEffect, useState } from 'react';
import { User, Loader2 } from 'lucide-react';
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
  src, 
  name, 
  size = 'medium', 
  className,
  onError,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!src);

  // ✅ איפוס שגיאת תמונה כשמשנים src
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [src]);

  const handleImageError = (e) => {
    console.log('Avatar image failed to load:', src);
    setImageError(true);
    setImageLoading(false);
    onError?.(e);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const sizes = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg'
  };
  
  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xl: 'text-lg'
  };
  
  const sizeClass = sizes[size] || sizes.medium;
  const textClass = textSizes[size] || textSizes.medium;
  const initials = getInitials(name);
  const bgColor = getRandomColor(name);
  
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        'rounded-full overflow-hidden',
        sizeClass,
        !src || imageError ? bgColor : 'bg-gray-100 dark:bg-gray-800',
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <>
          {/* ✅ מחוון טעינה */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
          
          <img
            src={src}
            alt={name || 'Profile'}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imageLoading ? 'none' : 'block' }}
          />
        </>
      ) : (
        // Fallback to initials or user icon
        <div className="flex items-center justify-center w-full h-full">
          {initials ? (
            <span className={cn(
              'font-medium text-white',
              textClass
            )}>
              {initials}
            </span>
          ) : (
            <User className={cn(
              'text-white',
              size === 'small' ? 'w-4 h-4' :
              size === 'medium' ? 'w-5 h-5' :
              size === 'large' ? 'w-7 h-7' : 'w-10 h-10'
            )} />
          )}
        </div>
      )}
    </div>
  );
};

export default Avatar;
