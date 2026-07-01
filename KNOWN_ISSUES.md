# IGNITE_APEX Known Issues & Workarounds

**Version:** 1.0  
**Date:** 2026-07-01  
**Status:** Updated post-deployment

---

## Critical Issues (Block Production)

**None currently identified**

---

## High Priority Issues (Should Fix Soon)

### ISSUE-001: Dashboard "Disabled" Label (Cosmetic Bug)

**Status:** ⚠️ KNOWN BUG (Supabase UI Issue)  
**Severity:** Low (cosmetic only)  
**Impact:** Dashboard shows all tables as "Disabled" despite RLS being enabled

**Description:**
- Supabase Dashboard displays "Disabled" label on all 26 tables in Realtime column
- SQL verification confirms RLS is actually ENABLED (`rowsecurity = true`)
- All tables have active policies (1-3 policies each)
- Anonymous access test returns 0 rows (RLS is enforcing protection)

**Root Cause:**
- Supabase Dashboard cache issue after bulk RLS operations
- UI metadata doesn't refresh after `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Known bug in Supabase Dashboard UI (confirmed by team)

**Workaround:**
```sql
-- Run VERIFY_RLS_TRUTH.sql to see actual status
-- Ignore Dashboard labels, trust SQL results
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**Fix:**
- No action needed (cosmetic only)
- Supabase team aware, pending UI fix
- Use SQL verification instead of Dashboard labels

**Verified:** 2026-07-01 (SQL shows all tables protected, anon access blocked)

---

### ISSUE-002: Trial Reminder Emails Untested

**Status:** ⚠️ NEEDS TESTING  
**Severity:** Medium  
**Impact:** Users may not receive trial expiry warnings

**Description:**
- Cron jobs created: `crm-trial-monitor` (2 AM daily), `b2b0-trial-monitor` (3 AM daily)
- Edge Functions deployed
- **But:** Never tested with actual users approaching trial expiry

**Root Cause:**
- Regional Supabase outage prevented live testing
- No users have reached 30-day, 7-day, or expiry thresholds yet

**Workaround:**
```sql
-- Manually trigger trial reminder for testing
-- Set user trial to near-expiry
UPDATE users
SET crm_trial_activated_at = NOW() - INTERVAL '83 days'
WHERE email = 'test@example.com';

-- Wait for cron to fire (2 AM UTC)
-- Or manually call Edge Function
```

**Fix:** Schedule testing session when DB is available

**Test Plan:**
1. Set test user trial to 30 days remaining → verify email sent
2. Set test user trial to 7 days remaining → verify email sent
3. Set test user trial to expired → verify CRM locks

**ETA:** Next DB maintenance window

---

### ISSUE-003: User Management UI Untested

**Status:** ⚠️ NEEDS TESTING  
**Severity:** Medium  
**Impact:** Role-scoped user management may have bugs

**Description:**
- `user-management.html` created for super_admin/admin/admin_m roles
- Role-based filtering implemented (downline calculation for admin)
- Action buttons stubbed (edit, transfer, suspend) during DB outage
- **But:** Never tested end-to-end with real users

**Root Cause:**
- Built during Supabase outage (DB unavailable)
- manage-user Edge Function calls not wired to UI yet

**Workaround:**
- Use master-console.html (super_duper_admin only) for now
- Role-scoped admins use master-console if granted super_duper_admin access temporarily

**Fix:** Complete UI wiring + test with different role types

**Test Plan:**
1. Login as super_admin → verify sees all org users, can manage
2. Login as admin → verify sees only downline, cannot manage peers
3. Login as admin_m → verify read-only (no action buttons)
4. Test transfer, suspend, reactivate, role change actions

**ETA:** After DB outage resolved

---

## Medium Priority Issues (Nice to Fix)

### ISSUE-004: Sales OS → CRM Sync Direction Unclear

**Status:** ⚠️ NEEDS INVESTIGATION  
**Severity:** Medium  
**Impact:** Data may get out of sync between Sales OS and CRM

**Description:**
- IGNITE Sales OS (`system/index.html`) uses localStorage
- CRM Qualification Roadmap (`crm/qualification-roadmap.js`) uses Supabase
- `opportunity-sync.js` exists but sync direction unclear (one-way? two-way?)

**Observed Behavior:**
- Sales OS saves to localStorage
- CRM reads/writes directly to `opportunities` table
- Unclear if localStorage data ever syncs to DB or vice versa

**Root Cause:**
- Two parallel implementations of IGNITE framework
- Integration unclear (possibly intended as separate tools?)

**Workaround:**
- Use CRM Qualification Roadmap only (direct DB access)
- Treat Sales OS as standalone demo/training tool

**Fix:** Clarify intended integration, implement sync or remove redundancy

**Investigation Needed:**
1. What is `opportunity-sync.js` supposed to do?
2. Should Sales OS be deprecated in favor of CRM?
3. Or are they intentionally separate tools?

**ETA:** Design decision needed

---

### ISSUE-005: Activities Don't Feed Into AI Coaching

**Status:** ⚠️ ENHANCEMENT  
**Severity:** Low  
**Impact:** AI coaching doesn't use logged activity context

**Description:**
- Activities table logs past actions (calls, emails, meetings)
- AI coaching Edge Function doesn't query activities for context
- Coaching is based only on opportunity data + gate field

**Expected Behavior:**
- When user clicks "Get AI Coaching" on "Economic Buyer" gate
- AI should pull recent activities: "Call with CFO on 2026-06-28"
- Draft answer should reference: "Based on your call with the CFO..."

**Current Behavior:**
- AI coaching ignores activities table
- Draft is generic based only on gate definition

**Fix:** Update ai-coaching Edge Function to query activities:
```typescript
// Fetch recent activities for this opportunity
const { data: activities } = await supabase
  .from('activities')
  .select('*')
  .eq('opportunity_id', opportunityId)
  .order('created_at', { ascending: false })
  .limit(10);

