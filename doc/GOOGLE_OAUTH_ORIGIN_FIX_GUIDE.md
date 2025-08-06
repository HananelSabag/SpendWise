# 🔐 Google OAuth Origin Fix Guide

## Problem Analysis
Your Google OAuth is failing with `unregistered_origin` error because your current domains aren't registered as authorized origins in your Google Cloud Console.

## Current Configuration
- **Client ID**: `680960783178-vl2oi588lavo17vjd00p9kounnfam7kh.apps.googleusercontent.com`
- **Development URL**: `http://localhost:5173`
- **Production URL**: `https://spendwise-client.vercel.app`

## ⚠️ Critical Issues Identified
1. **Unregistered Origins**: Current domains not authorized in Google Cloud Console
2. **FedCM Compliance**: Google mandates FedCM starting October 2024
3. **Missing Authorized JavaScript Origins**: Required for client-side authentication

## 🚀 Step-by-Step Fix

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project containing the OAuth client
3. Navigate to **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth Client
1. Look for OAuth 2.0 Client ID: `680960783178-vl2oi588lavo17vjd00p9kounnfam7kh.apps.googleusercontent.com`
2. Click on the pencil icon to edit

### Step 3: Add Authorized JavaScript Origins
Add these exact URLs to **Authorized JavaScript origins**:

**For Development:**
```
http://localhost:5173
http://127.0.0.1:5173
```

**For Production:**
```
https://spendwise-client.vercel.app
```

### Step 4: Add Authorized Redirect URIs (if needed)
Add these to **Authorized redirect URIs**:

**For Development:**
```
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
```

**For Production:**
```
https://spendwise-client.vercel.app/auth/callback
```

### Step 5: Save and Wait
1. Click **Save**
2. **Wait 5-10 minutes** for changes to propagate globally

## 📝 Code Changes Made

### 1. Full FedCM Compliance Update
Updated `client/src/api/auth.js` with multiple improvements:

**Line 69**: Enabled FedCM:
```javascript
use_fedcm_for_prompt: true, // Enable FedCM for compliance with Google's new requirements
```

**Lines 72-73**: Enhanced configuration:
```javascript
ux_mode: 'popup', // Use popup mode for better FedCM compatibility
hosted_domain: null // Allow any domain for consumer accounts
```

**Lines 194-216**: Fixed deprecated methods:
```javascript
// ✅ FedCM Update: Removed deprecated isNotDisplayed() and getNotDisplayedReason() methods
// These methods are no longer available with FedCM to improve privacy
```

**Lines 221-237**: Enhanced timeout handling:
```javascript
// ✅ Enhanced timeout handling for FedCM
const timeoutId = setTimeout(() => {
  // 30-second timeout with proper cleanup
}, 30000);
```

### 2. Removed Deprecated Methods
- ❌ Removed `notification.isNotDisplayed()`
- ❌ Removed `notification.getNotDisplayedReason()`
- ✅ Kept only FedCM-compliant methods: `isSkippedMoment()`, `isDismissedMoment()`, `getDismissedReason()`

## 🔧 Alternative Domains (if needed)

If you're using different domains, add these patterns:

**Localhost variations:**
- `http://localhost:3000`
- `http://localhost:8080`
- `http://127.0.0.1:3000`

**Custom domains:**
- `https://your-custom-domain.com`
- `https://www.your-custom-domain.com`

## ⚡ Quick Test

After making the changes:

1. **Clear browser cache** (important!)
2. **Wait 5-10 minutes** for Google's changes to propagate
3. **Try Google login again**
4. **Check browser console** for any remaining errors

## 📊 Expected Behavior

After fix:
- ✅ Google OAuth popup should open successfully
- ✅ No "unregistered_origin" errors
- ✅ FedCM warnings should disappear
- ✅ Users can authenticate with Google

## 🚨 Important Notes

1. **Exact URL Match Required**: URLs must match EXACTLY (including protocol and port)
2. **No Path Components**: Don't include `/login` or other paths in origins
3. **Case Sensitive**: URLs are case-sensitive
4. **Propagation Time**: Changes can take 5 minutes to several hours
5. **Multiple Environments**: Add separate entries for dev/staging/prod

## 🛡️ Security Best Practices

1. **Only add necessary domains** - don't add wildcards
2. **Use HTTPS in production** - never use HTTP for live sites
3. **Review regularly** - remove unused origins
4. **Monitor usage** - check Google Cloud Console usage metrics

## 🐛 Troubleshooting

If still not working:

1. **Double-check URLs** - ensure exact match with browser address bar
2. **Clear DNS cache** - `ipconfig /flushdns` (Windows) or restart browser
3. **Try incognito mode** - eliminates browser cache issues
4. **Check network tab** - look for 403 errors in browser dev tools
5. **Verify project** - ensure you're editing the correct Google Cloud project

## 📞 Next Steps

1. **Update Google Cloud Console** with the authorized origins
2. **Wait 5-10 minutes** for propagation
3. **Test Google OAuth** in both development and production
4. **Monitor for any remaining errors**

---

**🎯 Expected Result**: Google OAuth should work perfectly after these changes are applied to your Google Cloud Console configuration.