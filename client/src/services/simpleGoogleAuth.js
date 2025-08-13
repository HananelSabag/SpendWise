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

      // Handle credential response
      const handleCredentialResponse = (response) => {
        try {
          if (!response.credential) {
            throw new Error('No credential received from Google');
          }

          // silent
          onSuccess?.(response.credential);
        } catch (error) {
          // silent
          onError?.(error);
        }
      };

      // Initialize Google Sign-In once per page load
      if (!this._gsiInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false
        });
        this._gsiInitialized = true;
      }

      // Always re-render the button on each call so it's clickable again
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: '300' // Fixed width instead of percentage
      });

      // Re-enable click after a successful or failed attempt by canceling prompt state
      try { window.google.accounts.id.cancel(); } catch (_) {}

      // silent
      return true;

    } catch (error) {
      // silent
      onError?.(error);
      return false;
    }
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
