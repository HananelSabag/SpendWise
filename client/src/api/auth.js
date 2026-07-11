/**
 * 🔐 AUTH API MODULE - Complete Authentication System
 * Features: Email/Password, Google One Tap, Role-based access, Enhanced security
 * @module api/auth
 * @version 2.0.0 - Google One Tap Integration
 */

import { api } from "./client.js";
import { jwtDecode } from "jwt-decode";
import { normalizeUserData } from "../utils/userNormalizer";
import { simpleGoogleAuth } from "../services/simpleGoogleAuth.js";
import { setTokens, clearTokens } from "../auth/tokenStorage.js";
import { ensureFreshToken } from "../auth/refreshManager.js";

// Quiet noisy debug logs in production; keep minimal in dev
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === "true") {
  // silent
}

// ✅ Auth API Module
const normalizeAuthError = (error, fallbackMessage, fallbackCode) => {
  const data = error?.response?.data || {};
  const nested =
    data.error && typeof data.error === "object" ? data.error : null;
  const flatMessage = typeof data.error === "string" ? data.error : null;

  return {
    message:
      nested?.message ||
      flatMessage ||
      data.message ||
      error?.message ||
      fallbackMessage,
    code: nested?.code || data.code || error?.code || fallbackCode,
    status: error?.response?.status ?? error?.status ?? 0,
    details: nested?.details || data.details || error?.details,
    originalMessage:
      data.message || flatMessage || nested?.message || error?.message,
  };
};

