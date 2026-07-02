/**
 * 🔐 SIMPLE GOOGLE AUTHENTICATION SERVICE
 * No complex One Tap, no CORS issues, just works!
 * @version 1.0.0
 */

let __resolvedClientId = null;
let __warnedMissingClientId = false;

const GOOGLE_CONFIG = {
  get CLIENT_ID() {
    if (__resolvedClientId) return __resolvedClientId;

    // 1) Prefer environment variable (source of truth)
    if (import.meta.env?.VITE_GOOGLE_CLIENT_ID) {
      __resolvedClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      return __resolvedClientId;
    }
    // 1b) Accept alternate key if provided
    if (import.meta.env?.VITE_GSI_CLIENT_ID) {
      __resolvedClientId = import.meta.env.VITE_GSI_CLIENT_ID;
      return __resolvedClientId;
    }

    // 2) Allow runtime overrides only if explicitly provided and valid
    try {
      if (typeof window !== 'undefined') {
        const runtimeOverride = window.__SW_GOOGLE_CLIENT_ID__;
        if (runtimeOverride && /\.apps\.googleusercontent\.com$/.test(runtimeOverride)) {
          __resolvedClientId = runtimeOverride;
          return __resolvedClientId;
        }
        const stored = localStorage?.getItem?.('SW_DEV_GOOGLE_CLIENT_ID');
        if (stored && /\.apps\.googleusercontent\.com$/.test(stored)) {
          __resolvedClientId = stored;
          return __resolvedClientId;
        }
      }
    } catch (_) {}

    // 3) Fallback to a safe default (works only where origin is authorized)
    __warnedMissingClientId = true;
    __resolvedClientId = '680960783178-vl2oi588lavo17vjd00p9kounnfam7kh.apps.googleusercontent.com';
    return __resolvedClientId;
  },
  SCRIPT_URL: 'https://accounts.google.com/gsi/client'
};

// silent config dump

// THE Google silent-bounce fix: GSI's initialize({callback}) can only be
// called once per page load, and the old code baked the FIRST component
// mount's onSuccess into that callback. Any remount (Login↔Register nav,
// language switch) left GSI firing a stale closure of an unmounted
// component — the user completed Google sign-in and nothing happened.
//
// Now the GSI callback is a stable trampoline that delegates to
// `currentHandler`, which every renderButton() call updates. If a
// credential arrives when no handler is mounted (mid-navigation), it's
// stashed so the login page can resume it on mount.
let currentHandler = null;
const PENDING_KEY = 'pendingGoogleCredential';

function stashPendingCredential(credential) {
  try { sessionStorage.setItem(PENDING_KEY, credential); } catch (_) {}
}

/** Login/Register call this on mount to resume a credential that arrived mid-navigation. */
export function takePendingGoogleCredential() {
  try {
    const c = sessionStorage.getItem(PENDING_KEY);
    if (c) sessionStorage.removeItem(PENDING_KEY);
    return c || null;
  } catch (_) {
    return null;
  }
}

class SimpleGoogleAuth {
  constructor() {
    this.isScriptLoaded = false;
    this.isInitialized = false;
    this._gsiInitialized = false;
  }

  /**
   * Load Google Sign-In script
   */
  async loadScript() {
    if (this.isScriptLoaded) return true;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GOOGLE_CONFIG.SCRIPT_URL;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      
      script.onerror = () => {
      // silent
        reject(new Error('Failed to load Google Sign-In script'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Google Sign-In
   */
  async initialize() {
    if (!GOOGLE_CONFIG.CLIENT_ID) {
      throw new Error('Google Client ID not configured');
    }

    if (this.isInitialized) return;

    await this.loadScript();
    
    // Wait for Google library to be available
    let attempts = 0;
    while (!window.google?.accounts?.id && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.google?.accounts?.id) {
      throw new Error('Google Sign-In library not available');
    }

    this.isInitialized = true;
  }

  /**
   * Render Google Sign-In button
   */
  async renderButton(container, onSuccess, onError) {
    try {
      await this.initialize();

      if (!container) {
        throw new Error('Container element is required');
      }

      // Clear container first
      container.innerHTML = '';

      // Point the trampoline at THIS mount's callbacks. Every renderButton
      // call refreshes it, so GSI always reaches the live component.
      currentHandler = { onSuccess, onError };

      // Initialize Google Sign-In once per page load — with a STABLE
      // trampoline callback that reads the current handler at call time.
      if (!this._gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          callback: (response) => {
            try {
              if (!response?.credential) {
                throw new Error('No credential received from Google');
              }
              if (currentHandler?.onSuccess) {
                currentHandler.onSuccess(response.credential);
              } else {
                // No component mounted right now (user navigated mid-flow) —
                // stash the credential; the login page resumes it on mount.
                stashPendingCredential(response.credential);
              }
            } catch (error) {
              currentHandler?.onError?.(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false
        });
        this._gsiInitialized = true;
      }

      // Render the button — match container width so clicks register across the full button.
      // A fixed 300px iframe was causing missed clicks on RTL/wide screens.
      const btnWidth = Math.max(container.offsetWidth || 0, 300);
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: String(btnWidth)
      });

      // Explicitly enable the container to accept pointer events
      try {
        container.style.pointerEvents = 'auto';
      } catch (_) {}

      // silent
      return true;

    } catch (error) {
      // silent
      onError?.(error);
      return false;
    }
  }

  /**
   * One-shot sign-in via the One Tap prompt. Resolves with the credential
   * or rejects when the prompt is skipped/suppressed. Used by the
   * "link Google account" flow in Profile (the old code called nonexistent
   * initializeGoogle()/signIn() methods and always threw).
   */
  async signInOnce(timeoutMs = 60_000) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const prevHandler = currentHandler;
      const timer = setTimeout(() => {
        currentHandler = prevHandler;
        reject(new Error('Google sign-in timed out'));
      }, timeoutMs);

      // Ensure the trampoline exists even if no button was ever rendered.
      if (!this._gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          callback: (response) => {
            if (response?.credential && currentHandler?.onSuccess) {
              currentHandler.onSuccess(response.credential);
            } else if (response?.credential) {
              stashPendingCredential(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false
        });
        this._gsiInitialized = true;
      }

      currentHandler = {
        onSuccess: (credential) => {
          clearTimeout(timer);
          currentHandler = prevHandler;
          resolve(credential);
        },
        onError: (err) => {
          clearTimeout(timer);
          currentHandler = prevHandler;
          reject(err);
        },
      };

      window.google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          clearTimeout(timer);
          currentHandler = prevHandler;
          reject(new Error('Google prompt was not displayed — check popup/cookie settings'));
        }
      });
    });
  }

  /**
   * Parse JWT credential (simple version)
   */
  parseCredential(credential) {
    try {
      // Simple JWT decode (header.payload.signature)
      const [, payload] = credential.split('.');
      const decoded = JSON.parse(atob(payload));
      
      return {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        email_verified: decoded.email_verified
      };
    } catch (error) {
      // silent
      throw new Error('Invalid credential format');
    }
  }
}

// Export singleton instance
export const simpleGoogleAuth = new SimpleGoogleAuth();
