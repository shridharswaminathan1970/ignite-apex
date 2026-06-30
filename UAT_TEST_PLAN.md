# IGNITE_APEX - UAT Test Plan
**Date:** 2026-07-01  
**Version:** 1.0  
**Tester:** Shridhar Swaminathan  
**Environment:** Production - https://shaamelz.com

---

## Test Execution Instructions

1. **Test each section sequentially**
2. **Mark results:** ✅ PASS | ❌ FAIL | ⚠️ PARTIAL
3. **Document bugs** in "Bugs Found" section at bottom
4. **Use these test accounts:**
   - Super Duper Admin: `muhammad.shaamel@gmail.com` or `shaamel@shaamelz.com`
   - Create test users for other roles during testing

---

## 🔐 Section 1: Authentication & Access Control

### 1.1 Login Flow
- [ ] **TC-001:** Login with valid super_duper_admin credentials → redirects to launcher
- [ ] **TC-002:** Login with invalid password → shows error message
- [ ] **TC-003:** Login with non-existent email → shows error message
- [ ] **TC-004:** Password reset link generation works
- [ ] **TC-005:** Password reset email arrives at shaamel@shaamelz.com
- [ ] **TC-006:** Password reset link successfully changes password

### 1.2 Role-Based Access
- [ ] **TC-007:** super_duper_admin can access master-console.html
- [ ] **TC-008:** super_duper_admin can access teams.html
- [ ] **TC-009:** super_admin cannot access master-console.html (should be blocked)
- [ ] **TC-010:** admin cannot access master-console.html (should be blocked)
- [ ] **TC-011:** SDR can access CRM after trial activated
- [ ] **TC-012:** SDR redirected to Sales OS if CRM locked

---

## 👥 Section 2: User Management

### 2.1 Add User
- [ ] **TC-013:** Click "+ Add User" button in master-console
- [ ] **TC-014:** Fill form: name, email, role=SDR, select team, select manager
- [ ] **TC-015:** Submit → user created successfully
- [ ] **TC-016:** Email notification sent to shaamel@shaamelz.com with user details
- [ ] **TC-017:** Email contains: user ID, company, team, team leader, password reset URL
- [ ] **TC-018:** New user can login with reset link and set password

### 2.2 Edit User
- [ ] **TC-019:** Click "Edit" on any user
- [ ] **TC-020:** Change name → saves successfully
- [ ] **TC-021:** User list refreshes with new name

### 2.3 Transfer User
- [ ] **TC-022:** Click "Transfer" on any user
- [ ] **TC-023:** Modal shows dropdown for teams
- [ ] **TC-024:** Modal shows dropdown for managers
- [ ] **TC-025:** If no teams exist, "NEW" team auto-created
- [ ] **TC-026:** Select team and manager → transfer succeeds
- [ ] **TC-027:** User's team and manager updated in database

### 2.4 Change Role
- [ ] **TC-028:** Click "Change Role" on SDR user
- [ ] **TC-029:** Modal shows role cards with descriptions
- [ ] **TC-030:** super_duper_admin sees all roles (including super_admin)
- [ ] **TC-031:** super_admin cannot see super_duper_admin or super_admin roles
- [ ] **TC-032:** admin can only see SDR and Account Executive roles
- [ ] **TC-033:** Select new role → role changes successfully
- [ ] **TC-034:** User badge updates to reflect new role

### 2.5 Suspend/Reactivate
- [ ] **TC-035:** Click "Suspend" on active user
- [ ] **TC-036:** User status changes to "⏸️ Suspended"
- [ ] **TC-037:** Suspended user cannot login
- [ ] **TC-038:** Click "Reactivate" on suspended user
- [ ] **TC-039:** User status changes to "🟢 Active"
- [ ] **TC-040:** Reactivated user can login successfully

### 2.6 Deactivate
- [ ] **TC-041:** Click "Deactivate" on active user
- [ ] **TC-042:** User status changes to "🔴 Deactivated"
- [ ] **TC-043:** Deactivated user cannot login

### 2.7 Delete User
- [ ] **TC-044:** Click "Delete" on test user
- [ ] **TC-045:** Confirmation dialog appears
- [ ] **TC-046:** User deleted from database
- [ ] **TC-047:** User removed from user list
- [ ] **TC-048:** Deleted user cannot login

