# STEP 8: Acceptance Checklist (§12)

**Date**: 2026-06-15  
**Status**: 📋 READY FOR TESTING

This checklist corresponds to §12 of ACCESS_SPEC.md. Run these tests to verify the system is production-ready.

---

## Test Environment Setup

**Required Accounts**:
- [ ] super_duper_admin: muhammad.shaamel@gmail.com (or configured master admin)
- [ ] super_admin: reenusha19 (test company admin)
- [ ] admin: (create test admin user)
- [ ] admin_m: shaamel1970@gmail.com (read-only manager)
- [ ] sdr: huntjobsdown4shaamel@gmail.com (or create test SDR)
- [ ] account_executive: (create test AE)
- [ ] public: (create test free-tier user)

**Test Data**:
- [ ] At least one test company provisioned
- [ ] Test users with various roles created
- [ ] Sample leads/deals created for access testing

---

## § Authentication & Session

### Test 1.1: User Can Login ✅
- [ ] Visit https://shaamelz.com/app/auth.html
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] **Verify**: Successful login → redirected to launcher
- [ ] **Verify**: No errors in console

### Test 1.2: Session Persists Across Reloads ✅
- [ ] Login successfully
- [ ] Navigate to workspace (CRM or Sales OS)
- [ ] Refresh page (F5 or Ctrl+R)
- [ ] **Verify**: Still logged in (no redirect to login)
- [ ] **Verify**: User info still displays correctly

### Test 1.3: Logout Works ✅
- [ ] Click "Sign Out" from any page
- [ ] **Verify**: Redirected to auth.html
- [ ] **Verify**: Cannot access protected pages without login
- [ ] **Verify**: Session cleared (localStorage empty)

### Test 1.4: No Redirect Loops ✅
- [ ] Login as each role
- [ ] **Verify**: No infinite redirects between pages
- [ ] **Verify**: Landing on correct workspace
- [ ] **Verify**: Unauthorized access shows terminal error (not redirect loop)

**Status**: ⏸️ PENDING USER TESTING

---

## § Invite Flow

### Test 2.1: super_duper_admin Can Provision Company ✅
- [ ] Login as super_duper_admin
- [ ] Navigate to Master Console or admin.html
- [ ] Click "Provision New Company"
- [ ] Fill: company name, address, contact_email, contact_phone
- [ ] Fill: super_admin name, email
- [ ] Click "Provision"
- [ ] **Verify**: Success message shows
- [ ] **Verify**: Invite link displays
- [ ] **Verify**: Can copy link to clipboard
- [ ] **Verify**: Company appears in master console dropdown

### Test 2.2: super_admin Can Invite Team Members ✅
- [ ] Login as super_admin (e.g., reenusha19)
- [ ] Navigate to Company Dashboard
- [ ] Click "Add Team Member"
- [ ] Fill: name, NEW email, role (sdr), manager, crm_enabled=true
- [ ] Click "Send Invitation"
- [ ] **Verify**: Success message shows
- [ ] **Verify**: Invite link displays in textarea
- [ ] **Verify**: "Copy Link" button works
- [ ] **Verify**: Team list refreshes with new user

### Test 2.3: admin Can Invite Downline Members ✅
- [ ] Login as admin
- [ ] Navigate to workspace
- [ ] (If invite UI available) Add team member
- [ ] **Verify**: Can only assign as own downline
- [ ] **Verify**: Cannot assign to other manager
- [ ] **Verify**: Invite link generated successfully

### Test 2.4: Invite Link Works After Email Scanner Pre-Fetch ✅
- [ ] Generate invite link
- [ ] BEFORE opening in browser, run:
   ```bash
   curl -I "https://shaamelz.com/app/set-password.html?code=XXXX"
   ```
- [ ] **Verify**: curl returns 200 OK
- [ ] NOW open same link in browser
- [ ] **Verify**: Pre-activation screen shows ("Continue to Set Password")
- [ ] Click "Continue to Set Password"
- [ ] **Verify**: Password form shows (token NOT consumed by curl)
- [ ] Set password
- [ ] **Verify**: Successfully routed to workspace

