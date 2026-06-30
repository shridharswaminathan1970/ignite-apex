# How to Run Acceptance Tests - Practical Guide

**Document**: STEP8_ACCEPTANCE_CHECKLIST.md  
**Total Tests**: 60  
**Time Required**: ~2 hours  
**Method**: Manual testing through UI

---

## Setup (15 minutes)

### 1. Prepare Test Accounts

You'll need to test as different roles. Use existing accounts or create new ones:

**Required Accounts**:
```
✅ super_duper_admin: muhammad.shaamel@gmail.com (or your master admin)
✅ super_admin: reenusha19 (already exists)
✅ admin_m: shaamel1970@gmail.com (read-only manager - already exists)
✅ sdr: huntjobsdown4shaamel@gmail.com (already exists)

🆕 CREATE THESE (if needed):
- admin: (invite via reenusha19)
- account_executive: (invite via reenusha19)
- public: (create free-tier user)
```

**How to Create Test Users**:
1. Login as reenusha19 (super_admin)
2. Go to https://shaamelz.com/app/company-dashboard.html
3. Click "Add Team Member"
4. For **admin**: role=admin, manager=(none), crm_enabled=true
5. For **account_executive**: role=account_executive, manager=admin, crm_enabled=true
6. For **public**: role=public, manager=(none), crm_enabled=false
7. Copy invite links and set passwords in incognito windows

### 2. Prepare Test Data

Create sample data for testing:
1. Login as each user
2. Create 1-2 leads per user (to test data access)
3. Note which users manage which users (for app_manages testing)

### 3. Prepare Tracking Sheet

Create a simple checklist (spreadsheet or document):
```
| Test # | Category | Description | Expected | Result | Notes |
|--------|----------|-------------|----------|--------|-------|
| 1.1 | Auth | User can login | Success | ✅/❌ | |
| 1.2 | Auth | Session persists | No re-login | ✅/❌ | |
...
```

**Or use a simple text file**:
```
AUTHENTICATION & SESSION
[✅] 1.1: User can login
[✅] 1.2: Session persists across reloads
[ ] 1.3: Logout works
[ ] 1.4: No redirect loops
```

---

## Testing Phase 1: Critical Path (30 minutes)

### Category 1: Authentication & Session (4 tests)

**Test 1.1: User Can Login**
1. Open https://shaamelz.com/app/auth.html
2. Enter credentials: reenusha19 / password
3. Click "Sign In"
4. ✅ **Pass if**: Redirected to company-dashboard.html without errors
5. ❌ **Fail if**: Error message shows OR stuck on login page

**Test 1.2: Session Persists Across Reloads**
1. (Already logged in from 1.1)
2. Navigate to https://shaamelz.com/crm/index.html (or workspace)
3. Press F5 (or Ctrl+R) to refresh page
4. ✅ **Pass if**: Page reloads, still logged in, no redirect to login
5. ❌ **Fail if**: Redirected to login page OR shows "unauthorized"

**Test 1.3: Logout Works**
1. Click user menu (top-right corner)
2. Click "Sign Out"
3. ✅ **Pass if**: Redirected to auth.html AND cannot access protected pages
4. ❌ **Fail if**: Still logged in OR can access workspaces without login

**Test 1.4: No Redirect Loops**
1. Login as each role (super_admin, admin_m, sdr, account_executive)
2. Watch for continuous page redirects (flickering)
3. ✅ **Pass if**: Lands on one page and stays there
4. ❌ **Fail if**: Pages keep redirecting back and forth (infinite loop)

---

### Category 2: Invite Flow (8 tests)

**Setup for these tests**:
- Login as reenusha19 (super_admin)
- Have a NEW email ready (e.g., test-{timestamp}@example.com)

**Test 2.1: super_duper_admin Can Provision Company**
1. Login as muhammad.shaamel@gmail.com (super_duper_admin)
2. Go to Master Console
3. Click "Provision New Company" (redirects to admin.html)
4. Fill company details + super_admin email
5. Click "Provision"
6. ✅ **Pass if**: Success message + invite link displays + can copy link
7. ❌ **Fail if**: Error message OR no link generated

**Test 2.2: super_admin Can Invite Team Members**
1. Login as reenusha19
2. Go to Company Dashboard
3. Click "Add Team Member"
4. Enter: name=Test User, email=**test-{timestamp}@example.com**, role=sdr, crm_enabled=true
5. Click "Send Invitation"
6. ✅ **Pass if**: Success message + invite link in textarea + copy button works
7. ❌ **Fail if**: Error OR no link OR team list doesn't refresh