### 2.8 Reset Password
- [ ] **TC-049:** Click "Reset Password" on user
- [ ] **TC-050:** Confirmation dialog appears
- [ ] **TC-051:** Email sent to shaamel@shaamelz.com with reset link
- [ ] **TC-052:** Email shows which user the reset is for
- [ ] **TC-053:** Reset link works when user clicks it

---

## 👨‍👩‍👧‍👦 Section 3: Team Management

### 3.1 View Teams
- [ ] **TC-054:** Navigate to https://shaamelz.com/app/teams.html
- [ ] **TC-055:** All teams for current org displayed
- [ ] **TC-056:** Each card shows: team name, leader, member count

### 3.2 Create Team
- [ ] **TC-057:** Click "+ Create Team" button
- [ ] **TC-058:** Enter team name "UAT Test Team"
- [ ] **TC-059:** Team created successfully
- [ ] **TC-060:** New team appears in grid

### 3.3 Rename Team
- [ ] **TC-061:** Click "Rename" on a team
- [ ] **TC-062:** Enter new name "Renamed Test Team"
- [ ] **TC-063:** Team name updates successfully
- [ ] **TC-064:** Grid refreshes with new name

### 3.4 Assign Team Leader
- [ ] **TC-065:** Click "Assign Leader" on a team
- [ ] **TC-066:** Modal shows eligible leaders (super_admin/admin only)
- [ ] **TC-067:** Select leader from dropdown
- [ ] **TC-068:** Leader assigned successfully
- [ ] **TC-069:** Team card shows leader name

### 3.5 View Team Members
- [ ] **TC-070:** Click "View Members" on a team
- [ ] **TC-071:** Modal shows table of all members
- [ ] **TC-072:** Table displays: name, email, role
- [ ] **TC-073:** Close modal works

### 3.6 Delete Team
- [ ] **TC-074:** Try to delete team with members → blocked with error
- [ ] **TC-075:** Transfer all members to another team
- [ ] **TC-076:** Delete empty team → succeeds
- [ ] **TC-077:** Team removed from grid

---

## 📝 Section 4: Registration & Approval

### 4.1 Public Registration
- [ ] **TC-078:** Navigate to https://shaamelz.com/app/register.html
- [ ] **TC-079:** Fill form: name, email, phone, country, company
- [ ] **TC-080:** Submit → "Request Submitted!" message appears
- [ ] **TC-081:** Request appears in database (registration_requests table)

### 4.2 Approval Workflow
- [ ] **TC-082:** Login as super_duper_admin
- [ ] **TC-083:** Go to master-console → "Pending Registrations" tab
- [ ] **TC-084:** New registration appears in list
- [ ] **TC-085:** Click "Approve" → confirmation dialog
- [ ] **TC-086:** Approve → user created in system
- [ ] **TC-087:** Email sent to shaamel@shaamelz.com with setup link
- [ ] **TC-088:** Setup link works for new user

### 4.3 Rejection Workflow
- [ ] **TC-089:** Submit another test registration
- [ ] **TC-090:** Click "Reject" on registration
- [ ] **TC-091:** Enter rejection reason
- [ ] **TC-092:** Status updated to "rejected"
- [ ] **TC-093:** No user account created

---

## 🚀 Section 5: Launcher & Navigation

### 5.1 Launcher Access
- [ ] **TC-094:** Login as super_duper_admin → launcher loads
- [ ] **TC-095:** Login as SDR → launcher loads
- [ ] **TC-096:** Launcher shows: Sales OS, CRM, B2B0 Outreach cards

### 5.2 Feature Gates
- [ ] **TC-097:** User with crm_enabled=true sees CRM unlocked
- [ ] **TC-098:** User with crm_enabled=false sees CRM locked (🔒)
- [ ] **TC-099:** Click unlocked CRM card → navigates to CRM
- [ ] **TC-100:** Click locked CRM card → does nothing (blocked)
- [ ] **TC-101:** Sales OS always accessible (FREE module)
- [ ] **TC-102:** B2B0 locked unless b2b0_enabled=true

### 5.3 Navigation Links
- [ ] **TC-103:** "Back to Launcher" link works from all pages
- [ ] **TC-104:** "Sign Out" button logs user out
- [ ] **TC-105:** After logout, redirected to auth.html
- [ ] **TC-106:** Cannot access protected pages without login

