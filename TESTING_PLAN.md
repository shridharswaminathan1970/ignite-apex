# IGNITE_APEX Systematic Testing Plan
**Date:** 2026-07-01  
**Based on:** DISCOVERY_AUDIT.md findings  
**Goal:** Verify 65-70% built → 100% production-ready

---

## TESTING STRATEGY

### Phases
1. **Critical Path Testing** (1-2 hours) - Core user journeys
2. **Feature Testing** (2-3 hours) - Individual components
3. **Integration Testing** (1-2 hours) - Cross-component workflows
4. **Edge Case Testing** (1 hour) - Error handling, boundaries
5. **Regression Testing** (1 hour) - Verify fixes don't break existing

### Test Environment
- **URL:** https://shaamelz.com
- **Supabase:** gokslnrvxqledagcwghq
- **Test Users:**
  - super_duper_admin: muhammad.shaamel@gmail.com, shaamel@shaamelz.com
  - sdr: huntjobsdown4shaamel@gmail.com (just fixed)
  - Create test users for other roles as needed

---

## CRITICAL PATH TESTS (Priority 1)

### CP-1: New User Onboarding Journey
**Expected:** Registration → Approval → Email → Login → Launcher → CRM

**Steps:**
1. Open https://shaamelz.com/app/register.html
2. Fill form (new email, phone, company "Test Corp")
3. Submit → Verify "Request Submitted!" message
4. Login as super_duper_admin → master-console.html
5. Go to "Pending Registrations" tab
6. Find test user → Click "Approve"
7. Check shaamel@shaamelz.com inbox for email with:
   - User ID
   - Company name
   - Team name
   - Password reset link
8. Click password reset link → Set password
9. Login with new credentials
10. Verify lands on launcher.html
11. Verify sees appropriate cards (Sales OS, CRM locked/unlocked)

**Pass Criteria:**
- ✅ Registration submits
- ✅ Approval creates user
- ✅ Email received with valid link
- ✅ Login succeeds
- ✅ Launcher loads without error

**Status:** [ ]

---

### CP-2: SDR Login & CRM Access (JUST FIXED)
**Expected:** SDR can login → see launcher → access CRM

**Steps:**
1. Logout all sessions
2. Go to https://shaamelz.com/app/auth.html
3. Login: huntjobsdown4shaamel@gmail.com
4. Verify redirects to launcher.html
5. Verify NO "Error loading user profile" alert
6. Verify CRM card is UNLOCKED (green, no lock icon)
7. Click "Launch CRM" button
8. Verify redirects to crm/index.html
9. Verify CRM dashboard loads
10. Verify can see navigation (Leads, Pipeline, Accounts, etc.)

**Pass Criteria:**
- ✅ Login succeeds
- ✅ Launcher loads
- ✅ CRM unlocked
- ✅ CRM loads without redirect loop

**Status:** [ ] NEEDS TESTING AFTER FIX

---

### CP-3: Create Opportunity → Qualification → AI Coaching
**Expected:** Create deal → Work through roadmap → Get AI coaching

**Steps:**
1. Login as SDR (huntjobsdown4shaamel@gmail.com)
2. Go to CRM → Opportunities
3. Click "+ New Opportunity"
4. Fill:
   - Name: "Acme Corp Deal"
   - Value: $50,000
   - Close Date: 30 days from now
   - Stage: Qualification
5. Save → Open opportunity
6. Click "🗺️ Qualification Roadmap" tab
7. Verify:
   - Horizontal rail with 8 stages
   - "YOU ARE HERE" on Qualification stage
   - Can click other stages
8. Scroll to "Economic Buyer identified" gate
9. Type in answer: "Spoke with CFO John Smith"
10. Move strength slider to 2 (Weak)
11. Click "🤖 Get AI Coaching"
12. Wait 2-5 seconds
13. Verify blue panel appears with:
    - Draft answer
    - Weak evidence flags
    - Next action suggestion
14. Click "✓ Use This Draft"
15. Verify draft fills textarea
16. Try to check "Mark as complete"
17. Verify warning appears (weak evidence)
18. Click "Mark complete anyway"
19. Verify checkbox checks