### Test 2.5: Invite Link Expires After 1 Hour ✅
- [ ] Generate invite link
- [ ] Wait 1 hour (or change Supabase config to 60s for testing)
- [ ] Open link
- [ ] **Verify**: Shows expired error message
- [ ] **Verify**: "Request New Link" button shows
- [ ] **Verify**: Clear instructions displayed

### Test 2.6: Duplicate Email Shows Clear Error ✅
- [ ] Login as super_admin
- [ ] Try to invite shaamel1970@gmail.com (already exists)
- [ ] **Verify**: Error message: "User with email ... already exists..."
- [ ] **Verify**: No invite link generated
- [ ] **Verify**: Can try again with different email

### Test 2.7: Password Setup Works on First Click ✅
- [ ] Receive invite link
- [ ] Open in incognito/private window
- [ ] **Verify**: Pre-activation screen shows
- [ ] Click "Continue to Set Password"
- [ ] **Verify**: Welcome message shows with user name + company
- [ ] Enter password (min 8 chars)
- [ ] Confirm password (must match)
- [ ] Click "Set Password & Continue"
- [ ] **Verify**: "Password set successfully! Redirecting..." shows
- [ ] **Verify**: Routed to correct workspace (no launcher shown)

### Test 2.8: User Routed to Correct Workspace ✅
Test each role after password setup:
- [ ] super_duper_admin → Master Console
- [ ] super_admin → Company Dashboard
- [ ] admin (crm_enabled=true) → CRM
- [ ] admin (crm_enabled=false) → Sales OS
- [ ] admin_m → CRM or Sales OS (based on crm_enabled)
- [ ] sdr → CRM or Sales OS (based on crm_enabled)
- [ ] account_executive → CRM or Sales OS (based on crm_enabled)
- [ ] public → Sales OS only

**Status**: ⏸️ PENDING USER TESTING

---

## § Role-Based Routing

### Test 3.1-3.7: Role Routing ✅
See Test 2.8 above (same tests)

**Status**: ⏸️ PENDING USER TESTING

---

## § Data Access - Core Tables

### Test 4.1: sdr Can CREATE Own Lead ✅
- [ ] Login as sdr
- [ ] Navigate to CRM → Leads
- [ ] Click "Add Lead"
- [ ] Fill lead details
- [ ] **Verify**: lead_owner_id = sdr user ID
- [ ] Click "Save"
- [ ] **Verify**: Lead created successfully
- [ ] **Verify**: Lead appears in lead list

### Test 4.2: sdr Can UPDATE Own Lead ✅
- [ ] Find own lead (from Test 4.1)
- [ ] Click "Edit"
- [ ] Change lead name/status
- [ ] Click "Save"
- [ ] **Verify**: Lead updated successfully
- [ ] **Verify**: Changes reflected immediately

### Test 4.3: sdr Can DELETE Own Lead ✅
- [ ] Find own lead
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] **Verify**: Lead deleted successfully
- [ ] **Verify**: Lead removed from list

### Test 4.4: sdr Can READ Team Leads ✅
- [ ] Have admin create lead (owner = admin or downline AE)
- [ ] Login as sdr
- [ ] Navigate to leads
- [ ] **Verify**: Can see admin's lead (via app_manages)
- [ ] **Verify**: Can see downline AE's lead
- [ ] **Verify**: Lead details visible

### Test 4.5: sdr CANNOT UPDATE Team Lead ✅
- [ ] Find team member's lead (not owned by sdr)
- [ ] Try to edit via UI
- [ ] **Verify**: Edit button disabled OR
- [ ] Try to update via RLS-enforced query
- [ ] **Verify**: Update fails with permission error
- [ ] **Verify**: Lead remains unchanged

### Test 4.6: account_executive Can READ Own Leads Only ✅
- [ ] Login as account_executive
- [ ] Navigate to leads
- [ ] **Verify**: Only see own leads (where owner_id = self)
- [ ] **Verify**: CANNOT see other users' leads
- [ ] **Verify**: No team visibility

