/**
 * 🔐 SIMPLE GOOGLE SIGN-IN BUTTON
 * No complex logic, just works!
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { simpleGoogleAuth } from '../../../services/simpleGoogleAuth.js';
import { Button, LoadingSpinner } from '../../ui';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

const SimpleGoogleButton = ({ 
  onSuccess, 
  onError, 
  disabled = false,
  text = 'Continue with Google'
}) => {
  const { t } = useTranslation('auth');
  const buttonRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const retryCountRef = useRef(0);
  const initOnceRef = useRef(false);

  // Initialize Google button
  useEffect(() => {
    if (disabled || hasError) return;
    if (initOnceRef.current) return; // Prevent double-init (React StrictMode)
    initOnceRef.current = true;

    retryCountRef.current = 0; // Reset retry count on new effect

    const initGoogle = async () => {
      try {
        setIsLoading(true);
        // silent
        
        // Ensure container element exists
        if (!buttonRef.current) {
          if (retryCountRef.current < 10) { // Max 10 retries
            retryCountRef.current += 1;
            // silent
            setTimeout(initGoogle, 300);
            return;
          } else {
            console.error('❌ Container element never became available after 10 retries');
            setHasError(true);
            onError?.(new Error('Container element not available'));
            return;
          }
        }
        
        // silent
        
        const success = await simpleGoogleAuth.renderButton(
          buttonRef.current,
          (credential) => {
            // silent
            onSuccess?.(credential);
          },
          (error) => {
            // silent
            setHasError(true);
            onError?.(error);
          }
        );

        if (success) {
          setIsGoogleReady(true);
          if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') console.log('✅ Google button ready');
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('❌ Failed to initialize Google button:', error);
        setHasError(true);
        onError?.(error);
      } finally {
          setIsLoading(false);
      }
    };

    // Start initialization
    const timeoutId = setTimeout(initGoogle, 300);
    return () => {
      clearTimeout(timeoutId);
      // Ensure previous GSI instance does not block clicks after unmount
      try {
        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
        }
      } catch (_) {}
      initOnceRef.current = false;
    };
  }, [disabled, hasError, onSuccess, onError]); // retryCount not included to prevent infinite re-runs

  // Render custom button; keep GSI container invisible and clickable when ready
  return (
    <div className="w-full flex justify-center relative">
      <Button
        type="button"
        variant="outline"
        className="w-full max-w-[300px] min-h-[48px] font-medium flex items-center justify-center gap-3"
        onClick={() => {
          // No spinner; initialization happens silently
          if (!isGoogleReady && !isLoading && !hasError) {
            (async () => {
              try {
                await simpleGoogleAuth.initialize();
                setIsGoogleReady(true);
              } catch (_) {
                setHasError(true);
              }
            })();
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 align-middle translate-y-[1px] shrink-0" aria-hidden="true" focusable="false">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.6 6.2 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.2-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.6 6.2 28.9 4 24 4 16.1 4 9.2 8.6 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.7 13.5-4.7l-6.2-5.1C29.3 36 26.8 37 24 37c-5.3 0-9.8-3.3-11.4-7.9l-6.6 5.1C9 39.4 15.9 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.7 29.3 36 24 36c-5.3 0-9.8-3.3-11.4-7.9l-6.6 5.1C9 39.4 15.9 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.2-.4-3.5z"/>
        </svg>
        <span className="align-middle">
          {t('continueWithGoogle', { fallback: 'Continue with Google' })}
        </span>
      </Button>

      {/* Invisible GSI container over the custom button */}
      <div
        ref={buttonRef}
        className="absolute inset-0 w-full max-w-[300px] mx-auto"
        style={{ opacity: 0, pointerEvents: isGoogleReady && !hasError ? 'auto' : 'none' }}
      />
    </div>
  );
};

export default SimpleGoogleButton;