**Pass Criteria:**
- ✅ Opportunity created
- ✅ Qualification Roadmap tab loads
- ✅ Roadmap rail displays correctly
- ✅ Gate answer fields work
- ✅ Strength slider updates label
- ✅ AI Coaching returns draft
- ✅ Weak evidence warning shows
- ✅ Can mark complete anyway

**Status:** [ ]

---

### CP-4: Master Console User Management
**Expected:** Super admin can add/edit/transfer users

**Steps:**
1. Login as super_duper_admin
2. Go to master-console.html
3. Select company from dropdown
4. Verify user list loads
5. Click "+ Add User"
6. Fill:
   - Name: "Test User"
   - Email: test_user_[timestamp]@example.com
   - Role: SDR
   - Team: Select existing
   - Manager: Select existing
7. Save
8. Verify email sent to shaamel@shaamelz.com
9. Find user in list
10. Click "Edit" → Change name → Save
11. Verify name updates
12. Click "Transfer" → Select different team/manager
13. Verify transfer succeeds
14. Click "Change Role" → Change SDR → Account Executive
15. Verify role badge updates
16. Click "Suspend" → Confirm
17. Verify status badge shows "Suspended"
18. Click "Reactivate" → Confirm
19. Verify status badge shows "Active"

**Pass Criteria:**
- ✅ Company selector works
- ✅ User list loads
- ✅ Add user creates + sends email
- ✅ Edit saves changes
- ✅ Transfer works
- ✅ Change role works
- ✅ Suspend/reactivate works

**Status:** [ ]

---

## FEATURE TESTS (Priority 2)

### FT-1: CRM Leads Management
**Expected:** Create/edit/convert leads

**Steps:**
1. Login as SDR
2. Go to CRM → Leads
3. Click "+ New Lead"
4. Fill form (name, company, email, phone, source)
5. Save
6. Verify appears in leads list
7. Click lead → Edit
8. Change status to "Qualified"
9. Click "Convert to Opportunity"
10. Verify opportunity created
11. Go to Opportunities
12. Verify lead is now an opportunity

**Pass Criteria:**
- ✅ Create lead works
- ✅ Edit lead works
- ✅ Convert to opportunity works
- ✅ Data persists correctly

**Status:** [ ]

---

### FT-2: CRM Pipeline View
**Expected:** Kanban board with drag-drop

**Steps:**
1. Login as SDR
2. Go to CRM → Pipeline
3. Verify stages shown as columns
4. Verify opportunities in correct columns
5. Try dragging opportunity to different stage
6. Verify card moves
7. Refresh page
8. Verify opportunity stayed in new stage

**Pass Criteria:**
- ✅ Pipeline loads
- ✅ Drag-drop works
- ✅ Stage change persists

**Status:** [ ]

---

### FT-3: Team Management
**Expected:** Create/rename/assign leader/delete teams

**Steps:**
1. Login as super_admin or admin
2. Go to teams.html
3. Click "+ Create Team"
4. Name: "UAT Test Team"
5. Save
6. Verify team appears in grid
7. Click "Rename" → Change to "UAT Team Updated"
8. Verify name updates
9. Click "Assign Leader"
10. Select a super_admin or admin from dropdown
11. Save
12. Verify leader name shown on card
13. Click "View Members"
14. Verify member modal opens
15. Close modal
16. Try to delete team
17. If has members → Verify blocked with message
18. Transfer all members out
19. Delete team
20. Verify removed from grid

**Pass Criteria:**
- ✅ Create team works
- ✅ Rename works
- ✅ Assign leader works
- ✅ View members works
- ✅ Delete blocks if members exist
- ✅ Delete succeeds when empty

**Status:** [ ]

---

### FT-4: Trial Countdown & Feature Gates
**Expected:** Trial banner shows, CRM locks after expiry

**Steps:**
1. Login as user with active trial
2. Verify trial banner appears at top
3. Verify shows days remaining
4. Verify color-coded (green > 30 days, amber 10-30, red <= 9)
5. Via SQL, set trial to expired:
   ```sql
   UPDATE users 
   SET crm_trial_activated_at = NOW() - INTERVAL '100 days'
   WHERE email = 'test_user@example.com';
   ```
