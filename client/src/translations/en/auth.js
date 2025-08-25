/**
 * 🔐 AUTH TRANSLATIONS - ENGLISH
 * Complete authentication system translations
 * @version 2.0.0
 */

export default {
  // Login page
  welcomeBack: "Welcome Back",
  signInToContinue: "Sign in to your SpendWise account",
  
  // Form fields
  email: "Email Address",
  emailPlaceholder: "Enter your email address",
  password: "Password", 
  passwordPlaceholder: "Enter your password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  
  // Buttons and actions
  signIn: "Sign In",
  signingIn: "Signing in...",
  signUp: "Sign Up",
  signUpNow: "Sign up here",
  rememberMe: "Remember me",
  forgotPassword: "Forgot your password?",
  
  // OAuth and alternatives
  orContinueWith: "Or continue with",
  continueWithGoogle: "Continue with Google",
  connecting: "Connecting...",
  initializingGoogle: "Loading Google...",
  
  // Account states
  dontHaveAccount: "Don't have an account?",
  hasAccount: "Already have an account?",
  
  // Security features
  secured: "Secured",
  verified: "Verified", 
  biometric: "Biometric",
  deviceSecured: "Device secured with fingerprint",
  biometricReady: "Biometric authentication ready",
  locationSecured: "Location verified",
  signInWithBiometric: "Sign in with biometric",
  
  // AI Security features
  securityAnalysis: "Security Analysis",
  securityAnalysisDesc: "AI-powered security analysis completed",
  riskScore: "Risk Score",
  recommendations: "Recommendations",
  dismiss: "Dismiss",
  
  // Validation messages
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email address",
  passwordRequired: "Password is required",
  passwordTooShort: "Password must be at least 6 characters",
  
  // Error messages
  loginFailed: "Login failed",
  authenticationFailed: "Authentication failed",
  googleLoginFailed: "Google login failed",
  googleLoginError: "Google login error",
  biometricLoginFailed: "Biometric login failed",
  biometricError: "Biometric authentication error",
  securityBlock: "Security Block",
  securityBlockDesc: "Login blocked due to security concerns",
  
  // Specific login errors
  invalidCredentials: "Invalid email or password. Please check your credentials and try again.",
  userNotFound: "Account not found. Please check your email or create a new account.",
  emailNotVerified: "Please verify your email address before logging in.",
  accountBlocked: "Your account has been temporarily blocked. Please contact support.",
  accessDenied: "Access denied. Please contact support if this persists.",
  rateLimited: "Too many login attempts. Please wait a moment and try again.",
  serverError: "Our server is currently experiencing issues. Please try again in a few moments.",
  timeoutError: "Connection timed out. Please check your internet connection and try again.",
  networkError: "Unable to connect to our servers. Please check your internet connection.",
  
  // Support messages
  contactSupport: "If this problem persists, please contact us at:",
  supportEmail: "spendwise.verification@gmail.com",
  
  // Success messages
  loginSuccess: "Welcome back!",
  googleLoginSuccess: "Google login successful!",
  biometricLoginSuccess: "Biometric login successful!",
  biometricAvailableHint: "Biometric authentication is now available",
  
  // Register page
  createAccount: "Create Account",
  joinSpendWise: "Join SpendWise to manage your finances",
  account: "Account",
  security: "Security",
  profile: "Profile",
  complete: "Complete",
  name: "Full Name",
  namePlaceholder: "Enter your full name",
  confirmPassword: "Confirm Password", 
  confirmPasswordPlaceholder: "Confirm your password",
  agreeToTerms: "I agree to the",
  termsOfService: "Terms of Service",
  and: "and",
  privacyPolicy: "Privacy Policy",
  
  // Password Reset
  resetPassword: "Reset Password",
  resetPasswordSubtitle: "Enter your email to receive reset instructions",
  sendInstructions: "Send Instructions",
  sending: "Sending...",
  checkEmail: "Check your email",
  checkEmailMessage: "We've sent password reset instructions to your email address.",
  backToLogin: "Back to Login",
  checkYourEmail: "Check your email",
  clickVerificationLink: "Click the verification link we sent to your email",
  verifyingEmail: "Verifying Email",
  pleaseWaitVerifying: "Please wait while we verify your email...",
  emailVerificationSuccess: "Email verified successfully!",
  verificationTokenExpired: "Verification link expired. You can request a new one.",
  verificationEmailResent: "Verification email sent again!",
  resendVerificationFailed: "Failed to resend verification email",
  resendVerificationError: "An error occurred while resending verification email",
  goToLogin: "Go to Login",
  newPassword: "New Password",
  newPasswordPlaceholder: "Enter your new password",
  confirmNewPassword: "Confirm New Password",
  confirmNewPasswordPlaceholder: "Confirm your new password",
  resetting: "Resetting...",
  tokenExpired: "Reset link expired",
  tokenExpiredMessage: "This password reset link has expired. Please request a new one.",
  requestNew: "Request New Link",
  
  // Email Verification
  verifyEmail: "Verify Email",
  verifying: "Verifying Email",
  pleaseWait: "Please wait while we verify your email address...",
  emailVerified: "Email Verified!",
  verificationSuccess: "Your email has been successfully verified.",
  verificationFailed: "Verification Failed",
  verificationFailedMessage: "We couldn't verify your email. The link may be invalid or expired.",
  linkExpired: "Link Expired",
  linkExpiredMessage: "This verification link has expired. We can send you a new one.",
  resendVerification: "Send New Verification",
  verificationSent: "Verification email sent!",
  resendFailed: "Failed to send verification email",
  redirecting: "Redirecting to dashboard...",
  
  // Additional validation
  nameRequired: "Name is required",
  nameTooShort: "Name must be at least 2 characters",
  passwordsDontMatch: "Passwords don't match",
  
  // Registration fields
  firstName: 'First Name',
  lastName: 'Last Name',
  firstNameRequired: 'First name is required',
  lastNameRequired: 'Last name is required',
  firstNamePlaceholder: 'Enter your first name',
  lastNamePlaceholder: 'Enter your last name',
  
  // Google OAuth Profile Completion
  completeYourProfile: 'Complete Your Profile',
  addDetailsToPersonalizeExperience: 'Add some details to personalize your experience',
  username: 'Username',
  usernamePlaceholder: 'Choose a unique username',
  usernameRequired: 'Username is required',
  usernameTooShort: 'Username must be at least 3 characters',
  usernameInvalidCharacters: 'Username can only contain letters, numbers, and underscores',
  profilePicture: 'Profile Picture',
  clickToUploadProfilePicture: 'Click the camera icon to upload a profile picture',
  profilePictureInvalidType: 'Please select an image file',
  profilePictureTooLarge: 'Profile picture must be less than 5MB',
  bio: 'Bio',
  bioPlaceholder: 'Tell us a bit about yourself...',
  phone: 'Phone',
  phonePlaceholder: '+1 (555) 123-4567',
  phoneInvalidFormat: 'Please enter a valid phone number',
  website: 'Website',
  websitePlaceholder: 'https://yourwebsite.com',
  websiteInvalidFormat: 'Please enter a valid website URL',
  location: 'Location',
  locationPlaceholder: 'City, Country',
  optional: 'optional',
  completeProfile: 'Complete Profile',
  completing: 'Completing...',
  skipForNow: 'Skip for now',
  skipProfile: 'Skip profile setup',
  profileCompletedSuccessfully: 'Profile completed successfully!',
  profileUpdateFailed: 'Failed to update profile',
  profileUpdateError: 'An error occurred while updating your profile',
  profileSetupComplete: 'Profile setup complete!',
  profileCanBeCompletedLater: 'You can complete your profile later in settings',
  completeProfileToGetStarted: 'Complete your profile to get started',
  termsRequired: "You must agree to the terms and conditions",
  acceptTermsRequired: "You must accept the terms and conditions",
  acceptTerms: "I accept the terms and conditions",
  
  // ✅ ADD: Additional registration translations
  registrationSuccess: "Registration successful! Please check your email for verification.",
  registrationFailed: "Registration failed. Please try again.",
  registrationError: "An error occurred during registration.",
  googleRegisterSuccess: "Google registration successful!",
  googleRegisterFailed: "Google registration failed. Please try again.",
  googleRegisterError: "An error occurred during Google registration.",
  alreadyHaveAccount: "Already have an account?",
  welcomeAboard: "Welcome Aboard!",
  readyToStart: "You're all set and ready to start managing your finances!",
  
  // Additional errors
  signUpFailed: "Sign up failed",
  passwordResetFailed: "Password reset failed", 
  invalidCredentials: "Invalid email or password",
  emailExists: "An account with this email already exists",
  emailNotFound: "No account found with this email address",
  weakPassword: "Password is too weak",
  tooManyAttempts: "Too many attempts. Please try again later",
  networkError: "Network error. Please check your connection",
  serverError: "Server error. Please try again later",
  tokenExpiredError: "Session expired. Please sign in again",
  emailNotVerified: "Please verify your email address first",
  
  // Loading states
  signingUp: "Creating account...",
  sendingReset: "Sending reset instructions...",
  resettingPassword: "Resetting password...",
  verifyingEmail: "Verifying email...",
  signingOut: "Signing out...",
  
  // Account management
  logout: "Logout", 
  logoutDesc: "Sign out of your account",
  logoutSuccess: "Signed out successfully",
  passwordResetSent: "Password reset instructions sent to your email",
  passwordResetSuccess: "Password reset successfully!",
  signUpSuccess: "Account created successfully!",
  
  // Security features
  passwordStrengthWeak: "Weak",
  passwordStrengthFair: "Fair",
  passwordStrengthGood: "Good", 
  passwordStrengthStrong: "Strong",
  password: {
    empty: "Enter password",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    excellent: "Excellent",
    checks: {
      length: "At least 8 characters",
      uppercase: "Uppercase letter",
      lowercase: "Lowercase letter",
      numbers: "Number",
      symbols: "Special character",
      noSequential: "No sequential characters",
      noRepeating: "No repeating characters"
    }
  },
  twoFactorEnable: "Enable Two-Factor Authentication",
  twoFactorDisable: "Disable Two-Factor Authentication",
  twoFactorRequired: "Two-factor authentication required"
}; 