### Test 4.7: account_executive CANNOT READ Other Leads ✅
- [ ] Have admin create lead (owner = admin)
- [ ] Login as account_executive
- [ ] Navigate to leads
- [ ] **Verify**: Admin's lead NOT visible
- [ ] Try to fetch via direct query (API call)
- [ ] **Verify**: RLS blocks access (returns empty or error)

### Test 4.8: admin Can UPDATE Downline Lead ✅
- [ ] Login as admin
- [ ] Create lead as downline AE (via impersonation or direct)
- [ ] Find AE's lead
- [ ] Click "Edit"
- [ ] Change lead details
- [ ] Click "Save"
- [ ] **Verify**: Lead updated successfully
- [ ] **Verify**: admin can edit because app_manages(AE)

### Test 4.9: admin_m Can READ Downline Lead ✅
- [ ] Login as admin_m
- [ ] Navigate to leads
- [ ] **Verify**: Can see downline leads (via app_manages)
- [ ] **Verify**: Can view lead details

### Test 4.10: admin_m CANNOT UPDATE Any Lead ✅
- [ ] Find any lead (own or downline)
- [ ] Try to edit
- [ ] **Verify**: Edit button disabled OR
- [ ] Try to update via API
- [ ] **Verify**: RLS blocks update (permission error)

**Status**: ⏸️ PENDING USER TESTING

---

## § Data Access - Reports

### Test 5.1: sdr Can READ weekly_reports ✅
- [ ] Login as sdr
- [ ] Navigate to Team Reports
- [ ] **Verify**: Can see own reports
- [ ] **Verify**: Can see downline reports (via app_manages)
- [ ] **Verify**: Report details visible

### Test 5.2: sdr CANNOT INSERT weekly_reports ✅
- [ ] Try to create report via UI (button should be hidden)
- [ ] **Verify**: "Create Report" button NOT visible OR
- [ ] Try to insert via API call
- [ ] **Verify**: RLS blocks insert (permission error)

### Test 5.3: sdr CANNOT UPDATE weekly_reports ✅
- [ ] Find any report (own or team)
- [ ] Try to edit
- [ ] **Verify**: Edit button disabled OR
- [ ] Try to update via API
- [ ] **Verify**: RLS blocks update (permission error)

### Test 5.4: account_executive Can INSERT Own weekly_reports ✅
- [ ] Login as account_executive
- [ ] Navigate to reports section
- [ ] Click "Create Report"
- [ ] Fill report details
- [ ] **Verify**: user_id = account_executive user ID
- [ ] Click "Save"
- [ ] **Verify**: Report created successfully

### Test 5.5: account_executive Can UPDATE Own weekly_reports ✅
- [ ] Find own report (from Test 5.4)
- [ ] Click "Edit"
- [ ] Change report data
- [ ] Click "Save"
- [ ] **Verify**: Report updated successfully

### Test 5.6: admin Can UPDATE Downline weekly_reports ✅
- [ ] Login as admin
- [ ] Navigate to reports
- [ ] Find downline AE's report
- [ ] Click "Edit"
- [ ] Change report data
- [ ] Click "Save"
- [ ] **Verify**: Report updated successfully (admin manages AE)

### Test 5.7: admin_m Can READ Downline weekly_reports ✅
- [ ] Login as admin_m
- [ ] Navigate to reports
- [ ] **Verify**: Can see downline reports
- [ ] **Verify**: Can view report details

### Test 5.8: admin_m CANNOT UPDATE Any weekly_reports ✅
- [ ] Find any report
- [ ] Try to edit
- [ ] **Verify**: Edit button disabled OR update blocked by RLS

**Status**: ⏸️ PENDING USER TESTING

---

## § User Management

### Test 6.1: super_admin Can Invite Team Member ✅
See Test 2.2 above

### Test 6.2: admin Can Invite Downline Member ✅
See Test 2.3 above

