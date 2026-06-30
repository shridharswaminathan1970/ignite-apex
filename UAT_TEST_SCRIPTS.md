# IGNITE-APEX UAT Test Scripts

**Version**: 2.0 (Based on ACCESS_SPEC.md §8, §9.2)  
**Date**: 2026-06-15  
**Total Scripts**: 12 test scenarios  
**Estimated Time**: 2-3 hours

---

## Prerequisites

### Test Accounts Needed

```
✅ Existing Accounts:
- Platform Master: muhammad.shaamel@gmail.com
- Company Admin: reenusha19 (super_admin)
- Read-Only Manager: shaamel1970@gmail.com (admin_m)
- SDR: huntjobsdown4shaamel@gmail.com

🆕 Create During Testing:
- Casual/Public user (will create in Test 1)
- Admin user (will create in Test 5)
- Account Executive (will create in Test 5)
```

### Browser Setup
- Use **Chrome or Edge** (incognito windows for different users)
- Open **Developer Console** (F12) to see errors
- Have **email access** for invite links
- Have **pen and paper** or spreadsheet to track results

### Result Tracking Template

```
TEST #: [Script Number]
TITLE: [Test Name]
RESULT: [ ] PASS  [ ] FAIL  [ ] BLOCKED
NOTES: [Any issues or observations]
TIME: [How long it took]
```

---

## TEST SUITE 1: Casual / Public User Flow (§9.2)

### Test 1.1: Self-Service Sign-Up (NEW - Critical)

**Purpose**: Verify casual users can self-register and land in Sales OS

**Steps**:
1. Open https://shaamelz.com in **incognito window**
2. Click "Sign Up" (or equivalent registration link)
3. Enter:
   - Email: `casual-test-{timestamp}@example.com` (use unique email)
   - Password: `TestPass123!`
   - Confirm password
4. Click "Sign Up" or "Create Account"
5. Check your email inbox
6. Open set-password email from Supabase
7. Click link → set password (if not already set)
8. You should be auto-logged in

**Expected Results**:
- ✅ Registration succeeds (no errors)
- ✅ Email received from Supabase (auto-sent)
- ✅ After login, lands on `/system/index.html` (Sales OS)
- ✅ Can see Sales OS interface
- ✅ CRM button/card is **disabled/locked**
- ✅ Clicking CRM shows popup: "You need to register under a company to use the CRM. To request access, email platform admin muhammad.shaamel@gmail.com."

**Verify in Database** (optional):
```sql
SELECT id, email, role, org_id, crm_enabled, account_type 
FROM public.users 
WHERE email = 'casual-test-{timestamp}@example.com';

-- Expected:
-- role = 'public'
-- crm_enabled = false
-- org_id = [NA company UUID]
-- account_type = 'casual'
```

**Result**: [ ] PASS  [ ] FAIL

---

### Test 1.2: Casual User Data Isolation

**Purpose**: Verify casual users cannot see each other's data

**Setup**: 
- Create 2 casual users: User A and User B (follow Test 1.1 twice)

**Steps**:

**As User A**:
1. Login as User A
2. Navigate to Sales OS → Leads
3. Create a lead: "User A Test Lead"
4. Note the lead ID or name
5. Logout

**As User B**:
1. Login as User B
2. Navigate to Sales OS → Leads
3. Look for "User A Test Lead"

**Expected Results**:
- ✅ User B cannot see User A's lead
- ✅ User B sees only their own leads (or empty list)
- ✅ RLS isolates data despite both being in NA org

**Result**: [ ] PASS  [ ] FAIL

---

### Test 1.3: Platform Master Signup Notification (NEW)

**Purpose**: Verify master receives notification when casual user signs up

**Steps**:
1. Create new casual user (follow Test 1.1)
2. Check muhammad.shaamel@gmail.com inbox
3. Look for "New User Signup" or similar notification

**Expected Results**:
- ✅ Email received at muhammad.shaamel@gmail.com
- ✅ Contains: user email, company (NA), timestamp
- ✅ Does NOT contain password (passwords are hashed)

**If Email Not Received**:
- Check spam folder
- Verify SMTP configured in Supabase
- Check Edge Function logs (may need implementation)

