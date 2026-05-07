/**
 * Google Sign-In button — custom styled with invisible GSI overlay
 */

import React, { useEffect, useRef, useState } from 'react';
import { simpleGoogleAuth } from '../../../services/simpleGoogleAuth.js';
import { cn } from '../../../utils/helpers';
import { useTranslation } from '../../../stores';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.6 6.2 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.3-.1-2.2-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.6 6.2 28.9 4 24 4 16.1 4 9.2 8.6 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.7 13.5-4.7l-6.2-5.1C29.3 36 26.8 37 24 37c-5.3 0-9.8-3.3-11.4-7.9l-6.6 5.1C9 39.4 15.9 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.7 29.3 36 24 36c-5.3 0-9.8-3.3-11.4-7.9l-6.6 5.1C9 39.4 15.9 44 24 44c10 0 19-7.3 19-20 0-1.3-.1-2.2-.4-3.5z"/>
  </svg>
);

const SimpleGoogleButton = ({ onSuccess, onError, disabled = false }) => {
  const { t } = useTranslation('auth');
  const buttonRef   = useRef(null);
  const retryRef    = useRef(0);
  const initOnceRef = useRef(false);
  const [isReady,   setIsReady]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError,  setHasError]  = useState(false);

  useEffect(() => {
    if (disabled || hasError || initOnceRef.current) return;
    initOnceRef.current = true;
    retryRef.current = 0;

    const init = async () => {
      if (!buttonRef.current) {
        if (retryRef.current++ < 10) { setTimeout(init, 300); return; }
        setHasError(true); onError?.(new Error('Container not available')); return;
      }
      try {
        setIsLoading(true);
        const ok = await simpleGoogleAuth.renderButton(
          buttonRef.current,
          (credential) => onSuccess?.(credential),
          (err)        => { setHasError(true); onError?.(err); },
        );
        if (ok) setIsReady(true); else setHasError(true);
      } catch (err) {
        setHasError(true); onError?.(err);
      } finally {
        setIsLoading(false);
      }
    };

    const t = setTimeout(init, 300);
    return () => {
      clearTimeout(t);
      try { if (buttonRef.current) buttonRef.current.innerHTML = ''; } catch (_) {}
      initOnceRef.current = false;
    };
  }, [disabled, hasError, onSuccess, onError]);

  return (
    <div className="relative w-full">
      {/* Visible button — always LTR so the G logo stays on the left */}
      <button
        type="button"
        dir="ltr"
        disabled={disabled || isLoading}
        className={cn(
          'w-full h-12 rounded-xl font-semibold text-sm',
          'flex items-center justify-center gap-3',
          'bg-white dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600',
          'text-gray-700 dark:text-gray-200',
          'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100',
          'shadow-sm transition-all duration-200',
          (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
        )}
        onClick={() => {
          if (!isReady && !isLoading && !hasError) {
            (async () => {
              try { await simpleGoogleAuth.initialize(); setIsReady(true); } catch (_) { setHasError(true); }
            })();
          }
        }}
      >
        {isLoading
          ? <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          : <GoogleIcon />
        }
        <span>{t('continueWithGoogle', { fallback: 'Continue with Google' })}</span>
      </button>

      {/* Invisible GSI clickable overlay */}
      <div
        ref={buttonRef}
        className="absolute inset-0"
        style={{ opacity: 0, pointerEvents: isReady && !hasError ? 'auto' : 'none' }}
      />
    </div>
  );
};

export default SimpleGoogleButton;
