# IGNITE_APEX - Complete UAT Test Plan

**Date:** 2026-07-01  
**Version:** 1.0  
**Tester:** Shridhar Swaminathan  
**Environment:** Production - https://shaamelz.com

---

## Test Execution Instructions

1. Test each section sequentially
2. Mark results: PASS / FAIL / PARTIAL / SKIP
3. Document all bugs in "Bugs Found" section
4. Test accounts:
   - Super Duper Admin: muhammad.shaamel@gmail.com or shaamel@shaamelz.com
   - Create test users for other roles during testing

---

## SECTION 1: AUTHENTICATION (12 tests)

**1.1 Login Flow**
- [ ] TC-001: Login with valid super_duper_admin → launcher loads
- [ ] TC-002: Login with invalid password → error shown
- [ ] TC-003: Login with non-existent email → error shown
- [ ] TC-004: Password reset link generation works
- [ ] TC-005: Reset email arrives at shaamel@shaamelz.com
- [ ] TC-006: Reset link successfully changes password

**1.2 Role-Based Access**
- [ ] TC-007: super_duper_admin can access master-console.html
- [ ] TC-008: super_duper_admin can access teams.html
- [ ] TC-009: super_admin CANNOT access master-console (blocked)
- [ ] TC-010: admin CANNOT access master-console (blocked)
- [ ] TC-011: SDR can access CRM after trial activated
- [ ] TC-012: SDR redirected to Sales OS if CRM locked

---

## SECTION 2: USER MANAGEMENT (41 tests)

**2.1 Add User (6 tests)**
- [ ] TC-013: Click "+ Add User" in master-console
- [ ] TC-014: Fill form: name, email, role=SDR, team, manager
- [ ] TC-015: Submit → user created successfully
- [ ] TC-016: Email sent to shaamel@shaamelz.com
- [ ] TC-017: Email has user ID, company, team, leader, URL
- [ ] TC-018: New user logs in with reset link

**2.2 Edit User (3 tests)**
- [ ] TC-019: Click "Edit" on user
- [ ] TC-020: Change name → saves
- [ ] TC-021: List refreshes with new name

**2.3 Transfer User (6 tests)**
- [ ] TC-022: Click "Transfer" → modal opens
- [ ] TC-023: Modal has team dropdown
- [ ] TC-024: Modal has manager dropdown
- [ ] TC-025: No teams? → "NEW" auto-created
- [ ] TC-026: Select team & manager → transfer succeeds
- [ ] TC-027: Database updated correctly

**2.4 Change Role (7 tests)**
- [ ] TC-028: Click "Change Role" on SDR
- [ ] TC-029: Modal shows role cards with descriptions
- [ ] TC-030: super_duper_admin sees ALL roles
- [ ] TC-031: super_admin CANNOT see super_duper_admin/super_admin
- [ ] TC-032: admin can ONLY see SDR/Account Executive
- [ ] TC-033: Select role → changes successfully
- [ ] TC-034: Badge updates to new role

**2.5 Suspend/Reactivate (6 tests)**
- [ ] TC-035: Click "Suspend" → status changes
- [ ] TC-036: Badge shows "Suspended"
- [ ] TC-037: Suspended user CANNOT login
- [ ] TC-038: Click "Reactivate" → status changes
- [ ] TC-039: Badge shows "Active"
- [ ] TC-040: Reactivated user CAN login

**2.6 Deactivate (3 tests)**
- [ ] TC-041: Click "Deactivate" → status changes
- [ ] TC-042: Badge shows "Deactivated"
- [ ] TC-043: Deactivated user CANNOT login

**2.7 Delete User (5 tests)**
- [ ] TC-044: Click "Delete" → confirmation dialog
- [ ] TC-045: Confirm → user deleted from DB
- [ ] TC-046: User removed from list
- [ ] TC-047: Deleted user CANNOT login
- [ ] TC-048: Can delete empty team but NOT team with members

