/**
 * 🔐 AUTHENTICATION STATUS DETECTOR - NEW BULLETPROOF VERSION
 * Simple, reliable authentication status detection
 * @version 1.0.0 - CLEAN SLATE
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Key, Check, AlertCircle, Link2, 
  Lock, CheckCircle, Settings, RefreshCw, Bug
} from 'lucide-react';
import { Button, Card } from '../../ui';
import { cn } from '../../../utils/helpers';
import { authStatusAPI } from '../../../api/authStatus';
import { toast } from 'react-hot-toast';

const AuthStatusDetector = ({ 
  className = "", 
  context = "profile", // "profile" or "onboarding"
  onNavigateToSecurity, 
  onPasswordSetup, 
  onGoogleLink,
  showDebug = false
}) => {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [verification, setVerification] = useState(null);

  // Load authentication status
  const loadAuthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authStatusAPI.getAuthStatus();
      
      if (result.success) {
        setAuthStatus(result.data);
        setError(null);
      } else {
        setError(result.error);
        setAuthStatus(result.data); // May contain fallback data
      }
    } catch (err) {
      setError(err.message);
      setAuthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Verify authentication status
  const verifyAuthStatus = async () => {
    try {
      const result = await authStatusAPI.verifyAuthStatus();
      setVerification(result);
      
      if (result.success) {
        toast.success('Authentication status verified successfully');
      } else {
        toast.error('Authentication status verification failed');
      }
    } catch (err) {
      toast.error('Failed to verify authentication status');
    }
  };

  // Load on mount
  useEffect(() => {
    loadAuthStatus();
  }, []);

  // Handle Google linking
  const handleGoogleLink = async () => {
    try {
      if (context === 'profile') {
        // Import Google auth service for profile context
        const { simpleGoogleAuth } = await import('../../../services/simpleGoogleAuth.js');
        const { authAPI } = await import('../../../api/auth.js');
        
        await simpleGoogleAuth.initializeGoogle();
        const credential = await simpleGoogleAuth.signIn();
        
        if (credential) {
          const result = await authAPI.googleLogin(credential);
          
          if (result.success) {
            // Refresh auth status
            await loadAuthStatus();
            toast.success('Google account linked successfully!');
          }
        }
      } else {
        // Onboarding context - use callback
        if (onGoogleLink) {
          await onGoogleLink();
          // Refresh auth status
          await loadAuthStatus();
        }
      }
    } catch (error) {
      console.error('Google linking failed:', error);
      toast.error('Failed to link Google account. Please try again.');
    }
  };

  // Handle password setup
  const handlePasswordSetup = () => {
    if (context === 'profile' && onNavigateToSecurity) {
      onNavigateToSecurity();
    } else if (context === 'onboarding' && onPasswordSetup) {
      onPasswordSetup();
    }
  };

  // Get status configuration
  const getStatusConfig = () => {
    if (!authStatus) {
      return {
        title: '⚙️ Loading...',
        subtitle: 'Checking authentication status',
        status: 'loading',
        color: 'gray',
        icon: RefreshCw,
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        actions: []
      };
    }

    if (authStatus.error || error) {
      return {
        title: '⚠️ Status Unknown',
        subtitle: 'Unable to determine authentication status',
        status: 'error',
        color: 'red',
        icon: AlertCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        actions: [
          { 
            text: 'Retry', 
            action: loadAuthStatus,
            icon: RefreshCw 
          }
        ]
      };
    }

    // HYBRID user
    if (authStatus.isHybrid) {
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
    
    // GOOGLE ONLY user
    if (authStatus.needsPassword) {
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
            action: handlePasswordSetup,
            icon: Lock 
          }
        ]
      };
    }
    
    // PASSWORD ONLY user
    if (authStatus.canLinkGoogle) {
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
            action: handleGoogleLink,
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
      actions: [
        { 
          text: 'Refresh', 
          action: loadAuthStatus,
          icon: RefreshCw 
        }
      ]
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800", className)}>
        <div className="p-4 flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-gray-700 dark:text-gray-300">Detecting authentication status...</span>
        </div>
      </Card>
    );
  }

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
              config.color === 'red' && "bg-red-100 dark:bg-red-900/30",
              config.color === 'gray' && "bg-gray-100 dark:bg-gray-900/30"
            )}>
              <StatusIcon className={cn(
                "w-5 h-5",
                config.color === 'green' && "text-green-600",
                config.color === 'blue' && "text-blue-600",
                config.color === 'orange' && "text-orange-600",
                config.color === 'red' && "text-red-600", 
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
            config.color === 'red' && "bg-red-500",
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
            {/* Status Info */}
            {authStatus && (
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>🔗 Type: <span className="font-medium">{authStatus.authType}</span></div>
                  <div>🔑 Password: {authStatus.hasPassword ? '✅' : '❌'}</div>
                  <div>🔍 Google: {authStatus.hasGoogle ? '✅' : '❌'}</div>
                  <div>📧 Email: {authStatus.email}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {config.actions.length > 0 && (
              <div className="space-y-2 mb-4">
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

            {/* Debug Controls */}
            {showDebug && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={verifyAuthStatus}
                  size="sm"
                  variant="outline"
                  className="w-full justify-center"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Verify Status
                </Button>
                
                {verification && (
                  <div className="mt-2 text-xs text-gray-500">
                    Verification: {verification.success ? '✅ Passed' : '❌ Failed'}
                  </div>
                )}
              </div>
            )}

            {/* Hybrid Success Message */}
            {authStatus?.isHybrid && (
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

export default AuthStatusDetector;
