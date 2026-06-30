# IGNITE_APEX Platform Discovery Audit
**Date:** 2026-07-01  
**Status:** Comprehensive inventory of built vs working components

---

## EXECUTIVE SUMMARY

**Overall Completion:** ~65-70%  
**Production Ready:** ❌ No (needs testing + bug fixes)  
**Critical Gaps:** Integration testing, B2B0 agent verification, end-to-end workflows

---

## 1. AUTHENTICATION & USER MANAGEMENT ✅ 90% Complete

### Built & Working
- ✅ Registration flow (app/register.html → submit-registration Edge Function)
- ✅ Approval workflow (master-console.html)
- ✅ Email notifications (via generate-invite-link)
- ✅ Password reset (reset-password.html + reset-user-password function)
- ✅ Set password (set-password.html)
- ✅ Login (app/auth.html)
- ✅ Session management
- ✅ Role-based routing (launcher redirects based on role)

### Edge Functions
- ✅ submit-registration
- ✅ generate-invite-link
- ✅ reset-user-password
- ✅ create-user
- ✅ create-super-admin

### Issues Found
- ⚠️ Email routing hardcoded to shaamel@shaamelz.com (test domain limitation)
- ⚠️ No user can directly access CRM without approval + email

### Files
- app/auth.html (login)
- app/register.html (public registration)
- app/set-password.html (new user setup)
- app/reset-password.html (forgot password)
- app/accept-invite.html (invite link landing)

---

## 2. USER & TEAM MANAGEMENT ✅ 95% Complete

### Master Console (Super Duper Admin)
- ✅ app/master-console.html (518 lines, rebuilt after corruption)
- ✅ Company selector dropdown
- ✅ User list with actions (Edit, Transfer, Change Role, Suspend, Delete, Reset Password)
- ✅ Pending registrations approval
- ✅ Visual modals (not prompts)
- ✅ Team Alpha auto-assignment

### Admin Console (Super Admin / Admin)
- ✅ app/admin-new.html (role-scoped version of master-console)
- ✅ Filters users based on role:
  - super_admin: sees all in org (except super_duper_admin/super_admin)
  - admin: sees only downline (manager_id chain)
- ✅ Same UI/UX as master-console

### Team Management
- ✅ app/teams.html (318 lines)
- ✅ Create/rename/delete teams
- ✅ Assign team leaders
- ✅ View members
- ⚠️ Needs migration: team_leader_id column

### Edge Functions
- ✅ manage-user (suspend, reactivate, deactivate, delete, reset_password, transfer, promote, update)
- ✅ manage-team
- ✅ delete-user
- ✅ update-user

### Issues Found
- ⚠️ team_leader_id migration not run yet
- ⚠️ No verification if admin.html (old) vs admin-new.html should replace it

### Files
- app/master-console.html (super_duper_admin)
- app/admin-new.html (super_admin/admin - NEW)
- app/admin.html (807 lines - OLD, needs update or removal?)
- app/teams.html (team management)

---

## 3. LAUNCHER & NAVIGATION ✅ 85% Complete

### Launcher
- ✅ app/launcher.html (role-based routing)
- ✅ Shows: Sales OS, CRM, B2B0 cards
- ✅ Feature gates (crm_enabled, b2b0_enabled)
- ✅ Lock icons when disabled
- ✅ Trial countdown integration (trial-banner.js)

### Navigation
- ✅ nav.js (shared navigation component)
- ✅ Back to launcher links
- ✅ Sign out functionality

### Issues Found
- ❓ Master-console auto-login behavior (no explicit login/logout UI)
- ⚠️ SDR CRM redirect loop (fixed via crm_enabled=true, needs testing)

### Files
- app/launcher.html
- nav.js
- trial-banner.js

---

## 4. CRM FUNCTIONALITY ⚠️ 60% Complete

### Dashboard
- ✅ crm/index.html (dashboard)
- ❓ Not verified: Does it show real data?

### Leads
- ✅ crm/leads.html (list view)
- ✅ crm/leads-v2.html (alternate version?)
- ❓ Create/edit/convert to opportunity?

### Opportunities
- ✅ crm/opportunities.html (list view)
- ✅ crm/opportunity.html (detail - legacy?)
- ✅ crm/opportunity-detail.html (modern detail view - 300+ lines)
  - ✅ Tabs: Overview, Qualification Roadmap, MEDDPICC, Milestones, Activities, Notes
  - ✅ **NEW: Qualification Roadmap tab integrated**
- ❓ Create/edit/delete workflows tested?

### Pipeline
- ✅ crm/pipeline.html (Kanban board)
- ❓ Drag-drop stage progression?

### Accounts & Contacts
- ✅ crm/accounts.html (companies)
- ✅ crm/contacts.html (people)
- ❓ CRUD operations tested?