6. Refresh launcher
7. Verify CRM card shows LOCKED
8. Try clicking CRM
9. Verify cannot access
10. Reset trial:
   ```sql
   UPDATE users 
   SET crm_trial_activated_at = NOW()
   WHERE email = 'test_user@example.com';
   ```
11. Refresh
12. Verify CRM unlocked

**Pass Criteria:**
- ✅ Trial banner displays correctly
- ✅ Countdown accurate
- ✅ Feature gate locks after expiry
- ✅ Cannot access expired features

**Status:** [ ]

---

### FT-5: IGNITE Sales OS (system/index.html)
**Expected:** Standalone IGNITE framework works

**Steps:**
1. Login as any user
2. Go to https://shaamelz.com/system/index.html
3. Verify IGNITE interface loads
4. Fill 4U fields (Unworkable, Urgent, Unavoidable, Underserved)
5. Fill evidence for each
6. Scroll to IGNITE diagnostics
7. Check 4+ boxes
8. Verify passes gate (green)
9. Progress to next stage
10. Verify stage progression works
11. Check if data persists (localStorage or DB?)
12. Refresh page
13. Verify data still there

**Pass Criteria:**
- ✅ IGNITE Sales OS loads
- ✅ 4U validation works
- ✅ Gate scoring works
- ✅ Stage progression works
- ✅ Data persists

**Status:** [ ]

---

### FT-6: B2B0 Outreach Agent
**Expected:** Placeholder page shows subscription requirement

**Steps:**
1. Login as user WITHOUT b2b0_enabled
2. Go to https://shaamelz.com/outreach/index.html
3. Verify landing page loads
4. Verify shows "🔒 Subscription Required"
5. Verify "View Pricing" button
6. Click pricing button
7. Verify redirects to pricing.html
8. Via SQL, enable B2B0:
   ```sql
   UPDATE users 
   SET b2b0_enabled = true, b2b0_trial_activated_at = NOW()
   WHERE email = 'test_user@example.com';
   ```
9. Go back to outreach/index.html
10. Verify shows "✅ Access Granted"
11. Click "🚀 Launch B2B Outreach"
12. Note: Currently goes nowhere (agent not built)

**Pass Criteria:**
- ✅ Landing page loads
- ✅ Access gate works
- ✅ Trial gate works
- ⚠️ Agent not functional (expected)

**Status:** [ ]

---

## INTEGRATION TESTS (Priority 2)

### IT-1: Sales OS → CRM Sync
**Expected:** Data from system/index.html syncs to opportunities table

**Steps:**
1. Go to system/index.html
2. Fill IGNITE qualification
3. Save/export
4. Check if opportunity created in CRM
5. Go to CRM → Opportunities
6. Verify data appears

**Pass Criteria:**
- ✅ Data syncs from Sales OS to CRM
- ✅ No data loss
- ⚠️ OR understand these are separate tools

**Status:** [ ] NEEDS INVESTIGATION

---

### IT-2: Activity Logging → AI Coaching Context
**Expected:** Logged activities feed into AI coaching

**Steps:**
1. Open opportunity
2. Log activity: "Call with CFO - discussed budget"
3. Go to Qualification Roadmap tab
4. At "Economic Buyer" gate, click AI Coaching
5. Verify draft mentions the logged activity

**Pass Criteria:**
- ✅ AI coaching uses activity context
- ⚠️ OR understand activities don't feed in yet

**Status:** [ ]

---

### IT-3: Team Reports
**Expected:** Team reports aggregate user data

**Steps:**
1. Login as super_admin
2. Go to team-reports.html
3. Select team
4. Generate report
5. Verify shows team metrics
6. Verify accurate

**Pass Criteria:**
- ✅ Reports generate
- ✅ Data accurate

**Status:** [ ]

---

## EDGE CASE TESTS (Priority 3)

### EC-1: Duplicate Email Registration
**Expected:** System prevents duplicate emails

**Steps:**
1. Try registering with existing email
2. Verify error message

**Status:** [ ]

---

### EC-2: Invalid Input Handling
**Expected:** Forms validate input

**Steps:**
1. Try creating opportunity with negative value
2. Try creating user with invalid email format
3. Verify validation errors

**Status:** [ ]

---

### EC-3: Concurrent Edits
**Expected:** Last write wins or conflict detection