**2.8 Reset Password (5 tests)**
- [ ] TC-049: Click "Reset Password" → confirmation
- [ ] TC-050: Email sent to shaamel@shaamelz.com
- [ ] TC-051: Email shows WHICH user reset is for
- [ ] TC-052: Email has clickable reset link
- [ ] TC-053: Reset link works when clicked

---

## SECTION 3: TEAM MANAGEMENT (24 tests)

**3.1 View Teams (3 tests)**
- [ ] TC-054: Navigate to /app/teams.html
- [ ] TC-055: All org teams displayed
- [ ] TC-056: Each card: name, leader, member count

**3.2 Create Team (4 tests)**
- [ ] TC-057: Click "+ Create Team"
- [ ] TC-058: Enter name "UAT Test Team"
- [ ] TC-059: Team created successfully
- [ ] TC-060: Appears in grid immediately

**3.3 Rename Team (4 tests)**
- [ ] TC-061: Click "Rename" on team
- [ ] TC-062: Enter new name
- [ ] TC-063: Name updates successfully
- [ ] TC-064: Grid refreshes with new name

**3.4 Assign Leader (5 tests)**
- [ ] TC-065: Click "Assign Leader"
- [ ] TC-066: Modal shows eligible leaders (super_admin/admin)
- [ ] TC-067: Select leader from dropdown
- [ ] TC-068: Leader assigned successfully
- [ ] TC-069: Card shows leader name

**3.5 View Members (4 tests)**
- [ ] TC-070: Click "View Members"
- [ ] TC-071: Modal shows member table
- [ ] TC-072: Table has: name, email, role
- [ ] TC-073: Close modal works

**3.6 Delete Team (4 tests)**
- [ ] TC-074: Try delete team with members → BLOCKED
- [ ] TC-075: Transfer all members out
- [ ] TC-076: Delete empty team → succeeds
- [ ] TC-077: Team removed from grid

---

## SECTION 4: REGISTRATION & APPROVAL (16 tests)

**4.1 Public Registration (4 tests)**
- [ ] TC-078: Go to /app/register.html
- [ ] TC-079: Fill: name, email, phone, country, company
- [ ] TC-080: Submit → "Request Submitted!" message
- [ ] TC-081: Request in registration_requests table

**4.2 Approval Workflow (8 tests)**
- [ ] TC-082: Login as super_duper_admin
- [ ] TC-083: Master-console → "Pending Registrations" tab
- [ ] TC-084: New registration listed
- [ ] TC-085: Click "Approve" → confirmation
- [ ] TC-086: User created in system
- [ ] TC-087: Email sent to shaamel@shaamelz.com
- [ ] TC-088: Setup link works for new user
- [ ] TC-089: Registration status = "approved"

**4.3 Rejection (4 tests)**
- [ ] TC-090: Submit another test registration
- [ ] TC-091: Click "Reject" → enter reason
- [ ] TC-092: Status updated to "rejected"
- [ ] TC-093: NO user account created

---

## SECTION 5: LAUNCHER & NAVIGATION (13 tests)

**5.1 Launcher Access (3 tests)**
- [ ] TC-094: super_duper_admin login → launcher loads
- [ ] TC-095: SDR login → launcher loads
- [ ] TC-096: Shows: Sales OS, CRM, B2B0 cards

**5.2 Feature Gates (6 tests)**
- [ ] TC-097: crm_enabled=true → CRM unlocked
- [ ] TC-098: crm_enabled=false → CRM locked (with lock icon)
- [ ] TC-099: Click unlocked CRM → navigates
- [ ] TC-100: Click locked CRM → blocked (nothing happens)
- [ ] TC-101: Sales OS always accessible (FREE)
- [ ] TC-102: B2B0 locked unless b2b0_enabled=true