### Test 6.3: sdr CANNOT See User Management UI ✅
- [ ] Login as sdr
- [ ] Navigate to all pages (CRM, Sales OS, Team Reports)
- [ ] **Verify**: No "Add User" button visible
- [ ] **Verify**: No "User Management" menu item
- [ ] **Verify**: No access to user invite/edit forms

### Test 6.4: admin_m CANNOT See User Management UI ✅
- [ ] Login as admin_m
- [ ] Navigate to all pages
- [ ] **Verify**: No user management controls visible

### Test 6.5: Invited User Receives Correct org_id ✅
- [ ] super_admin invites user
- [ ] Check database (users table)
- [ ] **Verify**: new user's org_id = super_admin's org_id
- [ ] **Verify**: Not null, not "NA"

### Test 6.6: Invited User Receives Correct manager_id ✅
- [ ] super_admin invites user, specifies manager
- [ ] Check database (users table)
- [ ] **Verify**: new user's manager_id = specified manager
- [ ] **Verify**: If no manager specified, manager_id = inviter's ID

**Status**: ⏸️ PENDING USER TESTING

---

## § Company Dashboard (super_admin only)

### Test 7.1: Shows Company Profile ✅
- [ ] Login as super_admin
- [ ] Navigate to Company Dashboard
- [ ] **Verify**: Company name displays
- [ ] **Verify**: Company address displays
- [ ] **Verify**: Contact email displays
- [ ] **Verify**: Contact phone displays

### Test 7.2: Shows Team Member List with Roles ✅
- [ ] **Verify**: Team member list shows
- [ ] **Verify**: Each member has role badge (color-coded)
- [ ] **Verify**: Active/Inactive status visible
- [ ] **Verify**: CRM enabled indicator visible

### Test 7.3: "Add Team Member" Button Works ✅
- [ ] Click "Add Team Member"
- [ ] **Verify**: Modal opens
- [ ] **Verify**: Form has all fields (name, email, role, manager, crm_enabled)
- [ ] **Verify**: Can submit and create user

### Test 7.4: "Send Login Link" Button Works ✅
- [ ] Click "Send Login Link" for existing user
- [ ] **Verify**: Modal opens with user's name
- [ ] **Verify**: Reset link generates
- [ ] **Verify**: Link displays with copy button
- [ ] **Verify**: Link is valid (opens set-password.html)

### Test 7.5: Link to Team Reports Works ✅
- [ ] Click "Team Reports" link
- [ ] **Verify**: Redirects to team-reports.html
- [ ] **Verify**: Team reports page loads correctly

**Status**: ⏸️ PENDING USER TESTING

---

## § Team Reports (super_admin, admin, admin_m, sdr)

### Test 8.1: Filters to Caller's Downline ✅
- [ ] Login as admin
- [ ] Navigate to Team Reports
- [ ] **Verify**: Only see own + downline data (RLS filters via app_manages)
- [ ] **Verify**: NOT seeing peers or upline data

### Test 8.2: Shows Pipeline Stats ✅
- [ ] **Verify**: Pipeline value displays
- [ ] **Verify**: Closed won count/value displays
- [ ] **Verify**: Closed lost count displays
- [ ] **Verify**: Win rate calculates correctly

### Test 8.3: Shows Team Performance Table ✅
- [ ] **Verify**: Table shows team members
- [ ] **Verify**: Each row shows deals, pipeline, won, lost
- [ ] **Verify**: Data matches expected values

### Test 8.4: "Email Report" Button Works ✅
- [ ] Click "Email Report"
- [ ] Fill report details
- [ ] Click "Send"
- [ ] **Verify**: Success message shows OR
- [ ] **Verify**: Email preview displays (if stub)
- [ ] **Verify**: No errors

### Test 8.5: sdr Can View But Not Edit Reports ✅
- [ ] Login as sdr
- [ ] Navigate to Team Reports
- [ ] **Verify**: Can see reports
- [ ] **Verify**: NO edit buttons visible
- [ ] **Verify**: Report data read-only