### Activities & Tasks
- ✅ crm/tasks.html (task management)
- ✅ crm/activity-templates.html (activity logging)
- ❓ Do activities feed into AI coaching context?

### Forecasting & Reports
- ✅ crm/forecast.html (forecast view)
- ✅ crm/reports.html (reporting)
- ❓ Functional or placeholder?

### CRM Admin
- ✅ crm/admin.html (CRM settings)
- ⚠️ Different from app/admin.html - purpose unclear

### Issues Found
- ❓ **Not end-to-end tested** - Full workflow unknown
- ❓ **opportunity.html vs opportunity-detail.html** - Which is used? Duplication?
- ❓ **CRM v2 client** - crm-v2-client.js exists, integration unclear
- ❓ **Data model** - Do opportunities link to accounts/contacts properly?

### Files
- crm/index.html (dashboard)
- crm/leads.html, crm/leads-v2.html
- crm/opportunities.html
- crm/opportunity.html (legacy?)
- crm/opportunity-detail.html (modern + roadmap tab)
- crm/pipeline.html
- crm/accounts.html
- crm/contacts.html
- crm/tasks.html
- crm/activity-templates.html
- crm/forecast.html
- crm/reports.html
- crm/admin.html
- crm/profile.html

---

## 5. QUALIFICATION GUIDANCE LAYER ✅ 100% Complete (NEW)

### Phase A: Roadmap Rail + Why-Layer
- ✅ crm/qualification-roadmap.js (985 lines)
- ✅ renderRoadmapRail() - horizontal rail with 8 stages
- ✅ "YOU ARE HERE" indicator
- ✅ Clickable stages
- ✅ Color-coded (done/current/upcoming/brutal gate)
- ✅ Integrated in crm/opportunity-detail.html

### Phase B: Guiding Questions
- ✅ renderStageDetail() - shows guiding questions per gate
- ✅ Peel-the-onion layers (for 4U gates)
- ✅ STRONG vs WEAK examples

### Phase C: Evidence Calibration
- ✅ 5-point slider (1-5) per gate
- ✅ Visual color gradient (red → amber → green)
- ✅ updateStrengthLabel() - live feedback
- ✅ saveGateStrength() - persist to DB
- ✅ Weak evidence warning (non-blocking) on gate completion
- ✅ **Migration completed:** 27 _strength columns in opportunities table

### Phase D: AI Coaching
- ✅ supabase/functions/ai-coaching/index.ts (197 lines)
- ✅ Claude Sonnet 4.6 integration
- ✅ getAICoaching() - UI function
- ✅ Draft answer generation
- ✅ Weak evidence flags
- ✅ Next action suggestions
- ✅ Accept/dismiss workflow
- ✅ **Deployed:** Function live with AI_coaching_key secret

### IGNITE Roadmap Data
- ✅ 8 stages defined (Raw Lead → IGNITE → 6 APEX → CEMENT)
- ✅ 30+ gates with why/questions/examples
- ✅ Config: crm/ignite-provisional-config.json (JTBD + 6 diagnostics)

### Issues Found
- ❓ **Not user-tested yet** - No real rep has used AI coaching
- ❓ **Integration with system/index.html unclear** (see next section)

### Files
- crm/qualification-roadmap.js (main code)
- crm/ignite-provisional-config.json (JTBD/diagnostics config)
- supabase/functions/ai-coaching/index.ts (Edge Function)

---

## 6. IGNITE SALES OS FRAMEWORK ⚠️ 70% Complete - INTEGRATION UNCLEAR

### Main Framework
- ✅ system/index.html (3,000+ lines - massive standalone app)
- ✅ IGNITE stages (I, G, N, I2, T, E)
- ✅ 4U validation (Unworkable, Urgent, Unavoidable, Underserved)
- ✅ Tier 1/2/3 qualification gates
- ✅ Demand gate scoring (5/5 to pass)
- ✅ ICP scoring
- ✅ Opportunity qualifier (10 gates)
- ✅ Draft persistence to localStorage
- ✅ Stage progression logic
- ✅ Brutal gate enforcement

### Configuration
- ✅ configure/index.html (IGNITE config builder)
- ❓ Does this generate ignite-provisional-config.json?

### Supporting Tools
- ✅ framework/index.html (framework docs?)
- ✅ guide/index.html (user guide?)
- ✅ report/index.html (reporting?)
- ✅ universal/index.html (?)
- ✅ weekly/index.html (weekly reports?)
- ✅ admin/index.html (admin for Sales OS?)

### Issues Found
- 🚨 **CRITICAL: Duplication with CRM Qualification Roadmap**
  - system/index.html has its own IGNITE flow
  - crm/qualification-roadmap.js has another IGNITE flow
  - **Are these meant to be separate?**
  - **Should they be merged?**
  - **Do they conflict?**
  