**5.3 Navigation (4 tests)**
- [ ] TC-103: "Back to Launcher" link works everywhere
- [ ] TC-104: "Sign Out" logs user out
- [ ] TC-105: After logout → redirected to auth.html
- [ ] TC-106: Cannot access protected pages without login

---

## SECTION 6: CRM FUNCTIONALITY (24 tests)

**6.1 Leads (6 tests)**
- [ ] TC-107: Navigate to CRM → Leads
- [ ] TC-108: Create lead: name, company, email, phone
- [ ] TC-109: Lead appears in list
- [ ] TC-110: Edit lead → saves
- [ ] TC-111: Convert lead to opportunity
- [ ] TC-112: Delete lead → removed

**6.2 Opportunities (7 tests)**
- [ ] TC-113: Navigate to Opportunities
- [ ] TC-114: Create: name, value, close date, stage
- [ ] TC-115: Appears in pipeline
- [ ] TC-116: Drag to different stage → updates
- [ ] TC-117: Edit opportunity details
- [ ] TC-118: Mark "Closed Won"
- [ ] TC-119: Mark "Closed Lost"

**6.3 Accounts & Contacts (5 tests)**
- [ ] TC-120: Create new account (company)
- [ ] TC-121: Add contact to account
- [ ] TC-122: View account details page
- [ ] TC-123: View contact details page
- [ ] TC-124: Link opportunity to account

**6.4 Activities & Tasks (6 tests)**
- [ ] TC-125: Create task with due date
- [ ] TC-126: Task appears in list
- [ ] TC-127: Mark task complete
- [ ] TC-128: Log call activity
- [ ] TC-129: Log meeting activity
- [ ] TC-130: View activity history

---

## SECTION 7: SALES OS / IGNITE (18 tests)

**7.1 IGNITE Entry Gate (8 tests)**
- [ ] TC-131: Navigate to Sales OS → Entry Gate
- [ ] TC-132: Fill 4U: Unworkable, Urgent, Unavoidable, Underserved
- [ ] TC-133: Complete "Peel Onion" for all 4 U's (3 layers each)
- [ ] TC-134: Fill JTBD 6 fields
- [ ] TC-135: Answer 6 IGNITE diagnostics
- [ ] TC-136: Score >=4/6 → PASS
- [ ] TC-137: Score <4/6 → FAIL
- [ ] TC-138: Save → data persists

**7.2 APEX Stages (7 tests)**
- [ ] TC-139: Navigate through 6 APEX stages
- [ ] TC-140: Qualification 10% → gates work
- [ ] TC-141: Discovery 30% → questions shown
- [ ] TC-142: Demo 50% → gate checks work
- [ ] TC-143: Proposal 70% → MEDDPICC shown
- [ ] TC-144: Negotiation 90%
- [ ] TC-145: Closed Won 100%

**7.3 CEMENT Post-Sale (3 tests)**
- [ ] TC-146: Navigate to CEMENT
- [ ] TC-147: View 5 layers: Month 1-36+
- [ ] TC-148: Capture post-sale activities

---

## SECTION 8: TRIAL LIFECYCLE (12 tests)

**8.1 CRM Trial 99 days (4 tests)**
- [ ] TC-149: New user → crm_trial_activated_at = now()
- [ ] TC-150: Database: crm_enabled = true
- [ ] TC-151: User can access CRM immediately
- [ ] TC-152: Countdown shows correct days

**8.2 B2B0 Trial 7 days (3 tests)**
- [ ] TC-153: User with b2b0_trial_activated_at set
- [ ] TC-154: Database: b2b0_enabled = true initially
- [ ] TC-155: B2B0 card unlocked in launcher

**8.3 Trial Reminders - Manual Test (5 tests)**
**Note: Can't wait real days - test by manual Edge Function calls**
- [ ] TC-156: CRM Day 90 reminder (popup)
- [ ] TC-157: CRM Day 110 email
- [ ] TC-158: CRM Day 145 email
- [ ] TC-159: CRM Day 150 → crm_enabled=false
- [ ] TC-160: B2B0 Day 9 → b2b0_enabled=false

