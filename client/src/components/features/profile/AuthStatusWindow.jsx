/**
 * 🔐 AUTHENTICATION STATUS WINDOW
 * Shows user authentication status and allows setup actions
 * Similar to onboarding but for profile page
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Key, Check, AlertCircle, Chrome, Link2, 
  Lock, Unlock, CheckCircle, Settings 
} from 'lucide-react';
import { Button, Card } from '../../ui';
import { cn } from '../../../utils/helpers';
import { useAuth } from '../../../stores';

const AuthStatusWindow = ({ className = "", onNavigateToSecurity }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ SIMPLIFIED: Use ACTUAL database values - no guesswork!
  const isGoogleUser = !!(user?.oauth_provider === 'google' || user?.google_id);
  const hasPassword = !!(user?.hasPassword || user?.has_password);
  
  // 🔍 ULTIMATE DEBUG: Log what profile auth window sees
  console.log('🔍 PROFILE AUTH WINDOW: Component received user object:', {
    email: user?.email,
    userId: user?.id,
    // Raw fields from server
    hasPassword_field: user?.hasPassword,
    has_password_field: user?.has_password,
    password_hash_field: user?.password_hash ? 'EXISTS' : 'MISSING',
    oauth_provider_field: user?.oauth_provider,
    google_id_field: user?.google_id,
    // Computed values
    hasPassword_computed: hasPassword,
    isGoogleUser_computed: isGoogleUser,
    // User object keys
    userObjectKeys: Object.keys(user || {})
  });
  
  // Simple, clear user types based on database reality
  const isHybridUser = isGoogleUser && hasPassword;    // Has both Google + Password
  const isEmailOnlyUser = hasPassword && !isGoogleUser; // Has only password
  const isGoogleOnlyUser = isGoogleUser && !hasPassword; // Has only Google

  // UI logic
  const needsPassword = isGoogleOnlyUser;  // Only pure Google users need password setup
  const canLinkGoogle = isEmailOnlyUser;   // Only email-only users can link Google

  const getStatusConfig = () => {
    if (isHybridUser) {
      return {
        title: '🛡️ Hybrid Authentication',
        subtitle: 'Perfect! You can login with both methods',
        status: 'hybrid',
        color: 'green',
        icon: CheckCircle,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        actions: []
      };
    }
    
    if (needsPassword) {
      return {
        title: '🔑 Google Only',
        subtitle: 'Add password for more security',
        status: 'google-only',
        color: 'blue',
        icon: Key,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        actions: [
          { 
            text: 'Set Password', 
            action: () => onNavigateToSecurity && onNavigateToSecurity(),
            icon: Lock 
          }
        ]
      };
    }
    
    if (canLinkGoogle) {
      return {
        title: '📧 Email Only',
        subtitle: 'Link Google for easier login',
        status: 'email-only',
        color: 'orange',
        icon: AlertCircle,
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        actions: [
          { 
            text: 'Link Google', 
            action: () => {
              // TODO: Implement Google linking
              alert('Google linking will be implemented soon!');
            },
            icon: Link2 
          }
        ]
      };
    }

    return {
      title: '⚙️ Unknown Status',
      subtitle: 'Check your authentication settings',
      status: 'unknown',
      color: 'gray',
      icon: Settings,
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      actions: []
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Card className={cn("relative overflow-hidden", config.bgColor, config.borderColor, className)}>
      <div className="p-4">
        {/* Header - Always Visible */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              config.color === 'green' && "bg-green-100 dark:bg-green-900/30",
              config.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30", 
              config.color === 'orange' && "bg-orange-100 dark:bg-orange-900/30",
              config.color === 'gray' && "bg-gray-100 dark:bg-gray-900/30"
            )}>
              <StatusIcon className={cn(
                "w-5 h-5",
                config.color === 'green' && "text-green-600",
                config.color === 'blue' && "text-blue-600",
                config.color === 'orange' && "text-orange-600", 
                config.color === 'gray' && "text-gray-600"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {config.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.subtitle}
              </p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className={cn(
            "w-3 h-3 rounded-full",
            config.color === 'green' && "bg-green-500",
            config.color === 'blue' && "bg-blue-500",
            config.color === 'orange' && "bg-orange-500",
            config.color === 'gray' && "bg-gray-500"
          )} />
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            {/* Debug Info */}
            <div className="space-y-2 mb-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>🔍 Google: {isGoogleUser ? '✅' : '❌'}</div>
                <div>🔑 Password: {hasPassword ? '✅' : '❌'}</div>
                <div>🔗 Provider: {user?.oauth_provider || 'none'}</div>
                <div>📧 Email: {user?.email}</div>
              </div>
            </div>

            {/* Action Buttons */}
            {config.actions.length > 0 && (
              <div className="space-y-2">
                {config.actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={action.action}
                      size="sm"
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <ActionIcon className="w-4 h-4 mr-2" />
                      {action.text}
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Hybrid Success Message */}
            {isHybridUser && (
              <div className="text-center py-2">
                <div className="text-green-600 dark:text-green-400 font-medium text-sm">
                  ✨ All authentication methods configured!
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
};

export default AuthStatusWindow;