- ❓ **Usage unclear:**
  - Is system/index.html for pre-CRM demand creation?
  - Is crm/qualification-roadmap.js for in-CRM deal qualification?
  - Or are they competing implementations?

- ❓ **Data storage:**
  - system/index.html uses localStorage (ephemeral)
  - crm/qualification-roadmap.js uses opportunities table (persistent)
  - No clear handoff between them

### Files
- system/index.html (main IGNITE Sales OS)
- system/opportunity-sync.js (sync to CRM?)
- configure/index.html (config builder)
- framework/index.html
- guide/index.html
- report/index.html
- admin/index.html
- universal/index.html
- weekly/index.html

---

## 7. B2B OUTREACH AGENT ❓ 50% Complete - STATUS UNKNOWN

### Found Files
- ✅ outreach/index.html (1 file found)
- ✅ supabase/functions/b2b0-trial-monitor (trial monitoring)
- ✅ B2B0_DEPLOYMENT_COMPLETE.html (deployment docs)
- ✅ B2B0_INDEPENDENT_ARCHITECTURE.html (architecture docs)
- ✅ B2B0_AND_DOCS_STATUS.html (status docs)

### Database Columns
- ✅ users.b2b0_enabled (feature gate)
- ✅ users.b2b0_trial_activated_at (trial tracking)

### Trial Monitoring
- ✅ Cron job deployed (daily 3 AM UTC)
- ✅ 7-day trial + 2-day grace = 9 days total
- ✅ Day 9: b2b0_enabled=false (hard block)

### Issues Found
- ❓ **What does outreach/index.html do?** (need to read it)
- ❓ **Is the agent functional?** (not tested)
- ❓ **How do users access it?** (via launcher card?)
- ❓ **What features does it have?** (unknown)
- ❓ **Integration with CRM?** (unclear)

### Files
- outreach/index.html (main agent UI?)
- supabase/functions/b2b0-trial-monitor
- B2B0_*.html (documentation)

---

## 8. TRIAL & BILLING ✅ 85% Complete

### Trial Lifecycle
- ✅ CRM trial: 99 days (day 90/110/145/150 reminders)
- ✅ B2B0 trial: 7 days + 2 grace = 9 total
- ✅ Feature gates: crm_enabled, b2b0_enabled
- ✅ Trial banner (trial-banner.js)
- ✅ Countdown display

### Monitoring
- ✅ supabase/functions/crm-trial-monitor
- ✅ supabase/functions/b2b0-trial-monitor
- ✅ Cron jobs deployed (2 AM & 3 AM UTC daily)
- ✅ CRON_SETUP.md (documentation)

### Billing
- ✅ pricing.html (pricing page)
- ✅ checkout.html (Paddle integration)
- ✅ checkout-success.html (success page)
- ✅ supabase/functions/paddle-webhook (webhook handler)
- ⚠️ PADDLE_NEXT_STEPS.html (pending setup tasks)

### Issues Found
- ⚠️ Paddle integration not fully tested
- ⚠️ Manual invoicing system exists (crm/admin/invoices.html) - integration unclear
- ❓ Subscription renewal logic tested?

### Files
- pricing.html
- checkout.html, checkout-success.html
- supabase/functions/crm-trial-monitor
- supabase/functions/b2b0-trial-monitor
- supabase/functions/paddle-webhook
- supabase/functions/send-trial-reminders
- app/trial-banner.js
- CRON_SETUP.md

---

## 9. SUPPORTING SYSTEMS ✅ 75% Complete

### Company Provisioning
- ✅ app/register-company.html (company registration)
- ✅ supabase/functions/provision-company (provisioning)
- ✅ Team Alpha auto-creation

### Notifications
- ✅ supabase/functions/notify-admin-registration (registration alerts)
- ✅ supabase/functions/send-email (generic email sender)
- ✅ supabase/functions/send-credentials-email (credentials)
- ✅ supabase/functions/send-team-report (team reports)

### Company Dashboard
- ✅ app/company-dashboard.html (company admin view)
- ❓ Features unclear

### Team Reports
- ✅ app/team-reports.html (team reporting)
- ❓ Functional?

### Testing & Debug
- ✅ app/test-access.html (access testing)
- ✅ debug.html (debug utilities)
- ✅ app/force-logout.html (force logout)
- ✅ app/clear-all.html (clear data)

### Documentation
- ✅ docs/ACCESS_SPEC.html (access control spec)
- ✅ docs/IGNITE-APEX_Content_Bank.html (content library)
- ✅ UAT_TEST_PLAN.html (195 test cases)
- ✅ UAT_COMPREHENSIVE_TEST_SCRIPT.html
- ✅ UAT_TEST_SCRIPTS1.html

