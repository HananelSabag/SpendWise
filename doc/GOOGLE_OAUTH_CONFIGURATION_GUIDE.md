# Google OAuth Configuration Guide

## Overview
This guide explains how to properly configure Google OAuth to fix redirect issues and 404 errors.

## Current Issues Identified
1. Google OAuth redirects to 404 pages sometimes
2. Authentication conflicts between regular login and Google OAuth  
3. Inconsistent authentication flow behavior

## Root Causes
- Incorrect Google Cloud Console OAuth configuration
- Missing or wrong redirect_uri settings
- Environment variables not properly configured

## Solution Steps

### 1. Google Cloud Console Configuration

#### Required Settings:
- **Application Type**: Web application
- **Authorized JavaScript origins**: 
  - `http://localhost:5173` (for development)
  - `https://your-production-domain.com` (for production)
- **Authorized redirect URIs**: 
  - `http://localhost:5173` (for development)
  - `https://your-production-domain.com` (for production)

#### Important Notes:
- Do NOT add `/auth/callback` or similar paths to redirect URIs when using Google Identity Services
- The redirect URIs should match your domain exactly
- Remove any old OAuth 2.0 redirect URIs that might cause conflicts

### 2. Environment Variables

#### Required Variables:
```bash
# Client-side (Vite)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Server-side (if needed for verification)
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### Where to Set:
- Development: `.env.local` file in client directory
- Production: Environment variables in hosting platform (Vercel, Netlify, etc.)

### 3. Code Improvements Made

#### Enhanced Error Handling:
- Better debugging information for OAuth flow
- Specific error messages for different failure scenarios
- Timeout handling extended to 60 seconds

#### Configuration Improvements:
- Added `use_fedcm_for_prompt: false` to prevent redirect issues
- Enhanced initialization checks
- Better credential validation

### 4. Testing the Fix

#### Steps to Test:
1. Verify environment variables are set correctly
2. Check browser console for Google OAuth debug messages
3. Test Google OAuth login flow
4. Verify regular login still works after database fix

#### Expected Behavior:
- Google OAuth should show popup/prompt (not redirect)
- No 404 errors during authentication
- Successful login redirects to dashboard
- Regular email/password login works normally

### 5. Troubleshooting

#### Common Issues:

**Issue**: "Google Client ID not configured" error
**Solution**: Set `VITE_GOOGLE_CLIENT_ID` environment variable

**Issue**: Still getting redirects to 404
**Solution**: Check Google Cloud Console authorized origins and remove unnecessary redirect URIs

**Issue**: "popup was blocked" error
**Solution**: User needs to allow popups in browser settings

**Issue**: OAuth works sometimes, fails other times
**Solution**: Clear browser cache and cookies for the domain

### 6. Database User Conflict Resolution

#### Fixed Issues:
- User `hananel12345@gmail.com` had conflicting auth methods
- Database updated to set `oauth_provider = NULL` for password-based users
- User can now use regular login with their password

#### Query Used:
```sql
UPDATE users 
SET oauth_provider = NULL, google_id = NULL 
WHERE email = 'hananel12345@gmail.com' 
AND password_hash IS NOT NULL;
```

## Next Steps

1. **Update Google Cloud Console** with correct settings above
2. **Set environment variables** properly
3. **Test authentication flows** thoroughly
4. **Monitor for any remaining issues**

## Technical Details

### Authentication Flow:
1. User clicks Google Sign-In button
2. Google Identity Services loads
3. User authenticates with Google (popup/prompt)
4. Google returns JWT ID token
5. Frontend sends token to backend `/api/v1/users/auth/google`
6. Backend validates token and creates/updates user
7. User is logged in and redirected to dashboard

### Security Notes:
- ID tokens are validated on backend
- No access tokens stored client-side
- Proper CSRF protection via token validation
- User data normalized for consistency

## Status: ✅ Ready for Testing
- Database conflicts resolved
- OAuth code improved
- Configuration guide provided
- Regular login fixed 