**Result**: [ ] PASS  [ ] FAIL  [ ] NOT IMPLEMENTED YET

---

## TEST SUITE 2: Two-Lens Model (§8)

### Test 2.1: Sales OS and CRM Share Same Data

**Purpose**: Verify both apps read/write the same records (not separate datasets)

**Setup**: Use a company user with `crm_enabled = true` (e.g., reenusha19)

**Steps**:

**In Sales OS**:
1. Login as reenusha19
2. Navigate to `/system/index.html` (Sales OS)
3. Create a lead: "Two-Lens Test Lead"
4. Fill details: Company = "Test Co", Status = "New"
5. Save
6. Note the lead ID or unique identifier

**In CRM**:
1. (Same browser session, still logged in as reenusha19)
2. Navigate to `/crm/index.html` (CRM)
3. Go to Leads section
4. Look for "Two-Lens Test Lead"

**Expected Results**:
- ✅ Lead created in Sales OS appears in CRM immediately
- ✅ Same lead ID in both places
- ✅ All details match (company, status, owner)
- ✅ No duplication (not 2 separate leads)

**Reverse Test**:
1. In CRM, edit "Two-Lens Test Lead" → change company to "Test Co Updated"
2. Save
3. Navigate back to Sales OS → Leads
4. Find same lead
5. ✅ Company name is "Test Co Updated" (change reflected)

**Result**: [ ] PASS  [ ] FAIL

---

### Test 2.2: crm_enabled Controls Lens Access (Not Data)

**Purpose**: Verify crm_enabled is an access flag, not data separation

**Setup**: 
- User with `crm_enabled = false` (casual user or set via database)
- Same user after flipping `crm_enabled = true`

**Steps**:

**Phase 1: crm_enabled = false**:
1. Login as casual user (from Test 1.1)
2. Create lead in Sales OS: "Casual User Lead"
3. Try to access `/crm/index.html` directly (type URL)

**Expected**:
- ✅ CRM access denied or button disabled
- ✅ Lead exists in database (check via SQL if possible)

**Phase 2: Upgrade to Company (simulate)**:
1. Have admin (reenusha19) invite the casual user's email to their company
2. Or manually update in database:
   ```sql
   UPDATE public.users 
   SET crm_enabled = true, 
       org_id = [reenusha19's org_id],
       role = 'account_executive'
   WHERE email = 'casual-test-{timestamp}@example.com';
   ```
3. Logout and login as that user
4. Navigate to `/crm/index.html`

**Expected**:
- ✅ CRM now accessible
- ✅ "Casual User Lead" is visible in CRM (same record, not migrated)
- ✅ No data was copied/moved - just access granted

**Result**: [ ] PASS  [ ] FAIL

---

## TEST SUITE 3: Role-Based Data Access (§3, §4)

### Test 3.1: SDR - Own Records CRUD, Team Read-Only

**Purpose**: Verify SDR can write own, read team, but not edit team

**Setup**: 
- SDR user: huntjobsdown4shaamel@gmail.com
- Admin user who manages SDR (create if needed)

**Steps**:

**Part A: Create Own Lead**:
1. Login as SDR (huntjobsdown4shaamel@gmail.com)
2. Navigate to CRM → Leads
3. Click "Add Lead"
4. Enter: Name = "SDR Own Lead", Company = "SDR Test"
5. Save
6. ✅ Lead created successfully

**Part B: Edit Own Lead**:
1. Find "SDR Own Lead"
2. Click "Edit"
3. Change company to "SDR Test Updated"
4. Save
5. ✅ Update succeeds

**Part C: Delete Own Lead**:
1. Find "SDR Own Lead"
2. Click "Delete"
3. Confirm
4. ✅ Delete succeeds

**Part D: Read Team Lead**:
1. Have admin create a lead (admin owns it)
2. As SDR, refresh leads list
3. ✅ Can see admin's lead (via app_manages)

**Part E: Cannot Edit Team Lead**:
1. Find admin's lead
2. Try to click "Edit"
3. ✅ Edit button disabled OR
4. Try to edit (if button visible)
5. ✅ Update fails with permission error

**Result**: [ ] PASS  [ ] FAIL