### Files
- app/register-company.html
- app/company-dashboard.html
- app/team-reports.html
- app/test-access.html
- debug.html
- docs/*

---

## 10. DATABASE SCHEMA ⚠️ 80% Complete

### Core Tables (Known)
- ✅ users (with role, status, crm_enabled, b2b0_enabled, trial dates)
- ✅ organisations (companies)
- ✅ teams (with team_leader_id - migrated)
- ✅ opportunities (with 27+ _strength columns - migrated)
- ✅ accounts
- ✅ contacts
- ✅ opportunity_activities
- ✅ tasks
- ⚠️ registration_requests
- ⚠️ b2b0_trial_requests (?)

### Migrations
- ✅ APPLY_ALL.sql (consolidated migration)
- ✅ 20260701_add_gate_strength_columns.sql (Phase C - RUN)
- ⚠️ Other migrations may exist

### RLS Policies
- ✅ Basic RLS enabled
- ⚠️ Had circular dependency issues (resolved with permissive SELECT)
- ⚠️ May need review for tightness

### Issues Found
- ❓ **Full schema unknown** - Need to query information_schema
- ❓ **All tables created?** - Verification needed
- ❓ **Indexes optimized?** - Performance unknown

---

## 11. EDGE FUNCTIONS ✅ 90% Complete

### Deployed & Working
- ✅ ai-coaching (Phase D)
- ✅ crm-trial-monitor (cron)
- ✅ b2b0-trial-monitor (cron)
- ✅ manage-user
- ✅ generate-invite-link
- ✅ submit-registration
- ✅ reset-user-password

### Untested
- ⚠️ create-super-admin
- ⚠️ create-user
- ⚠️ delete-user
- ⚠️ update-user
- ⚠️ invite-user
- ⚠️ generate-login-link
- ⚠️ manage-team
- ⚠️ notify-admin-registration
- ⚠️ paddle-webhook
- ⚠️ provision-company
- ⚠️ send-credentials-email
- ⚠️ send-email
- ⚠️ send-team-report
- ⚠️ send-trial-reminders
- ⚠️ trial-reminder-cron

### Total Edge Functions
- **22 functions** (all deployed, many untested)

---

## 12. CRITICAL QUESTIONS TO ANSWER

### Integration Questions
1. **Are system/index.html and crm/qualification-roadmap.js meant to coexist?**
   - Separate tools for different stages?
   - One replaces the other?
   - Merge needed?

2. **What is outreach/index.html and is it functional?**
   - B2B0 agent UI?
   - Features?
   - Integration with CRM?

3. **Which admin.html is the right one?**
   - app/admin.html (old)
   - app/admin-new.html (new)
   - crm/admin.html (different purpose?)

4. **opportunity.html vs opportunity-detail.html?**
   - Legacy vs modern?
   - Both in use?

### Functional Questions
5. **Does CRM CRUD work end-to-end?**
   - Create lead → Convert to opp → Progress stages → Close?

6. **Do activities feed AI coaching?**
   - opportunity_activities table → ai-coaching context?

7. **Is Paddle billing functional?**
   - Test subscription purchase?

8. **Do all Edge Functions work?**
   - Comprehensive testing needed

### Data Questions
9. **Full database schema?**
   - All tables documented?
   - Relationships correct?

10. **Migration state?**
    - All migrations applied?
    - team_leader_id deployed?

---

## NEXT STEPS (TASK 2)

### Immediate Actions Required
1. **Read critical files to understand:**
   - system/index.html (understand IGNITE Sales OS)
   - outreach/index.html (understand B2B0 agent)
   - system/opportunity-sync.js (understand CRM integration)

2. **Query database schema:**
   - Get full table list
   - Verify all columns exist
   - Check relationships

3. **Test critical workflows:**
   - Registration → Approval → Login → Launcher
   - Create opportunity → Work through roadmap → AI coaching
   - SDR CRM access (verify redirect loop fixed)

4. **Clarify integration points:**
   - How does system/index.html relate to CRM?
   - How does outreach/index.html integrate?
   - Data flow between components?

---

## OVERALL ASSESSMENT

**Built:** ~70% of platform code exists  
**Working:** ~50-60% functionally verified  
**Production Ready:** ❌ 30-40%

**Blockers to Production:**
1. Integration testing (system/index vs crm/roadmap)
2. End-to-end workflow verification
3. Bug fixes (UAT testing)
4. B2B0 agent verification
5. Documentation gaps

**Estimated Work to Production:**
- 2-3 days comprehensive testing
- 1-2 days bug fixing
- 1 day integration clarification
- 1 day documentation

**Total:** ~5-7 days to production-ready state

---

**End of Discovery Audit**