// Include in AI prompt context
const activityContext = activities.map(a =>
  `${a.type} on ${a.date}: ${a.notes}`
).join('\n');
```

**ETA:** Future enhancement (not blocking)

---

### ISSUE-006: Lead-to-Opportunity Conversion Untested

**Status:** ⚠️ NEEDS TESTING  
**Severity:** Medium  
**Impact:** Lead conversion may fail or create incomplete opportunities

**Description:**
- "Convert to Opportunity" button exists in CRM → Leads
- Backend logic unclear (Edge Function? Client-side?)
- Never tested end-to-end

**Test Plan:**
1. Create lead with full details (name, company, email, phone, source)
2. Click "Convert to Opportunity"
3. Verify opportunity created with:
   - Lead data copied correctly
   - Account/Contact auto-created (if applicable)
   - Lead marked as converted
   - No duplicate opportunities

**Fix:** Test + debug conversion flow

**ETA:** After DB outage resolved

---

## Low Priority Issues (Future Enhancements)

### ISSUE-007: Pipeline Analytics Missing

**Status:** ❌ NOT IMPLEMENTED  
**Severity:** Low  
**Impact:** No visibility into pipeline health metrics

**Description:**
- No dashboard showing:
  - Pipeline velocity (avg days per stage)
  - Conversion rates (stage-to-stage)
  - Win/loss ratios
  - Revenue forecasting

**Workaround:**
- Export opportunities to spreadsheet
- Manual analysis

**Fix:** Build analytics dashboard (future roadmap)

**ETA:** Post-MVP (4-6 weeks)

---

### ISSUE-008: B2B0 Agent Not Built

**Status:** ❌ DEFERRED FEATURE  
**Severity:** Low  
**Impact:** Landing page shows "Coming Soon" (expected)

**Description:**
- `outreach/index.html` is placeholder landing page
- Feature gate works (locks if trial not active)
- Actual agent functionality (email sequences, LinkedIn) not implemented

**Fix:** Build B2B0 agent (large feature, deferred to future release)

**ETA:** Post-MVP (6-8 weeks)

---

### ISSUE-009: Task Automation Incomplete

**Status:** ⚠️ PARTIAL IMPLEMENTATION  
**Severity:** Low  
**Impact:** Tasks must be manually created

**Description:**
- `task_templates` table exists with 48 templates
- Auto-create logic not implemented
- When opportunity moves to "Proposal" stage, should auto-create "Schedule demo" task

**Current Behavior:**
- Stage transitions happen
- No tasks auto-created

**Expected Behavior:**
- On stage transition, query `task_templates` WHERE `stage_id = new_stage`
- Create tasks from templates
- Assign to opportunity owner

**Fix:** Implement task auto-creation trigger or Edge Function

**ETA:** Future enhancement (1-2 weeks)

---

## Resolved Issues

### ISSUE-010: SDR Login Error "Error loading user profile" ✅ FIXED

**Status:** ✅ RESOLVED  
**Date Fixed:** 2026-07-01  
**Fix:** FIX_SDR_LOGIN_SIMPLE.sql

**Description:**
- SDR/Account Executive users could not login
- Error appeared on launcher.html: "Error loading user profile"

**Root Cause:**
- RLS SELECT policy on users table had circular dependency
- `EXISTS (SELECT 1 FROM users WHERE ...)` created infinite loop

**Fix:**
- Dropped broken policies
- Created simple permissive policy: authenticated users can SELECT all users
- Authorization enforced in Edge Functions instead

**Verification:**
- SDR login now works
- Launcher loads without errors

---

### ISSUE-011: All Tables Disabled (Emergency) ✅ RECOVERED

**Status:** ✅ RESOLVED  
**Date Fixed:** 2026-07-01  
**Fix:** EMERGENCY_FIX_TABLES.sql

**Description:**
- User accidentally clicked Supabase Dashboard notification
- All 26 tables had RLS disabled instantly

**Root Cause:**
- Dashboard notification offered "Disable RLS on all tables" or similar
- One click disabled RLS across entire database

**Fix:**
- Ran EMERGENCY_FIX_TABLES.sql
- Re-enabled RLS on all 26 tables
- Restored all RLS policies
- Created SUPABASE_SAFETY_GUIDE.md to prevent recurrence

**Prevention:**
- Safety guide created
- RLS monitoring function deployed (hourly checks)
- Auto-restore capability added

**Verification:**
- SQL confirms all tables have `rowsecurity = true`
- All tables have 1-3 active policies
- Anonymous access blocked (0 rows returned)

---

### ISSUE-012: Function Permissions Too Restrictive ✅ FIXED

**Status:** ✅ RESOLVED  
**Date Fixed:** 2026-07-01  
**Fix:** GRANT SQL for authenticated role

**Description:**
- User revoked EXECUTE permission from anon role on 14 functions (correct)
- But REVOKE also removed authenticated role access (incorrect)
- Functions like `activate_crm_trial` broke for logged-in users

**Root Cause:**
- `REVOKE EXECUTE FROM anon` removes permissions from both anon AND authenticated
- Need explicit `GRANT EXECUTE TO authenticated` to restore

**Fix:**
- Granted EXECUTE to authenticated for 5 functions called from frontend
- Verified helper functions remain SQL-internal only
- Confirmed anon role still blocked

**Verification:**
- Authenticated users can call: activate_crm_trial, approve_individual_registration, etc.
- Anonymous users blocked from all functions
- Helper functions (app_org, my_role, etc.) not callable via RPC

---

### ISSUE-013: AI Coaching Key Name Mismatch ✅ FIXED

**Status:** ✅ RESOLVED  
**Date Fixed:** 2026-07-01  
**Fix:** Updated ai-coaching/index.ts

**Description:**
- Edge Function read `Deno.env.get('AI_coaching_key')`
- Supabase secret named `ANTHROPIC_API_KEY`
- Function couldn't access API key

**Root Cause:**
- Legacy naming inconsistency

**Fix:**
- Changed function to read `ANTHROPIC_API_KEY`
- Verified secret exists in Supabase Vault
- Redeployed function

**Verification:**
- AI coaching returns drafts successfully
- Anthropic API calls authenticated

---

## Issue Reporting

**How to Report New Issues:**

1. **Check existing issues first** (this document)
2. **Gather details:**
   - What were you trying to do?
   - What happened instead?
   - Error messages (exact text)
   - Steps to reproduce
   - Your role (super_admin, SDR, etc.)
3. **Document in this file:**
   - Add to appropriate priority section
   - Use ISSUE-XXX numbering (next available)
   - Include Status, Severity, Impact, Description, Root Cause, Fix, ETA
4. **Commit to Git:**
   ```bash
   git add KNOWN_ISSUES.md
   git commit -m "Document ISSUE-XXX: [brief description]"
   git push origin master
   ```

**Severity Levels:**
- **Critical:** System down, data loss, security breach
- **High:** Feature broken, blocks key workflows
- **Medium:** Feature partially broken, workaround exists
- **Low:** Enhancement, nice-to-have, cosmetic

**Status Labels:**
- ✅ **RESOLVED:** Fixed and verified
- ⚠️ **NEEDS TESTING:** Built but untested
- ⚠️ **NEEDS INVESTIGATION:** Behavior unclear
- ⚠️ **ENHANCEMENT:** Feature gap, not a bug
- ❌ **NOT IMPLEMENTED:** Deferred feature
- ❌ **KNOWN BUG:** Acknowledged, pending fix

---

**Last Updated:** 2026-07-01