export const authAPI = {
  // ✅ Regular Email/Password Login
  async login(email, password) {
    try {
      const response = await api.client.post("/users/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      // ✅ Extract user and token data
      let user, token;

      const d = response?.data || {};
      const dd = d?.data || {};

      // Prefer server's unified shape: { success, data: { user, accessToken, tokens } }
      if (
        dd?.user &&
        (dd?.accessToken || dd?.token || dd?.tokens?.accessToken)
      ) {
        user = dd.user;
        token = dd.accessToken || dd.token || dd.tokens?.accessToken;
      } else if (d?.user && (d?.accessToken || d?.token)) {
        // Top-level fallback
        user = d.user;
        token = d.accessToken || d.token;
      } else if (dd && (dd.id || dd.email)) {
        // If data is already user-like
        user = dd;
        token =
          d.accessToken ||
          d.token ||
          dd.accessToken ||
          dd.token ||
          dd.tokens?.accessToken;
      }

      if (!user || !token) {
        throw new Error("Invalid response format from server");
      }

      // ✅ Normalize user data
      const normalizedUser = normalizeUserData(user);

      const rt =
        dd?.tokens?.refreshToken || dd?.refreshToken || d?.refreshToken || "";
      setTokens({ access: token, refresh: rt || undefined });

      return {
        success: true,
        user: normalizedUser,
        token,
        refreshToken: response.data.refreshToken,
      };
    } catch (error) {
      console.error("Login error:", error);

      // Enhanced error handling with specific cases
      const apiError = normalizeAuthError(error, "Login failed", "LOGIN_ERROR");
      let errorMessage = apiError.message;
      let errorCode = apiError.code;
      const status = apiError.status;

      // Handle specific HTTP status codes
      if (status === 401) {
        // Invalid credentials
        const serverMessage = apiError.message || "";
        if (
          serverMessage.toLowerCase().includes("invalid credentials") ||
          serverMessage.toLowerCase().includes("invalid email") ||
          serverMessage.toLowerCase().includes("invalid password") ||
          serverMessage.toLowerCase().includes("incorrect")
        ) {
          errorMessage =
            "Invalid email or password. Please check your credentials and try again.";
          errorCode = "INVALID_CREDENTIALS";
        } else if (serverMessage.toLowerCase().includes("user not found")) {
          errorMessage =
            "Account not found. Please check your email or create a new account.";
          errorCode = "USER_NOT_FOUND";
        } else {
          errorMessage = "Invalid email or password. Please try again.";
          errorCode = "INVALID_CREDENTIALS";
        }
      } else if (status === 403) {
        const serverCode = apiError.code || "";
        const serverMessage = apiError.message || "";
        if (
          serverCode === "EMAIL_NOT_VERIFIED" ||
          serverMessage.toLowerCase().includes("email not verified")
        ) {
          errorMessage = "Please verify your email address before logging in.";
          errorCode = "EMAIL_NOT_VERIFIED";
        } else if (
          serverCode === "ACCOUNT_DEACTIVATED" ||
          serverMessage.toLowerCase().includes("deactivated")
        ) {
          errorMessage =
            "Your account has been deactivated. Please contact support.";
          errorCode = "ACCOUNT_DEACTIVATED";
        } else if (
          serverCode === "ACCOUNT_BLOCKED" ||
          serverCode === "ACCOUNT_LOCKED" ||
          serverMessage.toLowerCase().includes("blocked") ||
          serverMessage.toLowerCase().includes("locked")
        ) {
          errorMessage =
            "Your account has been temporarily blocked. Please contact support.";
          errorCode = "ACCOUNT_BLOCKED";
        } else {
          errorMessage =
            serverMessage ||
            "Access denied. Please contact support if this persists.";
          errorCode = serverCode || "ACCESS_DENIED";
        }
      } else if (status === 429) {
        // Rate limiting
        errorMessage =
          "Too many login attempts. Please wait a moment and try again.";
        errorCode = "RATE_LIMITED";
      } else if (status >= 500) {
        // Server errors
        errorMessage =
          "Our server is currently experiencing issues. Please try again in a few moments.";
        errorCode = "SERVER_ERROR";
      } else if (!error.response && status === 0) {
        // Network errors
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          errorMessage =
            "Connection timed out. Please check your internet connection and try again.";
          errorCode = "TIMEOUT_ERROR";
        } else {
          errorMessage =
            "Unable to connect to our servers. Please check your internet connection.";
          errorCode = "NETWORK_ERROR";
        }
      } else {
        // Use server message if available and meaningful
        const serverMessage = apiError.message;
        if (serverMessage && !serverMessage.includes("Internal server error")) {
          errorMessage = serverMessage;
        }
        errorCode = apiError.code || "LOGIN_ERROR";
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          status: status,
          originalMessage: apiError.originalMessage,
        },
      };
    }
  },

  // ✅ Get Profile (shared by stores and hooks)
  async getProfile() {
    try {
      const response = await api.client.get("/users/profile");
      const payload = response?.data || {};
      const rawUser = payload?.data || payload?.user || payload; // server uses data: normalizedUser

      const normalizedUser = normalizeUserData(rawUser);

      return { success: true, user: normalizedUser, data: normalizedUser };
    } catch (error) {
      const apiError = normalizeAuthError(
        error,
        "Failed to load profile",
        "PROFILE_ERROR",
      );
      return {
        success: false,
        error: apiError,
      };
    }
  },

  async updateProfile(updates) {
    try {
      const response = await api.client.put("/users/profile", updates);
      const payload = response?.data || {};
      const rawUser = payload?.data || payload?.user || updates;
      const normalizedUser = normalizeUserData(rawUser);
      return { success: true, user: normalizedUser, data: normalizedUser };
    } catch (error) {
      const apiError = normalizeAuthError(
        error,
        "Profile update failed",
        "PROFILE_UPDATE_ERROR",
      );
      return {
        success: false,
        error: apiError,
      };
    }
  },

  // ✅ Validate Token (used by recovery manager)
  async validateToken() {
    try {
      const res = await this.getProfile();
      return { success: !!res.success };
    } catch {
      return { success: false };
    }
  },

  // ✅ Process Google credential (shared logic)
  // googleLogin is an alias for backwards-compatibility with older call sites
  async googleLogin(credential) {
    return this.processGoogleCredential(credential);
  },

  async processGoogleCredential(credential) {
    // ✅ Validate credential
    if (!credential || typeof credential !== "string") {
      throw new Error("Invalid Google credential received");
    }

    // ✅ Check JWT format
    const parts = credential.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format - expected JWT ID token");
    }

    // ✅ Extract user info
    let userInfo = { email: "", name: "", picture: "" };

    try {
      const decoded = jwtDecode(credential);
      userInfo = {
        email: decoded.email || "",
        name: decoded.name || "",
        picture: decoded.picture || "",
      };
    } catch (decodeError) {
      throw new Error("Failed to decode Google ID token");
    }

    if (!userInfo.email) {
      throw new Error("No email found in Google credential");
    }

    // ✅ Send to backend
    const payload = {
      idToken: credential,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };

    const response = await api.client.post("/users/auth/google", payload);

    // ✅ Extract response data (server returns data.user and data.accessToken)
    let user, token;
    const d = response?.data || {};
    if (d?.data?.user && (d?.data?.accessToken || d?.data?.token)) {
      user = d.data.user;
      token = d.data.accessToken || d.data.token;
    } else if (d?.user && (d?.accessToken || d?.token)) {
      user = d.user;
      token = d.accessToken || d.token;
    }

    if (!user || !token) {
      console.error("❌ Server response debug:", {
        fullResponse: response,
        responseData: response.data,
        userFound: !!user,
        tokenFound: !!token,
        responseStatus: response?.status,
        responseHeaders: response?.headers,
      });
      throw new Error("Invalid response format from server");
    }

    // ✅ Normalize and store
    const normalizedUser = normalizeUserData(user);

    const rt =
      response.data.data?.tokens?.refreshToken ||
      response.data.refreshToken ||
      "";
    setTokens({ access: token, refresh: rt || undefined });

    return {
      success: true,
      user: normalizedUser,
      token,
      refreshToken: response.data.refreshToken,
    };
  },

  // ✅ Register
  async register(userData) {
    try {
      const response = await api.client.post("/users/register", {
        firstName: userData.firstName?.trim(),
        lastName: userData.lastName?.trim(),
        email: userData.email?.trim().toLowerCase(),
        password: userData.password,
        acceptedTerms: userData.acceptedTerms,
      });

      // ✅ Handle registration response
      let user, message;

      if (response.data?.data?.user) {
        user = response.data.data.user;
        message = response.data.message || "Registration successful";
      } else if (response.data?.user) {
        user = response.data.user;
        message = response.data.message || "Registration successful";
      } else {
        message = response.data?.message || "Registration successful";
      }

      return {
        success: true,
        user: user ? normalizeUserData(user) : null,
        message,
        requiresVerification: !user?.email_verified,
      };
    } catch (error) {
      console.error("Registration error:", error);
      const apiError = normalizeAuthError(
        error,
        "Registration failed",
        "REGISTRATION_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },

  // ✅ Logout
  async logout() {
    try {
      // Sign out from Google (if available)
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }

      clearTokens();

      // Optional: Call backend logout endpoint
      try {
        await api.client.post("/users/logout");
      } catch (e) {
        // Ignore logout errors
      }

      return { success: true };
    } catch (error) {
      clearTokens();
      return { success: true }; // Always succeed for logout
    }
  },

  // ✅ Token Refresh — thin wrapper kept for legacy callers.
  // All real refresh logic (single-flight, transient-vs-fatal) lives in
  // src/auth/refreshManager.js.
  async refreshToken() {
    const result = await ensureFreshToken();
    if (result.ok) return { success: true, token: result.token };
    return {
      success: false,
      requiresLogin: !!result.fatal,
      error: { code: "TOKEN_REFRESH_ERROR", message: "Token refresh failed" },
    };
  },

  // ✅ Verify Email
  async verifyEmail(token) {
    try {
      const response = await api.client.post("/users/verify-email", { token });

      return {
        success: true,
        message: response.data?.message || "Email verified successfully",
      };
    } catch (error) {
      console.error("Email verification error:", error);
      const apiError = normalizeAuthError(
        error,
        "Email verification failed",
        "EMAIL_VERIFICATION_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },

  // ✅ Resend Verification
  async resendVerification(email) {
    try {
      const response = await api.client.post("/users/resend-verification", {
        email: email.trim().toLowerCase(),
      });

      return {
        success: true,
        message: response.data?.message || "Verification email sent",
      };
    } catch (error) {
      console.error("Resend verification error:", error);
      const apiError = normalizeAuthError(
        error,
        "Failed to resend verification",
        "RESEND_VERIFICATION_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },

  // ✅ Password Reset Request
  async requestPasswordReset(email) {
    try {
      const response = await api.client.post("/users/password-reset-request", {
        email: email.trim().toLowerCase(),
      });

      return {
        success: true,
        message: response.data?.message || "Password reset email sent",
      };
    } catch (error) {
      console.error("Password reset request error:", error);
      const apiError = normalizeAuthError(
        error,
        "Password reset request failed",
        "PASSWORD_RESET_REQUEST_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },

  // ✅ Password Reset
  async resetPassword(token, newPassword) {
    try {
      const response = await api.client.post("/users/password-reset", {
        token,
        newPassword,
      });

      return {
        success: true,
        message: response.data?.message || "Password reset successful",
      };
    } catch (error) {
      console.error("Password reset error:", error);
      const apiError = normalizeAuthError(
        error,
        "Password reset failed",
        "PASSWORD_RESET_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },

  // 🔐 Set Password (for Google-only users setting their first password)
  async setPassword({ newPassword }) {
    try {
      const response = await api.client.post("/users/set-password", {
        newPassword,
      });

      return {
        success: true,
        message: response.data?.message || "Password set successfully",
      };
    } catch (error) {
      console.error("Set password error:", error);
      const apiError = normalizeAuthError(
        error,
        "Failed to set password",
        "SET_PASSWORD_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },

  // 🔑 Change Password (for users updating their existing password)
  async changePassword({ currentPassword, newPassword }) {
    try {
      const response = await api.client.post("/users/change-password", {
        currentPassword,
        newPassword,
      });

      return {
        success: true,
        message: response.data?.message || "Password changed successfully",
      };
    } catch (error) {
      console.error("Change password error:", error);
      const apiError = normalizeAuthError(
        error,
        "Failed to change password",
        "CHANGE_PASSWORD_ERROR",
      );

      return {
        success: false,
        error: apiError,
      };
    }
  },
};

// ✅ Export Simple Google Auth service for UI components
export { simpleGoogleAuth };
