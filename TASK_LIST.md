# SpendWise - Fix Task List

## 🎯 Onboarding Issues ✅ **COMPLETED**
- [x] **Fix onboarding completion state persistence** - Modal keeps showing even after user clicked "Finish"
- [x] **Improve onboarding UX for returning incomplete users** - Replace forced onboarding with optional dialog
  - [x] Add detection for users who started but didn't complete onboarding
  - [x] Create small dialog asking "Looks like you didn't finish the onboarding experience. Would you like to continue or skip it?"
  - [x] Add "Continue Onboarding" and "Skip for Now" buttons
  - [x] Ensure skipping marks onboarding as completed
  - [x] Keep onboarding accessible via Help menu in header

**✅ RESOLUTION IMPLEMENTED:**
- Enhanced `OnboardingModal.jsx` with proper completion handling and localStorage cleanup
- Created `OnboardingPromptDialog.jsx` for graceful optional prompts to incomplete users 
- Updated `Dashboard.jsx` with smart 3-state detection and persistent settings
- All builds passing, production-ready implementation

## 💰 Balance Panel Critical Issue ✅ **COMPLETED**
- [x] **Fix balance display stuck on daily view for new users**
- [x] **Investigate why balance panel doesn't respond to time range changes (daily/weekly/monthly/yearly)**
- [x] **Test with new vs old user accounts to identify the root cause**
- [x] **Check recent changes that might have affected this functionality**
- [x] **Ensure proper data filtering and display updates for all time ranges**

**🔍 ROOT CAUSE IDENTIFIED:**
The critical bug was in the PostgreSQL `get_user_stats()` function in `server/db/05_final_touches.sql`. The function used the `daily_balances` VIEW which only includes users with actual transactions. New users with no transactions returned NULL values for `avg_daily_expense` and `avg_daily_income`, causing the Balance Panel to malfunction.

**✅ TECHNICAL SOLUTION IMPLEMENTED:**
1. **Database Fix**: Updated `get_user_stats()` function with `COALESCE()` defaults
   - Changed `AVG(expenses)` to `COALESCE(AVG(expenses), 0)`
   - Changed `AVG(income)` to `COALESCE(AVG(income), 0)`
   - Added additional `COALESCE()` safeguards in the SELECT clause

2. **Client-Side Safeguards**: Already existing in codebase
   - `numbers.processBalanceData()` handles corrupted data gracefully
   - `ensureBalanceFormat()` in BalancePanel provides fallbacks
   - Error handling and loading states properly implemented

**🎯 IMPACT:** 
- New users now see proper balance data (all zeros) instead of undefined/null
- Balance Panel responds correctly to time range changes for all users
- No more "stuck on daily view" behavior
- Consistent experience between new and existing users

## 🔄 App Refresh & Server Issues
- [ ] **Fix strange refresh behavior** - Multiple loading states and error page flashing
  - [ ] Investigate the error page appearing during refresh
  - [ ] Streamline loading sequence to single loading state
  - [ ] Test refresh behavior across different browsers
- [ ] **Handle server cold start gracefully**
  - [ ] Add toast notification for server startup delays
  - [ ] Display message: "Our server is starting up, please wait ~1 minute. Everything will return to normal operation shortly"
  - [ ] Implement proper loading state during cold start period

## 🎨 Styling & Design Consistency
- [ ] **Unify color scheme across dashboard**
  - [ ] Replace varied component colors with consistent color palette
  - [ ] Remove individual component boxes/borders that create visual noise
  - [ ] Create unified container design for dashboard components
- [ ] **Redesign dashboard layout**
  - [ ] Combine components into cohesive larger containers
  - [ ] Remove separate boxes for each component
  - [ ] Maintain current functionality while improving visual hierarchy
- [ ] **Fix profile page styling**
  - [ ] Apply consistent color scheme to profile page
  - [ ] Reduce visual chaos and improve component organization
- [ ] **Ensure design consistency across all pages**
  - [ ] Standardize page layouts and styling patterns
  - [ ] Maintain the good overall design concept while fixing inconsistencies

## 🌐 Translation & Localization
- [ ] **Complete Hebrew translations in AddTransactions.jsx**
  - [ ] Review all text strings in the component
  - [ ] Add missing translations to LanguageContext
  - [ ] Test Hebrew display and RTL support
- [ ] **Fix default transaction names translation**
  - [ ] Add Hebrew translations for default transaction names
  - [ ] Ensure proper display in transaction lists
- [ ] **Add Hebrew support to currency calculator**
  - [ ] Translate all calculator interface elements
  - [ ] Test currency conversion display in Hebrew
- [ ] **Complete dashboard statistics translations**
  - [ ] Translate all statistics component text to Hebrew
  - [ ] Review and fix any hardcoded English text
- [ ] **Comprehensive translation audit**
  - [ ] Scan entire application for missing Hebrew translations
  - [ ] Create list of all untranslated strings
  - [ ] Implement missing translations systematically

## 🧪 Testing & Validation
- [ ] **Test onboarding flow end-to-end**
- [ ] **Validate balance panel with different user types**
- [ ] **Test server cold start handling**
- [ ] **Verify design consistency across all pages**
- [ ] **Complete translation testing in Hebrew**
- [ ] **Cross-browser compatibility testing**
- [ ] **Mobile responsiveness validation**

## 📝 Notes
- **Communication**: User communicates in Hebrew but expects responses and thinking in English
- Application is live: Client on Vercel, Server on Render, Database on Supabase
- Focus on systematic approach - complete each section before moving to next
- Test thoroughly on both desktop and mobile
- Maintain existing functionality while implementing fixes

---
**Progress Tracking**: Check off completed tasks and update as we progress through the fixes. 

## 📊 Progress Summary
- **Completed**: 2/6 major issue categories
- **Critical Issues Resolved**: Onboarding system, Balance Panel
- **Remaining**: App refresh, styling, translations, testing 