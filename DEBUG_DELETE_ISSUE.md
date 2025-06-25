# 🔍 Debug Guide: Recurring Transaction Delete Issue

## **Quick Testing Steps**

### **1. Test Client-Side Connectivity (Browser Console)**

Open your app in browser, open Developer Tools (F12), and run:

```javascript
// Test if API connectivity works
await templatesAPI.testConnection();

// Test actual delete with a real template ID (replace 123 with real ID)
await templatesAPI.delete('123', false);
```

### **2. Check Server Logs on Render**

1. Go to **Render Dashboard** → Your Service → **Logs**
2. Look for these log patterns:

**✅ Request Received:**
```
🛣️ DELETE TEMPLATE ROUTE HIT
🗑️ DELETE TEMPLATE REQUEST RECEIVED
```

**✅ Processing:**
```
🗑️ CALLING RecurringTemplate.delete
```

**✅ Success:**
```
✅ TEMPLATE DELETE SUCCESS
```

**❌ Errors:**
```
❌ TEMPLATE DELETE FAILED
```

### **3. Check Client Logs (Browser Console)**

Look for these patterns in browser console:

**✅ Request Started:**
```
🗑️ TEMPLATE DELETE REQUEST
📝 Request Details
🌍 Environment
⏳ Making DELETE request...
```

**✅ Success:**
```
✅ DELETE REQUEST SUCCESS
```

**❌ Errors:**
```
❌ TEMPLATE DELETE ERROR
🔴 Server Response Error / Network Request Error
```

---

## **Debugging Scenarios**

### **Scenario 1: No Server Logs at All**
**Problem:** Requests aren't reaching your server
**Solutions:**
- Check VITE_API_URL environment variable on Vercel
- Verify API URL in browser console: `console.log(config.API_URL)`
- Test basic connectivity: `fetch('YOUR_RENDER_URL/health')`

### **Scenario 2: Server Logs Show Route Hit but No Controller**
**Problem:** Request reaches route but fails before controller
**Check:** 
- Authentication errors
- Rate limiting
- Validation errors

### **Scenario 3: Controller Logs Error**
**Problem:** Server-side processing error
**Check:**
- Database connection issues
- RecurringTemplate.delete method errors
- Permission issues

### **Scenario 4: Client Shows Network Error**
**Problem:** CORS or network connectivity issues
**Solutions:**
- Check if health endpoint works: `fetch('YOUR_RENDER_URL/health')`
- Verify CORS headers in Network tab

---

## **Manual Testing Commands**

### **Test API Endpoint Directly (Replace URLs)**

```bash
# Test health endpoint
curl -X GET https://your-render-app.onrender.com/health

# Test debug endpoint (replace YOUR_TOKEN)
curl -X GET https://your-render-app.onrender.com/api/v1/transactions/debug/templates/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test actual delete (replace YOUR_TOKEN and TEMPLATE_ID)
curl -X DELETE https://your-render-app.onrender.com/api/v1/transactions/templates/TEMPLATE_ID?deleteFuture=false \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **Get Your Auth Token (Browser Console)**

```javascript
// Get your current auth token
localStorage.getItem('accessToken')
```

---

## **Environment Variable Checklist**

### **Vercel (Client):**
```env
VITE_API_URL=https://your-render-app.onrender.com
VITE_CLIENT_URL=https://your-vercel-app.vercel.app
VITE_ENVIRONMENT=production
```

### **Render (Server):**
```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
CLIENT_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

---

## **Real-Time Monitoring Commands**

### **Watch Render Logs:**
1. Go to Render Dashboard
2. Open your service
3. Click "Logs" tab
4. Keep it open while testing

### **Watch Browser Network Tab:**
1. Open Developer Tools (F12)
2. Go to "Network" tab
3. Try delete operation
4. Check if DELETE request appears

---

## **Expected Working Flow**

1. **Client:** User clicks delete
2. **Client:** `templatesAPI.delete()` called
3. **Client:** Console shows "🗑️ TEMPLATE DELETE REQUEST"
4. **Server:** Route logs "🛣️ DELETE TEMPLATE ROUTE HIT"
5. **Server:** Controller logs "🗑️ DELETE TEMPLATE REQUEST RECEIVED"
6. **Server:** Controller logs "🗑️ CALLING RecurringTemplate.delete"
7. **Server:** Controller logs "✅ TEMPLATE DELETE SUCCESS"
8. **Client:** Console shows "✅ DELETE REQUEST SUCCESS"

---

## **Common Issues & Fixes**

### **Issue: "Failed to delete recurring transaction"**
- Check server logs for specific error
- Verify template ID exists
- Check user permissions

### **Issue: Network Error / CORS**
- Verify VITE_API_URL is correct
- Check ALLOWED_ORIGINS on server
- Test health endpoint

### **Issue: 401 Unauthorized**
- Check if user is logged in
- Verify auth token in localStorage
- Test with fresh login

### **Issue: 404 Not Found**
- Verify template ID is correct
- Check if template was already deleted
- Verify API route path

---

## **Quick Fix Commands**

```javascript
// In browser console - test everything:

// 1. Check environment
console.log('API URL:', config.API_URL);
console.log('Auth Token:', localStorage.getItem('accessToken'));

// 2. Test connectivity
await templatesAPI.testConnection();

// 3. Test delete with real ID
await templatesAPI.delete('REAL_TEMPLATE_ID', false);
```

---

## **After Debugging:**

1. **Remove debug endpoint** from production
2. **Remove excessive logging** if not needed
3. **Document the root cause** for future reference

**Debug endpoint to remove later:**
`server/routes/transactionRoutes.js` - Remove the `/debug/templates/:id` route 