**Steps:**
1. Open same opportunity in two tabs
2. Edit in both
3. Save both
4. Verify behavior

**Status:** [ ]

---

### EC-4: Session Timeout
**Expected:** Graceful re-authentication

**Steps:**
1. Login
2. Wait for session to expire (or force via SQL)
3. Try performing action
4. Verify redirects to login

**Status:** [ ]

---

## REGRESSION TESTS (Priority 3)

### RT-1: Super Duper Admin Access
**Expected:** muhammad.shaamel@gmail.com and shaamel@shaamelz.com still work

**Steps:**
1. Login as each
2. Verify master-console access
3. Verify can manage all companies
4. Verify all permissions work

**Status:** [ ]

---

### RT-2: Email Routing
**Expected:** All emails still go to shaamel@shaamelz.com

**Steps:**
1. Trigger various email events
2. Verify all arrive at shaamel@shaamelz.com
3. Verify content correct

**Status:** [ ]

---

### RT-3: Cron Jobs Still Running
**Expected:** crm-trial-monitor and b2b0-trial-monitor fire daily

**Steps:**
1. Check Supabase Edge Function logs
2. Verify recent invocations (within 24 hours)
3. Verify 200 status codes

**Status:** [ ]

---

## TEST EXECUTION TRACKING

### Session 1: Critical Path (Estimated: 2 hours)
- [ ] CP-1: New User Onboarding Journey
- [ ] CP-2: SDR Login & CRM Access (PRIORITY)
- [ ] CP-3: Create Opportunity → Qualification → AI Coaching
- [ ] CP-4: Master Console User Management

**Start:** ___________  
**End:** ___________  
**Bugs Found:** ___________

---

### Session 2: Feature Tests (Estimated: 3 hours)
- [ ] FT-1: CRM Leads Management
- [ ] FT-2: CRM Pipeline View
- [ ] FT-3: Team Management
- [ ] FT-4: Trial Countdown & Feature Gates
- [ ] FT-5: IGNITE Sales OS
- [ ] FT-6: B2B0 Outreach Agent

**Start:** ___________  
**End:** ___________  
**Bugs Found:** ___________

---

### Session 3: Integration & Edge Cases (Estimated: 2 hours)
- [ ] IT-1: Sales OS → CRM Sync
- [ ] IT-2: Activity Logging → AI Coaching Context
- [ ] IT-3: Team Reports
- [ ] EC-1: Duplicate Email Registration
- [ ] EC-2: Invalid Input Handling
- [ ] EC-3: Concurrent Edits
- [ ] EC-4: Session Timeout

**Start:** ___________  
**End:** ___________  
**Bugs Found:** ___________

---

### Session 4: Regression (Estimated: 1 hour)
- [ ] RT-1: Super Duper Admin Access
- [ ] RT-2: Email Routing
- [ ] RT-3: Cron Jobs Still Running

**Start:** ___________  
**End:** ___________  
**Bugs Found:** ___________

---

## BUG TRACKING

### Bug Template
```
Bug ID: BUG-[number]
Test: [test ID]
Severity: Critical / High / Medium / Low
Title: [brief description]
Steps to Reproduce:
1. 
2. 
3. 
Expected: 
Actual: 
Screenshots/Logs: 
Status: Open / In Progress / Fixed / Won't Fix
Fixed In: [commit hash]
```

### Known Bugs
- ✅ **BUG-001** - FIXED: SDR login "Error loading user profile" (RLS policy)

---

## COMPLETION CRITERIA

**Ready for Production When:**
- ✅ All CP (Critical Path) tests pass
- ✅ 90%+ FT (Feature Tests) pass
- ✅ All Critical/High bugs fixed
- ✅ Integration points clarified and documented
- ✅ Medium bugs triaged (fix or defer)
- ✅ Low bugs documented for backlog

**Current Status:** Testing in progress

---

## NEXT STEPS AFTER TESTING

1. **Task 3: Fix Critical Bugs** - Address blockers found in testing
2. **Task 4: Documentation** - Document what works, what doesn't, integration points
3. **Deploy to Production** - When tests pass
4. **User Training** - Onboard first real users
5. **Monitor & Iterate** - Watch logs, gather feedback, improve

---

**Last Updated:** 2026-07-01