### Test 8.6: admin_m Can View But Not Edit Reports ✅
- [ ] Login as admin_m
- [ ] Navigate to Team Reports
- [ ] **Verify**: Can see reports
- [ ] **Verify**: NO edit buttons visible

**Status**: ⏸️ PENDING USER TESTING

---

## § Master Console (super_duper_admin only)

### Test 9.1: Shows All Companies ✅
- [ ] Login as super_duper_admin
- [ ] Navigate to Master Console
- [ ] **Verify**: Company dropdown shows all companies
- [ ] **Verify**: Can select any company

### Test 9.2: Can Select Company to View Users ✅
- [ ] Select company from dropdown
- [ ] **Verify**: User list loads for that company
- [ ] **Verify**: Shows all users in company (all roles)

### Test 9.3: Can Provision New Company ✅
See Test 2.1 above

### Test 9.4: Can Reset User Password ✅
- [ ] Select company
- [ ] Find user
- [ ] Click "Reset Password"
- [ ] **Verify**: Confirm dialog shows with link
- [ ] **Verify**: Click OK → link copied to clipboard
- [ ] **Verify**: Alert shows "Link copied!"
- [ ] **Verify**: Link is valid

### Test 9.5: Can Deactivate User ✅
- [ ] Find user
- [ ] Click "Deactivate"
- [ ] **Verify**: Confirm dialog shows
- [ ] **Verify**: Click OK → user deactivated
- [ ] **Verify**: User list refreshes (shows inactive badge)
- [ ] **Verify**: User cannot login (is_active=false blocks login)

### Test 9.6: Shows Hierarchical User Tree ✅
- [ ] **Verify**: Users displayed with indentation based on manager_id
- [ ] **Verify**: ↳ symbols show nesting level
- [ ] **Verify**: Managers shown before their reports

**Status**: ⏸️ PENDING USER TESTING

---

## Summary

### Test Categories

| Category | Tests | Status |
|----------|-------|--------|
| Authentication & Session | 4 | ⏸️ Pending |
| Invite Flow | 8 | ⏸️ Pending |
| Role-Based Routing | 7 | ⏸️ Pending |
| Data Access - Core | 10 | ⏸️ Pending |
| Data Access - Reports | 8 | ⏸️ Pending |
| User Management | 6 | ⏸️ Pending |
| Company Dashboard | 5 | ⏸️ Pending |
| Team Reports | 6 | ⏸️ Pending |
| Master Console | 6 | ⏸️ Pending |
| **TOTAL** | **60** | **⏸️ Pending** |

### Execution Plan

**Phase 1: Critical Path** (30 minutes)
- Authentication & Session (4 tests)
- Invite Flow (8 tests)
- Role-Based Routing (7 tests)

**Phase 2: Data Access** (45 minutes)
- Core Tables (10 tests)
- Reports (8 tests)

**Phase 3: UI Features** (30 minutes)
- User Management (6 tests)
- Company Dashboard (5 tests)
- Team Reports (6 tests)
- Master Console (6 tests)

**Total Testing Time**: ~2 hours

### Pass Criteria

**MVP Launch Ready**:
- [x] All Critical Path tests pass (Phase 1)
- [x] At least 90% of Data Access tests pass (Phase 2)
- [x] At least 80% of UI Features tests pass (Phase 3)

**Production Ready**:
- [x] 100% of all tests pass
- [x] No critical bugs found
- [x] Performance acceptable (<2s page loads)

---

## Next Actions

1. **Run Tests**: Execute all 60 tests systematically
2. **Document Results**: Mark each test ✅ Pass or ❌ Fail
3. **Fix Issues**: Address any failing tests
4. **Retest**: Verify fixes work
5. **Sign Off**: Product owner approves for launch

---

**Current Status**: System ready for user acceptance testing (UAT)

**Recommended Tester**: Product owner or designated QA team

**Timeline**: Complete testing within 1-2 business days