**Test 2.4: Invite Link Works After Email Scanner Pre-Fetch** (IMPORTANT)
1. Generate invite link (from 2.2)
2. **Before opening in browser**, open terminal and run:
   ```bash
   curl -I "https://shaamelz.com/app/set-password.html?code=PASTE_CODE_HERE"
   # Replace PASTE_CODE_HERE with actual code from invite link
   ```
3. Verify curl returns 200 OK
4. NOW open same link in **incognito window**
5. ✅ **Pass if**: Shows "Continue to Set Password" button (token NOT consumed by curl)
6. Click "Continue to Set Password"
7. ✅ **Pass if**: Password form shows (can complete setup)
8. ❌ **Fail if**: Shows "expired" immediately (token was consumed by curl)

**Test 2.6: Duplicate Email Shows Clear Error**
1. Login as reenusha19
2. Company Dashboard → "Add Team Member"
3. Enter email: **shaamel1970@gmail.com** (already exists)
4. Click "Send Invitation"
5. ✅ **Pass if**: Error shows "User with email ... already exists..."
6. ❌ **Fail if**: Success message OR cryptic error OR invite link generated

**Test 2.7: Password Setup Works on First Click**
1. Generate fresh invite link (use new email)
2. Open in incognito window
3. ✅ **Pass if**: Pre-activation screen shows with button
4. Click "Continue to Set Password"
5. ✅ **Pass if**: Shows welcome message with user name + company name
6. Enter password (min 8 chars), confirm password
7. Click "Set Password & Continue"
8. ✅ **Pass if**: "Password set successfully! Redirecting..." shows
9. ✅ **Pass if**: Redirected to CRM or Sales OS (based on crm_enabled)
10. ❌ **Fail if**: Error OR not redirected OR redirected to launcher instead of workspace

---

### Category 3: Role-Based Routing (7 tests)

**Test each role's routing after password setup**:

**Test 3.1: super_admin Routes to Company Dashboard**
1. Set password as super_admin user
2. ✅ **Pass if**: Lands on `/app/company-dashboard.html`
3. ❌ **Fail if**: Lands elsewhere OR redirect loop

**Test 3.2: admin (crm_enabled=true) Routes to CRM**
1. Set password as admin user with crm_enabled=true
2. ✅ **Pass if**: Lands on `/crm/index.html`
3. ❌ **Fail if**: Lands on Sales OS OR redirect loop

**Test 3.3: admin (crm_enabled=false) Routes to Sales OS**
1. Set password as admin user with crm_enabled=false
2. ✅ **Pass if**: Lands on `/system/index.html`

**Test 3.4: sdr Routes Based on crm_enabled**
1. Set password as sdr with crm_enabled=true
2. ✅ **Pass if**: Lands on `/crm/index.html`

**Test 3.5: account_executive Routes Based on crm_enabled**
1. Set password as AE with crm_enabled=false
2. ✅ **Pass if**: Lands on `/system/index.html`

**Test 3.6: public Routes to Sales OS Only**
1. Set password as public user
2. ✅ **Pass if**: Lands on `/system/index.html`
3. ✅ **Pass if**: CRM is locked/inaccessible

---

## Testing Phase 2: Data Access (45 minutes)

### Category 4: Core Data Tables (10 tests)

**Setup**:
- Login as different users and create test leads
- Note which user owns which lead for verification

**Test 4.1: sdr Can CREATE Own Lead**
1. Login as sdr (huntjobsdown4shaamel@gmail.com)
2. Navigate to CRM → Leads (or wherever leads are)
3. Click "Add Lead" or "Create Lead"
4. Fill: name="SDR Test Lead", company="Test Co"
5. Click "Save"
6. ✅ **Pass if**: Lead created successfully + appears in list
7. ❌ **Fail if**: Error "permission denied" OR lead not created

**Test 4.2: sdr Can UPDATE Own Lead**
1. (Already logged in as sdr)
2. Find "SDR Test Lead" (created in 4.1)
3. Click "Edit" or edit icon
4. Change name to "SDR Test Lead UPDATED"
5. Click "Save"
6. ✅ **Pass if**: Lead updated successfully + changes show in list
7. ❌ **Fail if**: Error OR changes don't save

**Test 4.3: sdr Can DELETE Own Lead**
1. Find "SDR Test Lead UPDATED"
2. Click "Delete" or trash icon
3. Confirm deletion
4. ✅ **Pass if**: Lead deleted + removed from list
5. ❌ **Fail if**: Error OR lead still visible