---

## 📊 Section 6: CRM Functionality

### 6.1 Leads Module
- [ ] **TC-107:** Navigate to CRM → Leads section
- [ ] **TC-108:** Create new lead with: name, company, email, phone
- [ ] **TC-109:** Lead appears in leads list
- [ ] **TC-110:** Edit lead details → saves successfully
- [ ] **TC-111:** Convert lead to opportunity
- [ ] **TC-112:** Delete lead → removed from list

### 6.2 Opportunities Module
- [ ] **TC-113:** Navigate to Opportunities
- [ ] **TC-114:** Create new opportunity with: name, value, close date, stage
- [ ] **TC-115:** Opportunity appears in pipeline
- [ ] **TC-116:** Drag opportunity to different stage → stage updates
- [ ] **TC-117:** Edit opportunity details
- [ ] **TC-118:** Mark opportunity as "Closed Won"
- [ ] **TC-119:** Mark opportunity as "Closed Lost"

### 6.3 Accounts & Contacts
- [ ] **TC-120:** Create new account (company)
- [ ] **TC-121:** Add contact to account
- [ ] **TC-122:** View account details page
- [ ] **TC-123:** View contact details page
- [ ] **TC-124:** Link opportunity to account

### 6.4 Activities & Tasks
- [ ] **TC-125:** Create new task with due date
- [ ] **TC-126:** Task appears in task list
- [ ] **TC-127:** Mark task as complete
- [ ] **TC-128:** Log call activity
- [ ] **TC-129:** Log meeting activity
- [ ] **TC-130:** View activity history

---

## 🎯 Section 7: Sales OS / IGNITE Framework

### 7.1 IGNITE Entry Gate
- [ ] **TC-131:** Navigate to Sales OS → IGNITE Entry Gate
- [ ] **TC-132:** Fill 4U Framework: Unworkable, Urgent, Unavoidable, Underserved
- [ ] **TC-133:** Complete "Peel the Onion" for all 4 U's (3 layers each)
- [ ] **TC-134:** Fill JTBD (Jobs To Be Done) 6 fields
- [ ] **TC-135:** Answer 6 IGNITE diagnostics (I-G-N-I-T-E)
- [ ] **TC-136:** Score ≥4/6 → "PASS" qualification
- [ ] **TC-137:** Score <4/6 → "FAIL" qualification
- [ ] **TC-138:** Save qualification → data persists

### 7.2 APEX Stages
- [ ] **TC-139:** Navigate through 6 APEX stages
- [ ] **TC-140:** Qualification (10%) → gates enforced
- [ ] **TC-141:** Discovery (30%) → questions displayed
- [ ] **TC-142:** Demo (50%) → gate checks work
- [ ] **TC-143:** Proposal (70%) → MEDDPICC framework shown
- [ ] **TC-144:** Negotiation (90%)
- [ ] **TC-145:** Closed Won (100%)

### 7.3 CEMENT Post-Sale
- [ ] **TC-146:** Navigate to CEMENT framework
- [ ] **TC-147:** View 5 layers: Month 1-36+
- [ ] **TC-148:** Capture post-sale activities

---

## ⏱️ Section 8: Trial Lifecycle

### 8.1 CRM Trial (99 days)
- [ ] **TC-149:** New user created → crm_trial_activated_at set to now()
- [ ] **TC-150:** Check database: crm_enabled = true
- [ ] **TC-151:** User can access CRM immediately
- [ ] **TC-152:** Trial countdown shows correct days remaining

### 8.2 B2B0 Trial (7 days)
- [ ] **TC-153:** User with b2b0_trial_activated_at set
- [ ] **TC-154:** Check database: b2b0_enabled = true initially
- [ ] **TC-155:** B2B0 Outreach card unlocked in launcher

### 8.3 Trial Reminders (Manual Test - Can't wait for real days)
**Note:** These require cron monitors to run. Test by manually calling Edge Functions:
- [ ] **TC-156:** CRM Day 90 reminder (popup notification)
- [ ] **TC-157:** CRM Day 110 email reminder
- [ ] **TC-158:** CRM Day 145 email reminder
- [ ] **TC-159:** CRM Day 150 hard deactivation (crm_enabled = false)
- [ ] **TC-160:** B2B0 Day 9 hard block (b2b0_enabled = false)