---

### Test 3.2: admin_m - Company-Wide Read-Only

**Purpose**: Verify admin_m sees everything but edits nothing

**Setup**: admin_m user: shaamel1970@gmail.com

**Steps**:

**Part A: View Company-Wide Data**:
1. Login as admin_m (shaamel1970@gmail.com)
2. Navigate to CRM → Leads
3. ✅ Can see all company leads (not just own)
4. Count leads visible

**Part B: Cannot Edit Any Lead**:
1. Find any lead (own or others')
2. Try to edit
3. ✅ Edit button disabled OR update fails

**Part C: Cannot Create Lead**:
1. Try to click "Add Lead"
2. ✅ Button hidden OR create fails

**Part D: Cannot Delete Lead**:
1. Try to delete any lead
2. ✅ Delete button hidden OR delete fails

**Part E: Can View Reports**:
1. Navigate to Team Reports
2. ✅ Can see reports
3. ✅ Can filter by team member

**Part F: Cannot Edit Reports**:
1. Try to create/edit report
2. ✅ Edit buttons hidden OR update fails

**Result**: [ ] PASS  [ ] FAIL

---

### Test 3.3: Account Executive - Own Data Only

**Purpose**: Verify AE sees and edits only own records

**Setup**: Account Executive user (create in Test 5 if needed)

**Steps**:

**Part A: Can Create Own Lead**:
1. Login as AE
2. Create lead: "AE Own Lead"
3. ✅ Create succeeds

**Part B: Can Edit Own Lead**:
1. Edit "AE Own Lead"
2. ✅ Update succeeds

**Part C: Cannot See Others' Leads**:
1. Have admin create a lead (admin owns)
2. As AE, check leads list
3. ✅ Admin's lead NOT visible
4. ✅ See only own leads

**Part D: Cannot See Team (Unlike SDR)**:
1. Have SDR create a lead
2. As AE, check leads
3. ✅ SDR's lead NOT visible
4. **Difference from SDR**: AE has no team visibility

**Result**: [ ] PASS  [ ] FAIL

---

## TEST SUITE 4: User Management & Invites (§5, §6)

### Test 4.1: Company Provisioning (Platform Master)

**Purpose**: Verify super_duper_admin can provision companies

**Steps**:
1. Login as muhammad.shaamel@gmail.com (platform master)
2. Navigate to Master Console or `/app/admin.html`
3. Click "Provision New Company"
4. Enter:
   - Company name: "UAT Test Company"
   - Address: "123 Test St"
   - Contact email: "contact@uattest.com"
   - Contact phone: "555-1234"
   - Super admin name: "UAT Admin"
   - Super admin email: `uat-admin-{timestamp}@example.com`
5. Click "Provision"

**Expected Results**:
- ✅ Success message shows
- ✅ Invite link displays
- ✅ Copy button works
- ✅ Company appears in master console dropdown

**Test Invite Link**:
1. Copy invite link
2. Open in incognito window
3. ✅ Shows pre-activation screen
4. Click "Continue to Set Password"
5. Set password
6. ✅ User lands as super_admin (NOT public)
7. ✅ Company Dashboard shows "UAT Test Company"

**Result**: [ ] PASS  [ ] FAIL

---

### Test 4.2: Team Member Invitation (Inherits org_id)

**Purpose**: Verify invited users automatically get company's org_id

**Steps**:
1. Login as reenusha19 (super_admin)
2. Company Dashboard → "Add Team Member"
3. Enter:
   - Name: "Test SDR"
   - Email: `test-sdr-{timestamp}@example.com`
   - Role: sdr
   - Manager: (select self)
   - CRM Enabled: Yes
4. Click "Send Invitation"
5. Copy invite link
6. Open in incognito
7. Set password
8. Login

**Expected Results**:
- ✅ Invite link generated
- ✅ User can set password
- ✅ User lands in CRM (crm_enabled = true)

**Verify Inheritance** (check database):
```sql
SELECT id, email, role, org_id, manager_id, crm_enabled
FROM public.users 
WHERE email = 'test-sdr-{timestamp}@example.com';

-- Expected:
-- org_id = [same as reenusha19's org_id]
-- manager_id = [reenusha19's user ID]
-- crm_enabled = true
-- role = 'sdr'
```

**Result**: [ ] PASS  [ ] FAIL

---

### Test 4.3: Duplicate Email Error Handling

**Purpose**: Verify clear error when inviting existing email

**Steps**:
1. Login as reenusha19
2. Company Dashboard → "Add Team Member"
3. Enter email: **shaamel1970@gmail.com** (already exists)
4. Click "Send Invitation"

**Expected Results**:
- ✅ Error message shows
- ✅ Message says: "User with email ... already exists in the system..."
- ✅ Message is clear and actionable
- ✅ NO invite link generated
- ✅ Can try again with different email

**Wrong Error (Old Bug)**:
- ❌ "such an email doesn't exist" (confusing)
- ❌ Cryptic error from Supabase

**Result**: [ ] PASS  [ ] FAIL

---

### Test 4.4: Invite Link Email Scanner Protection

**Purpose**: Verify email scanners don't consume tokens

**Steps**:
1. Generate invite link (from Test 4.2)
2. **Before opening in browser**, run:
   ```bash
   curl -I "https://shaamelz.com/app/set-password.html?code=PASTE_CODE_HERE"
   # Replace with actual code from invite link
   ```
3. Verify curl returns 200 OK
4. **Now** open same link in browser (incognito)

**Expected Results**:
- ✅ curl returns 200 (scanner simulated)
- ✅ Browser shows "Continue to Set Password" button (token NOT consumed)
- ✅ Click button → password form shows
- ✅ Can complete password setup
- ❌ FAIL if: shows "expired" immediately after curl

**Result**: [ ] PASS  [ ] FAIL

---

## TEST SUITE 5: Login & Routing (§9)

### Test 5.1: Role-Based Routing (All Roles)

**Purpose**: Verify each role lands on correct page after login

**Test Matrix**:

| User | Role | crm_enabled | Expected Landing Page | Test |
|------|------|-------------|----------------------|------|
| muhammad.shaamel@gmail.com | super_duper_admin | N/A | `/app/master-console.html` | [ ] |
| reenusha19 | super_admin | N/A | `/app/company-dashboard.html` | [ ] |
| [admin user] | admin | true | `/crm/index.html` | [ ] |
| [admin user] | admin | false | `/system/index.html` | [ ] |
| shaamel1970@gmail.com | admin_m | true | `/crm/index.html` | [ ] |
| huntjobsdown4shaamel@gmail.com | sdr | true | `/crm/index.html` | [ ] |
| [AE user] | account_executive | true | `/crm/index.html` | [ ] |
| [AE user] | account_executive | false | `/system/index.html` | [ ] |
| [casual user] | public | false | `/system/index.html` | [ ] |

**Steps for Each**:
1. Login as user
2. Observe landing page URL (check address bar)
3. ✅ Matches expected landing page
4. ✅ No redirect loops (page settles on one URL)

**Result**: [ ] PASS  [ ] FAIL

---

### Test 5.2: No Redirect Loops

**Purpose**: Verify no infinite redirects after login

**Steps**:
1. Login as each role (from Test 5.1)
2. Watch for page flickering or rapid redirects
3. Check browser console for redirect errors

**Expected**:
- ✅ Lands on one page and stays
- ✅ No console errors about max redirects
- ✅ No flickering between pages

**If Redirect Loop Detected**:
- Note which role triggers it
- Check launcher.html routing logic
- Verify profile fully loaded before redirect

**Result**: [ ] PASS  [ ] FAIL

---

### Test 5.3: Session Persistence

**Purpose**: Verify session survives page refresh

**Steps**:
1. Login as any user
2. Navigate to workspace
3. Press F5 (refresh page)
4. ✅ Still logged in (no redirect to login)
5. Navigate to different page (e.g., reports)
6. Press F5 again
7. ✅ Still logged in

**Test Across Tabs**:
1. Login in Tab 1
2. Open new tab → navigate to https://shaamelz.com/crm/index.html
3. ✅ Already logged in (session shared)

**Result**: [ ] PASS  [ ] FAIL

---

## TEST SUITE 6: Diagnostic-Gated Pipeline (§8) - Placeholder

### Test 6.1: Stage Move Blocked Without Diagnostic (Future)

**Purpose**: Verify diagnostic gates block stage progression

**Status**: ⏭️ NOT IMPLEMENTED YET

**When Implemented, Test**:
1. Create lead
2. Try to convert to opportunity without IGNITE diagnostic
3. ✅ Blocked with message: "Complete IGNITE diagnostic first"
4. Complete IGNITE diagnostic (pass threshold)
5. Try to convert again
6. ✅ Conversion succeeds

**Result**: [ ] NOT IMPLEMENTED  [ ] PASS  [ ] FAIL

---

## TEST SUITE 7: Cross-Company Isolation (§11)

### Test 7.1: Company A Cannot See Company B Data

**Purpose**: Verify multi-tenant isolation

**Setup**:
- Company A: reenusha19's company
- Company B: Create new company (Test 4.1) or use existing

**Steps**:

**As Company A User** (reenusha19):
1. Login
2. Create lead: "Company A Lead"
3. Note company name in header/profile
4. Logout

**As Company B User** (new company super_admin):
1. Login
2. Navigate to leads
3. Look for "Company A Lead"

**Expected**:
- ✅ Cannot see Company A's lead
- ✅ See only Company B data
- ✅ Company name in header = Company B

**Reverse Test**:
1. Company B creates lead
2. Company A user logs in
3. ✅ Cannot see Company B's lead

**Result**: [ ] PASS  [ ] FAIL

---

## SUMMARY CHECKLIST

After completing all tests, fill this out:

### Critical Tests (Must Pass)
- [ ] Test 1.1: Casual sign-up works
- [ ] Test 1.2: Casual users isolated
- [ ] Test 2.1: Two-lens same data
- [ ] Test 3.1: SDR own-CRUD + team-read
- [ ] Test 3.2: admin_m read-only
- [ ] Test 4.2: Invite inherits org_id
- [ ] Test 5.1: Role-based routing
- [ ] Test 5.2: No redirect loops
- [ ] Test 7.1: Cross-company isolation

### Medium Priority
- [ ] Test 1.3: Master signup notification
- [ ] Test 2.2: crm_enabled as flag
- [ ] Test 3.3: AE own-data only
- [ ] Test 4.1: Company provisioning
- [ ] Test 4.3: Duplicate email error
- [ ] Test 4.4: Email scanner protection
- [ ] Test 5.3: Session persistence

### Future / Not Blocking
- [ ] Test 6.1: Diagnostic gates (not implemented)

### Test Results Summary

```
Total Tests Run: _____ / 17
Passed: _____
Failed: _____
Blocked: _____
Not Implemented: _____

Pass Rate: _____%

CRITICAL ISSUES (blocking launch):
1. 
2. 

MINOR ISSUES (fix soon):
1. 
2. 

READY FOR LAUNCH: YES / NO
```

---

## Tips for Efficient Testing

### Use Multiple Browsers/Profiles
- Browser 1 (regular): Platform master
- Browser 2 (incognito 1): Company admin
- Browser 3 (incognito 2): SDR or casual user

### Take Screenshots
- Capture failures with error messages
- Screenshot success states for documentation

### Track in Spreadsheet
```
| Test | Title | Expected | Actual | Pass/Fail | Notes | Time |
|------|-------|----------|--------|-----------|-------|------|
| 1.1  | Casual signup | Lands in Sales OS | ... | PASS | ... | 5min |
```

### Stop on Critical Failures
- If Test 1.1, 2.1, 5.1, or 5.2 fail → stop and report
- These indicate fundamental issues
- Other tests may be unreliable until fixed

---

## Quick Start (30-Minute Smoke Test)

If short on time, run only these:

1. **Test 1.1**: Casual sign-up (5 min)
2. **Test 2.1**: Two-lens same data (5 min)
3. **Test 3.1**: SDR permissions (10 min)
4. **Test 5.1**: Role routing (5 min)
5. **Test 7.1**: Company isolation (5 min)

**Total: 30 minutes, covers critical paths**

---

**Ready to start?** Begin with Test 1.1 (Casual Sign-Up) and work through sequentially. Good luck! 🚀