---

## SECTION 9: EMAIL NOTIFICATIONS (13 tests)

**9.1 Welcome Emails (6 tests)**
- [ ] TC-161: Create user via "+ Add User"
- [ ] TC-162: Check shaamel@shaamelz.com inbox
- [ ] TC-163: Subject: "New User Created: [Name]"
- [ ] TC-164: Contains: user ID, company, team, leader
- [ ] TC-165: Contains password reset URL
- [ ] TC-166: Has template message to forward

**9.2 Password Reset Emails (4 tests)**
- [ ] TC-167: Click "Reset Password" on user
- [ ] TC-168: Email sent to shaamel@shaamelz.com
- [ ] TC-169: Shows WHICH user reset is for
- [ ] TC-170: Reset link works

**9.3 Email Domain (3 tests)**
- [ ] TC-171: Emails from onboarding@resend.dev (test domain)
- [ ] TC-172: Email says "TEMPORARY" until verified
- [ ] TC-173: After domain verified → switch to noreply@shaamelz.com

---

## SECTION 10: MASTER CONSOLE (16 tests)

**10.1 Company Selection (5 tests)**
- [ ] TC-174: Login super_duper_admin → console loads
- [ ] TC-175: Company dropdown populated
- [ ] TC-176: Select company → users load
- [ ] TC-177: "+ Add User" appears when company selected
- [ ] TC-178: Can switch between companies

**10.2 User List (7 tests)**
- [ ] TC-179: Users in cards
- [ ] TC-180: Each card: name, email, role badge, status
- [ ] TC-181: Role badge colors correct (red/amber/blue/green/gray)
- [ ] TC-182: Status badges: Active/Suspended/Deactivated
- [ ] TC-183: Action buttons visible: Edit, Transfer, Role, Reset, Suspend, Delete
- [ ] TC-184: Can scroll through long user lists
- [ ] TC-185: User count accurate

**10.3 Tabs (4 tests)**
- [ ] TC-186: Click "Pending Registrations" → switches
- [ ] TC-187: Registration list loads
- [ ] TC-188: Click "Companies & Users" → switches back
- [ ] TC-189: User list reloads

---

## SECTION 11: KNOWN BUGS VERIFICATION (6 tests)

**Previously Reported - Verify Fixed:**
- [ ] TC-190: SDR login → CAN access CRM (no redirect loop)
- [ ] TC-191: Reset password button WORKS (not silent fail)
- [ ] TC-192: Company dropdown POPULATES (organisations table)
- [ ] TC-193: Logout button WORKS (function defined)
- [ ] TC-194: Transfer shows MODAL with dropdowns (not prompts)
- [ ] TC-195: Change Role shows VISUAL cards (not prompts)

---

## TEST SUMMARY

**Total:** 195 test cases

| Status | Count | % |
|--------|-------|---|
| PASS   | ___   | __% |
| FAIL   | ___   | __% |
| PARTIAL| ___   | __% |
| SKIP   | ___   | __% |

---

## BUGS FOUND

### Bug #001
- **TC:** ___
- **Title:** 
- **Steps:** 
- **Expected:** 
- **Actual:** 
- **Severity:** Critical / High / Medium / Low
- **Status:** Open / Fixed

*(Add more as found)*

---

## SIGN-OFF

- [ ] All Critical bugs fixed
- [ ] All High bugs fixed or documented
- [ ] Medium/Low bugs triaged
- [ ] Platform ready for production

**Tested:** ________________  
**Date:** ________________

---

## NOTES

- Email tests: Only shaamel@shaamelz.com receives (test domain limit)
- Trial tests: Can't wait 99 days - set dates manually in DB
- Cron tests: Manually invoke Edge Functions
- GitHub: https://github.com/shridharswaminathan1970/ignite-apex
- Production: https://shaamelz.com