---

## 📧 Section 9: Email Notifications

### 9.1 Welcome Emails (New User)
- [ ] **TC-161:** Create new user via "+ Add User"
- [ ] **TC-162:** Check shaamel@shaamelz.com inbox
- [ ] **TC-163:** Email received with subject "New User Created: [Name]"
- [ ] **TC-164:** Email contains: user ID, company, team, team leader
- [ ] **TC-165:** Email contains password reset URL
- [ ] **TC-166:** Email shows message template to forward to user

### 9.2 Password Reset Emails
- [ ] **TC-167:** Click "Reset Password" on existing user
- [ ] **TC-168:** Email sent to shaamel@shaamelz.com
- [ ] **TC-169:** Email shows which user reset is for
- [ ] **TC-170:** Reset link in email works

### 9.3 Email Domain Status
- [ ] **TC-171:** Check if emails sent from onboarding@resend.dev (test domain)
- [ ] **TC-172:** Note in email says "TEMPORARY" until domain verified
- [ ] **TC-173:** After shaamelz.com verified, update sender to noreply@shaamelz.com

---

## 🖥️ Section 10: Master Console

### 10.1 Company Selection
- [ ] **TC-174:** Login as super_duper_admin
- [ ] **TC-175:** Master console loads
- [ ] **TC-176:** Company dropdown populated with all companies
- [ ] **TC-177:** Select company → users load for that company
- [ ] **TC-178:** "+ Add User" button appears when company selected

### 10.2 User List Display
- [ ] **TC-179:** Users displayed in cards
- [ ] **TC-180:** Each card shows: name, email, role badge, status badge
- [ ] **TC-181:** Role badges color-coded correctly:
  - 🔴 super_duper_admin, super_admin (red)
  - 🟡 admin (amber)
  - 🔵 admin_m (blue)
  - 🟢 SDR (green)
  - ⚫ Account Executive (gray)
- [ ] **TC-182:** Status badges display: 🟢 Active, ⏸️ Suspended, 🔴 Deactivated
- [ ] **TC-183:** All action buttons visible: Edit, Transfer, Change Role, Reset Password, Suspend, Delete

### 10.3 Tab Switching
- [ ] **TC-184:** Click "Pending Registrations" tab → tab switches
- [ ] **TC-185:** Registration list loads
- [ ] **TC-186:** Click "Companies & Users" tab → switches back
- [ ] **TC-187:** User list reloads

---

## 🐛 Section 11: Known Issues to Verify Fixed

### 11.1 Previously Reported Bugs
- [ ] **TC-188:** SDR login → can access CRM (not stuck in redirect loop to system/index.html)
- [ ] **TC-189:** Reset password button works (not "nothing happens")
- [ ] **TC-190:** Company dropdown populates (table name = organisations not orgs)
- [ ] **TC-191:** Logout button works (function defined)
- [ ] **TC-192:** Transfer modal shows dropdowns (not text prompts)
- [ ] **TC-193:** Change Role modal shows visual cards (not text prompt)

---

## 📊 Test Summary

**Total Test Cases:** 193

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | ___ | ___% |
| ❌ FAIL | ___ | ___% |
| ⚠️ PARTIAL | ___ | ___% |
| ⏭️ SKIPPED | ___ | ___% |

---

## 🐛 Bugs Found

### Bug #1:
- **Test Case:** TC-___
- **Description:** 
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Severity:** Critical / High / Medium / Low
- **Status:** Open / Fixed / Won't Fix

### Bug #2:
_(Add more as found)_

---

## ✅ Sign-Off

- [ ] All Critical bugs fixed
- [ ] All High bugs fixed or documented
- [ ] Medium/Low bugs triaged
- [ ] Platform ready for production use

**Tested By:** _______________  
**Date:** _______________  
**Signature:** _______________

---

## 📝 Notes

- For email tests: Only shaamel@shaamelz.com receives emails (Resend test domain limitation)
- For trial lifecycle: Can't wait 99 days - test by manually setting dates in database
- For cron jobs: Test by manually invoking Edge Functions with test data
- GitHub repo: https://github.com/shridharswaminathan1970/ignite-apex
- Production URL: https://shaamelz.com