**Test 4.4: sdr Can READ Team Leads**
1. **Setup**: Login as admin, create a lead (owner=admin)
2. Logout, login as sdr
3. Navigate to leads
4. ✅ **Pass if**: Can see admin's lead in list (via app_manages)
5. ❌ **Fail if**: Cannot see admin's lead (RLS filtering incorrectly)

**Test 4.5: sdr CANNOT UPDATE Team Lead**
1. (Logged in as sdr)
2. Find admin's lead (from 4.4)
3. Try to click "Edit"
4. ✅ **Pass if**: Edit button disabled/hidden OR update fails with permission error
5. ❌ **Fail if**: Can edit and save admin's lead (RLS broken)

**Test 4.6: account_executive Can READ Own Leads Only**
1. Login as account_executive
2. Navigate to leads
3. ✅ **Pass if**: Only see own leads (where owner=self)
4. ✅ **Pass if**: Do NOT see other users' leads (admin, sdr, etc.)
5. ❌ **Fail if**: Can see other users' leads (RLS not filtering)

**Test 4.8: admin Can UPDATE Downline Lead**
1. Login as admin
2. Navigate to leads
3. Find AE's lead (owned by account_executive who reports to admin)
4. Click "Edit"
5. Change lead details
6. Click "Save"
7. ✅ **Pass if**: Lead updated successfully (admin manages AE)
8. ❌ **Fail if**: Permission denied (RLS should allow via app_manages)

**Test 4.9: admin_m Can READ Downline Lead**
1. Login as admin_m (shaamel1970@gmail.com)
2. Navigate to leads
3. ✅ **Pass if**: Can see downline leads (where app_manages is true)
4. ❌ **Fail if**: Cannot see any leads OR only sees own

**Test 4.10: admin_m CANNOT UPDATE Any Lead**
1. (Logged in as admin_m)
2. Find any lead (own or downline)
3. Try to click "Edit"
4. ✅ **Pass if**: Edit button disabled/hidden OR update fails
5. ❌ **Fail if**: Can edit and save lead (admin_m should be read-only)

---

### Category 5: Reports (8 tests)

**Test 5.1: sdr Can READ weekly_reports**
1. Login as sdr
2. Navigate to Team Reports (if accessible) or reports section
3. ✅ **Pass if**: Can see reports (own + downline via app_manages)
4. ❌ **Fail if**: Cannot access reports OR only sees own

**Test 5.2: sdr CANNOT INSERT weekly_reports**
1. (Logged in as sdr)
2. Look for "Create Report" or "Add Report" button
3. ✅ **Pass if**: Button NOT visible OR insert fails with permission error
4. ❌ **Fail if**: Can create report (sdr should be read-only on reports)

**Test 5.3: sdr CANNOT UPDATE weekly_reports**
1. Find any report
2. Try to edit
3. ✅ **Pass if**: Edit button disabled OR update fails
4. ❌ **Fail if**: Can edit report (should be read-only)

**Test 5.4: account_executive Can INSERT Own weekly_reports**
1. Login as account_executive
2. Navigate to reports section
3. Click "Create Report"
4. Fill report details
5. Click "Save"
6. ✅ **Pass if**: Report created successfully
7. ❌ **Fail if**: Permission error (AE should be able to create own reports)

**Test 5.5: account_executive Can UPDATE Own weekly_reports**
1. Find own report (from 5.4)
2. Click "Edit"
3. Change report data
4. Click "Save"
5. ✅ **Pass if**: Report updated successfully
6. ❌ **Fail if**: Permission error

**Test 5.6: admin Can UPDATE Downline weekly_reports**
1. Login as admin
2. Find AE's report (owned by account_executive downline)
3. Click "Edit"
4. Change data
5. Click "Save"
6. ✅ **Pass if**: Report updated (admin manages AE)
7. ❌ **Fail if**: Permission denied

**Test 5.8: admin_m CANNOT UPDATE Any weekly_reports**
1. Login as admin_m
2. Find any report
3. Try to edit
4. ✅ **Pass if**: Edit disabled OR fails
5. ❌ **Fail if**: Can edit (admin_m is read-only)

---

## Testing Phase 3: UI Features (30 minutes)

### Category 6-9: UI Testing

**Quick UI Tests** (check functionality, not data access):

**Company Dashboard** (login as super_admin):
- [ ] Company profile displays (name, address, contact)
- [ ] Team member list shows with role badges
- [ ] "Add Team Member" opens modal
- [ ] "Send Login Link" generates link for existing user
- [ ] Link to Team Reports works

