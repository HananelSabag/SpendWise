// components/ui/Avatar.jsx
import React from 'react';
import { User } from 'lucide-react';
import { cn } from '../../utils/helpers';

/**
 * Avatar Component
 * UPDATED: Properly handles image URLs from backend
 */
const Avatar = ({ 
  name, 
  src, 
  size = 'md', 
  className = '',
  onClick,
  showStatus = false,
  status = 'online' // online, offline, away
}) => {
  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const statusSizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500'
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate color from name
  const getColorFromName = (name) => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-red-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // UPDATED: Improved image URL handling with better error recovery
  const getImageSrc = () => {
    if (!src) return null;
    
    // If it's already a full URL (http/https), use it as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // If it's a relative path starting with /, prepend the API URL
    if (src.startsWith('/')) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiUrl}${src}`;
    }
    
    // Otherwise, assume it's a relative path and prepend API URL with /
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}/${src}`;
  };

  const [imageError, setImageError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
    setRetryCount(0);
    setIsLoading(true);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.error('Avatar image failed to load:', e.target.src);
    setIsLoading(false);
    
    // Try to retry with a cache buster
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        const newSrc = getImageSrc() + '?t=' + Date.now();
        console.log('Retrying avatar image load:', newSrc);
        e.target.src = newSrc;
        setIsLoading(true);
      }, 1000 * (retryCount + 1)); // Increasing delay
    } else {
      console.warn('Avatar image failed to load after retries, showing fallback');
      setImageError(true);
    }
  };

  return (
    <div 
      className={cn('relative inline-block', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {src && !imageError ? (
        <div className="relative">
          <img
            src={getImageSrc() + (retryCount > 0 ? '?t=' + Date.now() : '')}
            alt={name || 'Avatar'}
            className={cn(
              'rounded-full object-cover',
              sizeClasses[size],
              onClick && 'cursor-pointer hover:ring-4 transition-all',
              isLoading && 'opacity-50'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold text-white',
            sizeClasses[size],
            getColorFromName(name),
            onClick && 'cursor-pointer hover:ring-4 transition-all'
          )}
        >
          {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
        </div>
      )}
      
      {/* Status indicator */}
      {showStatus && (
        <div 
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800',
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;