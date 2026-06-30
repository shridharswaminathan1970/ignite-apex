# IGNITE-APEX UAT Test Script - Comprehensive

**Date**: 2026-06-20  
**Tester**: ________________  
**Environment**: Production (https://shaamelz.com)  
**Purpose**: Test complete role hierarchy, CRUD operations, and access controls

---

## Instructions

1. **Execute tests in order** (hierarchy flows top to bottom)
2. **Mark each test**: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL
3. **Record observations** in the Notes column for any failures
4. **Take screenshots** of any errors
5. **Stop and report** if login/routing is broken before continuing

---

## Test Environment Setup

| Component | Status | Notes |
|-----------|--------|-------|
| Database accessible | ⬜ |  |
| Auth working (can login) | ⬜ |  |
| Master Console loads | ⬜ |  |
| CRM loads | ⬜ |  |
| Sales OS loads | ⬜ |  |

---

## SUITE 1: Super Duper Admin (Platform Master)

**Test User**: muhammad.shaamel@gmail.com  
**Expected Role**: super_duper_admin  
**Expected Destination**: /app/master-console.html

---

### Test 1.1: Login & Routing

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to https://shaamelz.com/app/auth.html | Login page loads | ⬜ |  |
| 2 | Enter email: muhammad.shaamel@gmail.com | Email accepted | ⬜ |  |
| 3 | Enter password and click "Sign In" | No errors | ⬜ |  |
| 4 | Wait for redirect | Redirected to /app/master-console.html | ⬜ |  |
| 5 | Check page title | Shows "Master Console" | ⬜ |  |
| 6 | Check user badge | Shows name + "Platform Master" role | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Critical Blocker**: ⬜ Yes (stop testing) | ⬜ No (continue)

---

### Test 1.2: View All Companies

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | In Master Console, go to "Companies & Users" tab | Tab shows | ⬜ |  |
| 2 | Check company dropdown | Shows all companies (or "Loading companies...") | ⬜ |  |
| 3 | Select a company from dropdown | Company loads | ⬜ |  |
| 4 | Check user list | Shows all users in that company | ⬜ |  |
| 5 | Check user details | Each user shows: name, email, role badge, manager | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 1.3: Provision New Company

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "+ Provision New Company" button | Modal opens | ⬜ |  |
| 2 | Fill form: | | | |
|   | Company Name: "Test Corp UAT" | Accepted | ⬜ |  |
|   | Super Admin Email: "testadmin@test.com" | Accepted | ⬜ |  |
|   | Super Admin Name: "Test Admin" | Accepted | ⬜ |  |
| 3 | Click "Create Company & Send Invite" | Success message appears | ⬜ |  |
| 4 | Check result | Shows invite link generated | ⬜ |  |
| 5 | Copy invite link | Link copied to clipboard | ⬜ |  |
| 6 | Check company dropdown | "Test Corp UAT" now appears | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Invite Link** (save for later test): _______________________________________________

---

### Test 1.4: View Pending Registrations

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to "Pending Registrations" tab | Tab shows | ⬜ |  |
| 2 | Check pending requests table | Shows list or "No pending requests" | ⬜ |  |
| 3 | Check columns | Shows: Name, Email, Company, Requested date, Actions | ⬜ |  |
| 4 | If requests exist, check actions | Each has "Approve" and "Reject" buttons | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Number of pending requests**: _______

---

### Test 1.5: Approve Casual Signup (if pending exists)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | If pending request exists, click "Approve" | Confirmation prompt | ⬜ |  |
| 2 | Confirm approval | Success message + invite link shown | ⬜ |  |
| 3 | Check "Pending Registrations" tab | Request removed from list | ⬜ |  |
| 4 | Go to "Companies & Users" tab | | ⬜ |  |
| 5 | Select company "NA" from dropdown | "NA" company exists | ⬜ |  |
| 6 | Check user list | New public user appears with role badge "public" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (no pending)

---

### Test 1.6: Edit Any User (Cross-Company)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Select any company from dropdown | Company loads | ⬜ |  |
| 2 | Click "Edit" on any user | Edit modal opens | ⬜ |  |
| 3 | Change user's name | Name field editable | ⬜ |  |
| 4 | Change user's role | Role dropdown works | ⬜ |  |
| 5 | Click "Save Changes" | Success message | ⬜ |  |
| 6 | Verify change | User list reflects new values | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 1.7: Reset Any User Password

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Reset Password" on any user | Confirmation prompt | ⬜ |  |
| 2 | Confirm | Success message + invite link shown | ⬜ |  |
| 3 | Copy invite link | Link in clipboard | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 1.8: Deactivate User

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Deactivate" on a test user | Confirmation prompt | ⬜ |  |
| 2 | Confirm deactivation | Success message | ⬜ |  |
| 3 | Check user list | User shows "Inactive" badge or disappears | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

## SUITE 2: Super Admin (Company Owner)

**Test User**: testadmin@test.com (from Test 1.3)  
**Expected Role**: super_admin  
**Expected Destination**: /app/company-dashboard.html

---

### Test 2.1: Super Admin First Login (Password Setup)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Open invite link from Test 1.3 in new private/incognito window | set-password.html loads | ⬜ |  |
| 2 | Check pre-activation screen | Shows "Continue to Set Password" button | ⬜ |  |
| 3 | Click "Continue to Set Password" | Password form appears | ⬜ |  |
| 4 | Check welcome message | Shows user name and company name | ⬜ |  |
| 5 | Enter password: "TestPass123!" | Accepted (min 8 chars) | ⬜ |  |
| 6 | Confirm password: "TestPass123!" | Matches | ⬜ |  |
| 7 | Click "Set Password & Continue" | Success message | ⬜ |  |
| 8 | Wait for redirect | Redirected to /app/company-dashboard.html | ⬜ |  |
| 9 | Check page title | Shows "Company Dashboard" | ⬜ |  |
| 10 | Check user role badge | Shows "Company Owner" or "super_admin" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Critical Blocker**: ⬜ Yes (stop Suite 2) | ⬜ No (continue)

---

### Test 2.2: View Company Profile

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | In Company Dashboard, check company profile section | Shows company details | ⬜ |  |
| 2 | Verify company name | Shows "Test Corp UAT" | ⬜ |  |
| 3 | Check total users count | Shows at least 1 (super_admin) | ⬜ |  |
| 4 | Check created date | Shows recent date | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 2.3: Invite Admin (Sales Manager)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Invite User" button | Invite modal opens | ⬜ |  |
| 2 | Fill form: | | | |
|   | Name: "Alice Manager" | Accepted | ⬜ |  |
|   | Email: "alice@test.com" | Accepted | ⬜ |  |
|   | Role: Select "admin" | Dropdown shows admin option | ⬜ |  |
|   | Manager: Leave blank (top-level) | Optional field | ⬜ |  |
|   | CRM Enabled: Check ✓ | Checkbox works | ⬜ |  |
| 3 | Click "Send Invite" | Success message | ⬜ |  |
| 4 | Check result | Shows invite link | ⬜ |  |
| 5 | Copy invite link | Link copied | ⬜ |  |
| 6 | Check user list | Alice appears with role badge "admin" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Alice Invite Link**: _______________________________________________

---

### Test 2.4: Invite Admin_M (Management - Read Only)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Invite User" | Modal opens | ⬜ |  |
| 2 | Fill: Name: "Dave Management" | Accepted | ⬜ |  |
| 3 | Email: "dave@test.com" | Accepted | ⬜ |  |
| 4 | Role: Select "admin_m" | Option available | ⬜ |  |
| 5 | CRM Enabled: Check ✓ | Works | ⬜ |  |
| 6 | Click "Send Invite" | Success | ⬜ |  |
| 7 | Copy invite link | Copied | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Dave Invite Link**: _______________________________________________

---

### Test 2.5: Invite SDR (Team Lead)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Invite User" | Modal opens | ⬜ |  |
| 2 | Name: "Bob TeamLead" | Accepted | ⬜ |  |
| 3 | Email: "bob@test.com" | Accepted | ⬜ |  |
| 4 | Role: Select "sdr" | Option available | ⬜ |  |
| 5 | Manager: Select "Alice Manager" | Alice appears in dropdown | ⬜ |  |
| 6 | CRM Enabled: Check ✓ | Works | ⬜ |  |
| 7 | Send Invite | Success | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Bob Invite Link**: _______________________________________________

---

### Test 2.6: Invite Account Executive

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Invite User | Modal opens | ⬜ |  |
| 2 | Name: "Carol Executive" | Accepted | ⬜ |  |
| 3 | Email: "carol@test.com" | Accepted | ⬜ |  |
| 4 | Role: "account_executive" | Option available | ⬜ |  |
| 5 | Manager: "Alice Manager" | Works | ⬜ |  |
| 6 | CRM Enabled: Check ✓ | Works | ⬜ |  |
| 7 | Send Invite | Success | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Carol Invite Link**: _______________________________________________

---

### Test 2.7: View All Company Users

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Scroll to user list | Shows all users | ⬜ |  |
| 2 | Count users | Should be 5: Test Admin, Alice, Dave, Bob, Carol | ⬜ |  |
| 3 | Check role badges | Each shows correct role with color coding | ⬜ |  |
| 4 | Check manager column | Bob and Carol show "Alice Manager" as manager | ⬜ |  |
| 5 | Check CRM Access | All show "Yes" (crm_enabled=true) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Actual user count**: _______

---

### Test 2.8: Edit User (Promote/Demote)

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Edit" on Carol | Edit modal opens | ⬜ |  |
| 2 | Change role from account_executive to sdr | Dropdown works | ⬜ |  |
| 3 | Save changes | Success | ⬜ |  |
| 4 | Verify | Carol's role badge updates to "sdr" | ⬜ |  |
| 5 | Change back to account_executive | Works | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 2.9: Super Admin Cannot Access Other Companies

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Try to navigate to Master Console (/app/master-console.html) | Access denied or redirected | ⬜ |  |
| 2 | Check navigation menu | No "Master Console" link visible | ⬜ |  |
| 3 | Verify scope | Can only see "Test Corp UAT" users | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

## SUITE 3: Admin_M (Management - Read Only)

**Test User**: dave@test.com  
**Expected Role**: admin_m  
**Expected Destination**: /crm/index.html (if crm_enabled) or /system/index.html

---

### Test 3.1: Admin_M Login & Routing

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Open Dave's invite link in new private window | set-password.html loads | ⬜ |  |
| 2 | Set password (same process as Test 2.1) | Success | ⬜ |  |
| 3 | Wait for redirect | Redirects to /crm/index.html OR /system/index.html | ⬜ |  |
| 4 | Check user role | Shows "admin_m" or "Management" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Destination URL**: _______________________________________________

---

### Test 3.2: Admin_M Can View All Company Data

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | If in CRM, go to Leads view | Shows leads list (if any) | ⬜ |  |
| 2 | Check visibility | Can see ALL company leads (not just own) | ⬜ |  |
| 3 | Go to Dashboard | Shows company-wide metrics | ⬜ |  |
| 4 | Go to Reports | Can view all company reports | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 3.3: Admin_M CANNOT Edit Data

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Try to create new lead | "Create Lead" button disabled or hidden | ⬜ |  |
| 2 | If any lead exists, try to edit | Edit button disabled or shows error | ⬜ |  |
| 3 | Try to delete lead | Delete button disabled or shows error | ⬜ |  |
| 4 | Try to reassign lead | Reassign option not available | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 3.4: Admin_M CANNOT Manage Users

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Look for "Invite User" button | Not visible | ⬜ |  |
| 2 | Try to navigate to user management | No link or access denied | ⬜ |  |
| 3 | Try direct URL to company-dashboard | Redirected or access denied | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 3.5: Admin_M CAN Email Reports

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to Reports | Reports view loads | ⬜ |  |
| 2 | Look for "Email Report" button | Button visible | ⬜ |  |
| 3 | Click "Email Report" | Email dialog opens | ⬜ |  |
| 4 | Send (or cancel) | Works without error | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (no reports yet)

---

## SUITE 4: Admin (Sales Manager)

**Test User**: alice@test.com  
**Expected Role**: admin  
**Expected Destination**: /crm/index.html (if crm_enabled) or /system/index.html

---

### Test 4.1: Admin Login & Routing

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Open Alice's invite link in new private window | set-password.html loads | ⬜ |  |
| 2 | Set password | Success | ⬜ |  |
| 3 | Wait for redirect | Redirects to /crm/index.html | ⬜ |  |
| 4 | Check role | Shows "admin" or "Sales Manager" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 4.2: Admin Can Invite Team Members

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Look for "Invite User" or "Invite Team Member" button | Button visible | ⬜ |  |
| 2 | Click invite | Modal opens | ⬜ |  |
| 3 | Check role options | Can select: sdr, account_executive (NOT admin or admin_m) | ⬜ |  |
| 4 | Invite a new account_executive: | | | |
|   | Name: "Eve Rep" | Accepted | ⬜ |  |
|   | Email: "eve@test.com" | Accepted | ⬜ |  |
|   | Role: account_executive | Works | ⬜ |  |
| 5 | Check manager field | Auto-set to Alice OR disabled (cannot change) | ⬜ |  |
| 6 | Send invite | Success | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Eve Invite Link**: _______________________________________________

---

### Test 4.3: Admin Can View Team

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to Team view or Dashboard | Shows team members | ⬜ |  |
| 2 | Check team list | Shows: Bob (sdr), Carol (account_executive), Eve (account_executive) | ⬜ |  |
| 3 | Verify visibility | Shows ONLY Alice's downline (Bob, Carol, Eve) | ⬜ |  |
| 4 | Check Dave (admin_m) | Dave NOT in team list (not managed by Alice) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Team members visible**: _______

---

### Test 4.4: Admin Can Create Lead for Team

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Create Lead" or "+ New Lead" | Lead form opens | ⬜ |  |
| 2 | Fill lead details: | | | |
|   | Company: "Acme Corp" | Accepted | ⬜ |  |
|   | Contact: "John Doe" | Accepted | ⬜ |  |
|   | Email: "john@acme.com" | Accepted | ⬜ |  |
| 3 | Assign To: dropdown | Shows: Alice (self), Bob, Carol, Eve | ⬜ |  |
| 4 | Select "Bob TeamLead" | Selected | ⬜ |  |
| 5 | Save lead | Success | ⬜ |  |
| 6 | Verify | Lead appears in leads list with owner = Bob | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Lead ID** (note for later): _______________________________________________

---

### Test 4.5: Admin Can Reassign Team Lead

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Find lead created in Test 4.4 (owned by Bob) | Lead visible | ⬜ |  |
| 2 | Click "Edit" or "Reassign" | Edit form opens | ⬜ |  |
| 3 | Change owner from Bob to Carol | Dropdown works | ⬜ |  |
| 4 | Save | Success | ⬜ |  |
| 5 | Verify | Lead now shows owner = Carol | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 4.6: Admin Can Edit Team Member

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to team management view | Shows team list | ⬜ |  |
| 2 | Click "Edit" on Bob | Edit modal opens | ⬜ |  |
| 3 | Change Bob's name | Editable | ⬜ |  |
| 4 | Save | Success | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 4.7: Admin Can Create/Edit Team Reports

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to Reports | Reports view loads | ⬜ |  |
| 2 | Click "Create Report" | Report form opens | ⬜ |  |
| 3 | Select scope: Team (not just self) | Option available | ⬜ |  |
| 4 | Fill report details | Works | ⬜ |  |
| 5 | Save | Success | ⬜ |  |
| 6 | Verify | Report shows team aggregate data | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 4.8: Admin CANNOT See Other Teams

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Check visible leads | Only see Alice's own + her team's leads | ⬜ |  |
| 2 | Try to view Dave's data | Dave's records NOT visible | ⬜ |  |
| 3 | Check dashboard metrics | Only team metrics (not company-wide) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

## SUITE 5: SDR (Team Lead)

**Test User**: bob@test.com  
**Expected Role**: sdr  
**Expected Destination**: /crm/index.html (if crm_enabled) or /system/index.html

---

### Test 5.1: SDR Login & Routing

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Open Bob's invite link in new private window | set-password.html loads | ⬜ |  |
| 2 | Set password | Success | ⬜ |  |
| 3 | Wait for redirect | Redirects to /crm/index.html | ⬜ |  |
| 4 | Check role | Shows "sdr" or "Team Lead" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 5.2: SDR Can View Team

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to Team view or Dashboard | Shows team members | ⬜ |  |
| 2 | Check visible team | Shows: Carol, Eve (Bob's peers/subordinates) | ⬜ |  |
| 3 | Check leads visibility | Can see Carol and Eve's leads | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 5.3: SDR Can Create Own Lead

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Create Lead" | Lead form opens | ⬜ |  |
| 2 | Fill lead details | Accepts input | ⬜ |  |
| 3 | Check "Assign To" field | Pre-filled with Bob (self) OR dropdown shows team | ⬜ |  |
| 4 | Save lead | Success | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 5.4: SDR Can Assign Lead to Team Member ⚠️ (NEW FEATURE)

**Expected**: SDR should be able to assign leads within team  
**Current Status**: May NOT be implemented yet

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Create new lead | Lead form opens | ⬜ |  |
| 2 | Check "Assign To" dropdown | Shows: Bob (self), Carol, Eve | ⬜ |  |
| 3 | Select Carol | Selected | ⬜ |  |
| 4 | Save | Success | ⬜ |  |
| 5 | Verify | Lead owned by Carol | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ NOT IMPLEMENTED

---

### Test 5.5: SDR Can Reassign Existing Team Lead ⚠️ (NEW FEATURE)

**Expected**: SDR should be able to reassign team members' leads  
**Current Status**: May NOT be implemented yet

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Find a lead owned by Carol | Lead visible in list | ⬜ |  |
| 2 | Look for "Reassign" button | Button visible | ⬜ |  |
| 3 | Click "Reassign" | Reassign dialog opens | ⬜ |  |
| 4 | Select new owner: Eve | Dropdown works | ⬜ |  |
| 5 | Confirm | Success | ⬜ |  |
| 6 | Verify | Lead now owned by Eve | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ NOT IMPLEMENTED

---

### Test 5.6: SDR CANNOT Edit Team Member Data

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | View Carol's lead | Lead visible (read access) | ⬜ |  |
| 2 | Try to edit Carol's lead | Edit button disabled OR shows error | ⬜ |  |
| 3 | Try to delete Carol's lead | Delete not allowed | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 5.7: SDR Can Create Team Report ⚠️ (NEW FEATURE)

**Expected**: SDR should create/edit team reports like admin  
**Current Status**: May be READ-ONLY currently

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to Reports | Reports view loads | ⬜ |  |
| 2 | Look for "Create Report" button | Button visible (not disabled) | ⬜ |  |
| 3 | Click "Create Report" | Report form opens | ⬜ |  |
| 4 | Select scope: Team | Option available | ⬜ |  |
| 5 | Save | Success | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ NOT IMPLEMENTED

---

### Test 5.8: SDR CANNOT Manage Users

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Look for "Invite User" button | Not visible | ⬜ |  |
| 2 | Try to edit team member profile | No access or button disabled | ⬜ |  |
| 3 | Try to deactivate user | Not allowed | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

## SUITE 6: Account Executive (Sales Executive)

**Test User**: carol@test.com  
**Expected Role**: account_executive  
**Expected Destination**: /crm/index.html or /system/index.html

---

### Test 6.1: Account Executive Login & Routing

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Open Carol's invite link in new private window | set-password.html loads | ⬜ |  |
| 2 | Set password | Success | ⬜ |  |
| 3 | Wait for redirect | Redirects to /crm/index.html | ⬜ |  |
| 4 | Check role | Shows "account_executive" or "Sales Executive" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 6.2: Account Executive Can Work Own Pipeline

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Create Lead" | Lead form opens | ⬜ |  |
| 2 | Fill lead details | Accepts input | ⬜ |  |
| 3 | Check "Assign To" | Pre-filled with Carol (cannot assign to others) | ⬜ |  |
| 4 | Save | Success | ⬜ |  |
| 5 | View leads list | Shows Carol's own leads only | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 6.3: Account Executive CANNOT See Team

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Check leads list | Shows ONLY Carol's leads | ⬜ |  |
| 2 | Check for team view | No "Team" tab or view | ⬜ |  |
| 3 | Try to view Bob's or Eve's leads | Not visible | ⬜ |  |
| 4 | Check dashboard | Shows only own metrics (not team) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 6.4: Account Executive Can Edit Own Records

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Click "Edit" on own lead | Edit form opens | ⬜ |  |
| 2 | Update lead details | Changes save | ⬜ |  |
| 3 | Close own deal (won or lost) | Status changes | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 6.5: Account Executive Can Create Own Report

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to Reports | Reports view loads | ⬜ |  |
| 2 | Click "Create Report" (if available) | Can create own report | ⬜ |  |
| 3 | Check scope | Only "Self" scope available (not team/company) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (feature may not exist)

---

### Test 6.6: Account Executive CANNOT Reassign Leads

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | View own lead | Lead visible | ⬜ |  |
| 2 | Look for "Reassign" button | Not visible or disabled | ⬜ |  |
| 3 | Try to change owner | Not allowed | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

## SUITE 7: Public User (Free/Casual)

**Test User**: Create via free signup flow  
**Expected Role**: public  
**Expected Destination**: /system/index.html (Sales OS ONLY)

---

### Test 7.1: Free Signup Request

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to https://shaamelz.com | Landing page loads | ⬜ |  |
| 2 | Click "Try Sales OS Free" (primary CTA) | Redirects to /app/register.html | ⬜ |  |
| 3 | Fill registration form: | | | |
|   | Full Name: "Frank Public" | Accepted | ⬜ |  |
|   | Email: "frank@example.com" | Accepted | ⬜ |  |
|   | Company: (leave blank) | Defaults to "NA" | ⬜ |  |
| 4 | Click "Request Access" | Success screen appears | ⬜ |  |
| 5 | Check message | Says "You'll receive invite within 24 hours" | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 7.2: Super Duper Admin Approves Public User

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as muhammad.shaamel@gmail.com | Master Console loads | ⬜ |  |
| 2 | Go to "Pending Registrations" tab | Shows Frank's request | ⬜ |  |
| 3 | Click "Approve" on Frank's request | Confirmation prompt | ⬜ |  |
| 4 | Confirm | Success + invite link shown | ⬜ |  |
| 5 | Copy invite link | Copied | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Frank Invite Link**: _______________________________________________

---

### Test 7.3: Public User Login & Routing

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Open Frank's invite link in new private window | set-password.html loads | ⬜ |  |
| 2 | Set password | Success | ⬜ |  |
| 3 | Wait for redirect | Redirects to /system/index.html (Sales OS) | ⬜ |  |
| 4 | Check destination | NOT /crm/ (CRM should be locked) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Critical**: If redirected to CRM, public user access is BROKEN

---

### Test 7.4: Public User Can Use Sales OS

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | In Sales OS, look for IGNITE diagnostic tools | Available | ⬜ |  |
| 2 | Create test lead | Works | ⬜ |  |
| 3 | Run diagnostic | Works | ⬜ |  |
| 4 | Check data persistence | Data saves (own data only) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 7.5: Public User CRM is LOCKED

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Look for CRM navigation link | Not visible OR shows lock icon | ⬜ |  |
| 2 | Try to navigate to /crm/index.html directly | Redirected to /system/ OR shows lock message | ⬜ |  |
| 3 | Check lock message | Says "Register under company to use CRM" | ⬜ |  |
| 4 | Shows contact email | muhammad.shaamel@gmail.com | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Critical**: If public user can access CRM, this is a MAJOR BUG

---

### Test 7.6: Public User Data Isolation

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Create lead as Frank (public user) | Lead created | ⬜ |  |
| 2 | Login as another public user (if exists) | Different account | ⬜ |  |
| 3 | Check leads list | Cannot see Frank's leads | ⬜ |  |
| 4 | Login as company user (e.g., Alice) | Company account | ⬜ |  |
| 5 | Check leads | Cannot see Frank's public leads | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (no 2nd public user)

---

## SUITE 8: Cross-Role Boundary Tests

**Purpose**: Verify permissions are enforced (users CANNOT do what they shouldn't)

---

### Test 8.1: Lower Role Cannot Access Higher Role Console

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as account_executive (Carol) | CRM loads | ⬜ |  |
| 2 | Try URL: /app/master-console.html | Access denied or redirected | ⬜ |  |
| 3 | Try URL: /app/company-dashboard.html | Access denied or redirected | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 8.2: Read-Only Role Cannot Edit

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as admin_m (Dave) | Loads | ⬜ |  |
| 2 | Try to create lead | Button disabled or shows error | ⬜ |  |
| 3 | Try to edit existing lead | Not allowed | ⬜ |  |
| 4 | Try to delete lead | Not allowed | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 8.3: Team Member Cannot See Other Teams

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as Bob (sdr under Alice) | Loads | ⬜ |  |
| 2 | Create second admin with team (if not exists) | Second team exists | ⬜ |  |
| 3 | Check Bob's visible leads | Only see Alice's team (Bob, Carol, Eve) | ⬜ |  |
| 4 | Verify cannot see other team's data | Isolated | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (no 2nd team)

---

### Test 8.4: User Cannot Escalate Own Privileges

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as account_executive | Loads | ⬜ |  |
| 2 | Try to edit own user profile | Can change name/email but NOT role | ⬜ |  |
| 3 | Try API call to change own role (if possible) | Rejected | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (cannot test API)

---

## SUITE 9: Password & Auth Tests

---

### Test 9.1: Forgot Password Flow

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Go to /app/auth.html | Login page loads | ⬜ |  |
| 2 | Click "Forgot password?" | Forgot password view shows | ⬜ |  |
| 3 | Enter email of existing user | Accepted | ⬜ |  |
| 4 | Click "Send Reset Link" | Success message | ⬜ |  |
| 5 | Check email (or copy link from logs) | Reset link received | ⬜ |  |
| 6 | Click reset link | set-password.html loads | ⬜ |  |
| 7 | Enter new password | Works | ⬜ |  |
| 8 | Submit | Success + redirected | ⬜ |  |
| 9 | Try logging in with new password | Works | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL

---

### Test 9.2: Expired/Used Invite Link

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Get an old invite link (already used) | Link copied | ⬜ |  |
| 2 | Open link in new private window | set-password.html loads | ⬜ |  |
| 3 | Click "Continue to Set Password" | Shows error: "Link expired or already used" | ⬜ |  |
| 4 | Check for recovery option | Shows "Request New Link" button | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL | ⬜ SKIP (no expired link)

---

### Test 9.3: Session Persistence

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as any user | Logged in | ⬜ |  |
| 2 | Close browser tab | Tab closed | ⬜ |  |
| 3 | Reopen https://shaamelz.com | Landing page | ⬜ |  |
| 4 | Try to access /app/launcher.html | Redirects to auth (session expired) OR shows launcher (session persisted) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Session persisted?**: ⬜ Yes | ⬜ No

---

### Test 9.4: No Redirect Loop

| Step | Action | Expected Result | Status | Notes |
|------|--------|-----------------|--------|-------|
| 1 | Login as any user | Logged in successfully | ⬜ |  |
| 2 | Watch for flickering/looping | No loop between auth.html and launcher.html | ⬜ |  |
| 3 | Lands on correct destination | Based on role (see Suite tests) | ⬜ |  |

**Result**: ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Critical**: If loop exists, login is BROKEN

---

## Test Summary

### Overall Results

| Suite | Pass | Fail | Partial | Skip | Blocker |
|-------|------|------|---------|------|---------|
| 1. Super Duper Admin | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 2. Super Admin | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3. Admin_M | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4. Admin | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 5. SDR | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6. Account Executive | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7. Public User | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 8. Boundary Tests | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 9. Auth Tests | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Critical Issues Found

**Priority 1 (Blockers - Stop all testing)**:
1. _______________________________________________
2. _______________________________________________

**Priority 2 (Major - Role broken)**:
1. _______________________________________________
2. _______________________________________________

**Priority 3 (Minor - Feature missing/wrong)**:
1. _______________________________________________
2. _______________________________________________

---

## Known Issues (Expected to Fail)

Based on SDR_TEAM_LEAD_IMPLEMENTATION.md, these features are **NOT YET IMPLEMENTED**:

1. ⚠️ Test 5.4: SDR assign lead to team member - **NOT IMPLEMENTED**
2. ⚠️ Test 5.5: SDR reassign existing team lead - **NOT IMPLEMENTED**
3. ⚠️ Test 5.7: SDR create team report - **MAY BE READ-ONLY**

**Expected Result**: These should FAIL or SKIP. This is NORMAL and documented.

---

## Next Steps After Testing

1. **Compile results** - Fill all ⬜ checkboxes
2. **Screenshot errors** - Capture any error messages
3. **Share this document** - Send completed test script back
4. **Priority fixes** - Start with P1 blockers, then P2, then P3
5. **Implement missing features** - Work through SDR_TEAM_LEAD_IMPLEMENTATION.md

---

**Test Completed By**: ________________  
**Date**: ________________  
**Time Taken**: ________ hours

**Signature**: _______________________________________________

---

**End of UAT Test Script**