**Team Reports** (login as admin or sdr):
- [ ] Shows pipeline stats (value, won, lost)
- [ ] Team performance table displays
- [ ] Filtered to downline only (not peers)
- [ ] "Email Report" button works (or shows stub success)

**Master Console** (login as super_duper_admin):
- [ ] Company dropdown shows all companies
- [ ] Selecting company loads users
- [ ] User list shows with hierarchy (indentation)
- [ ] "Reset Password" generates link
- [ ] "Deactivate" button works

---

## How to Document Results

### Option 1: Simple Text File

Create `test-results.txt`:
```
ACCEPTANCE TEST RESULTS - 2026-06-15
Tester: Your Name

AUTHENTICATION & SESSION
[✅] 1.1: User can login - PASS
[✅] 1.2: Session persists - PASS
[✅] 1.3: Logout works - PASS
[❌] 1.4: No redirect loops - FAIL (sdr role redirects infinitely)
    Issue: Need to fix sdr routing in launcher.html

INVITE FLOW
[✅] 2.1: Provision company - PASS
[✅] 2.2: Invite team member - PASS
...

SUMMARY:
- Total Tests: 60
- Passed: 58 ✅
- Failed: 2 ❌
- Blocked: 0 ⏸️

CRITICAL ISSUES:
1. sdr redirect loop (Test 1.4)
2. admin_m can edit leads (Test 4.10) - RLS broken

MINOR ISSUES:
None

READY FOR LAUNCH: NO (2 critical issues)
```

### Option 2: Spreadsheet

Create Google Sheet or Excel with columns:
```
| Test ID | Category | Description | Expected | Actual | Result | Notes |
```

### Option 3: GitHub Issue

Create issue in repo:
```markdown
# Acceptance Test Results

## Summary
- Date: 2026-06-15
- Tester: Your Name
- Total: 60 tests
- **Passed**: 58 ✅
- **Failed**: 2 ❌

## Failed Tests
### Test 1.4: sdr Redirect Loop ❌
**Expected**: Land on CRM workspace
**Actual**: Infinite redirects between launcher and CRM
**Impact**: Critical - sdr users cannot access system
**Fix Required**: Update launcher.html routing logic

### Test 4.10: admin_m Can Edit Leads ❌
**Expected**: Edit button disabled
**Actual**: Can edit and save leads
**Impact**: Critical - RLS not enforcing read-only
**Fix Required**: Check admin_m RLS policy on leads table

## Next Steps
- [ ] Fix 2 critical issues
- [ ] Retest failed tests
- [ ] Sign off for launch
```

---

## Tips for Efficient Testing

### 1. Use Incognito/Private Windows
- Open separate incognito windows for each role
- Prevents session conflicts
- Can test multiple users simultaneously

### 2. Test in Batches
- Do all auth tests together (one login session)
- Do all data access tests together (create test data first)
- Do all UI tests together (quick visual checks)

### 3. Focus on Critical Path First
- If Phase 1 tests fail, stop and fix before proceeding
- No point testing data access if login doesn't work

### 4. Take Screenshots of Failures
- Helps with debugging
- Shows exact error messages
- Attach to test results

### 5. Use Browser Dev Tools
- Open Console (F12) to see errors
- Check Network tab for failed API calls
- Check Application → Storage to verify session

---

## What to Do with Results

### If All Tests Pass ✅
1. Document: "All 60 acceptance tests passed"
2. Sign off: System ready for production launch
3. Schedule launch: Deploy to production
4. Monitor: Watch logs for first 24 hours

### If Some Tests Fail ❌
1. Document failures with details
2. Report to developer (me) with:
   - Test ID that failed
   - Expected vs actual behavior
   - Screenshots/errors
   - Steps to reproduce
3. Developer fixes issues
4. Retest failed tests (and related tests)
5. Iterate until all pass

### If Many Tests Fail (>10) 🚨
1. Stop testing
2. Review setup (are test accounts created correctly?)
3. Check database integrity (run audit queries again)
4. Report systemic issues
5. May need deeper debugging before continuing

---

## Quick Start Checklist

Before starting, verify:
- [ ] Supabase config done (Redirect URLs, Email expiry)
- [ ] Orphaned user deleted (shaamel.salespro@gmail.com)
- [ ] Test accounts ready (at least super_admin and sdr)
- [ ] Browser ready (Chrome/Edge with incognito windows)
- [ ] Terminal ready (for curl test in 2.4)
- [ ] Time blocked (2 hours uninterrupted)
- [ ] Results tracking method chosen (text file / spreadsheet / issue)

**Ready?** Start with Phase 1, Test 1.1: User Can Login

Good luck! 🚀
