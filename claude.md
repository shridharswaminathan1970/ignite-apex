# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is
A B2B SaaS sales methodology platform. Reps use it to create demand,
qualify deals, diagnose root causes, and forecast with integrity.
Hosted at shaamelz.com (Netlify). Pure HTML/CSS/JS, no framework.
Backend: Supabase (Postgres + Auth + RLS).

**Dual-Mode Architecture:**
- UAT/Demo mode: localStorage-only (system/index.html) - no auth, local data
- Production mode: Supabase-first (app/index.html) - auth required, cloud sync

## Core Frameworks
- IGNITE: 6-stage demand creation (Identify, Go Deep, Nail the Insight,
  Initiate, Track & Nurture, Escalate)
- APEX: Rep operating code (Accurate, Pipeline-First, Evidence-Based,
  eXecution)
- 4U Qualification: Unworkable / Unavoidable / Urgent / Underserved
  These four conditions are the backbone of the entire sales diagnosis.
  They must be visible and active in EVERY stage of the process.

## Non-Negotiable Rules
1. Qualification verdicts are SYSTEM-DERIVED — never rep-entered
2. Probability scores are hardcoded:
   COMMIT=90%, BEST CASE=65%, PIPELINE+=40%, PIPELINE ONLY=20%, DISQUALIFIED=0%
3. All AI-generated content requires human review before saving
4. The 4U diagnosis must thread through IGNITE, PROBE, ATTRACT, EXECUTE
5. Service role key NEVER in any client-side file — anon key only

## Qualification System
- T1 Demand Gate: 5 questions (4U-derived), need 4/5 to pass
- T2 Opportunity Qualifier: 10 questions (MEDDPICC, Challenger Sale,
  SPIN Selling, Sandler, BANT, Command of the Message)
- T3 Forecast Commit Gate: 5 questions, ALL must pass for COMMIT

## Backend Architecture — Supabase

### Database Tables (public schema)

#### Core Tables
| Table           | Purpose                                               |
|----------------|-------------------------------------------------------|
| organisations  | One row per tenant. slug is unique URL identifier.    |
| users          | Extends auth.users. role = admin/manager/rep.         |
| configs        | One config per org (UNIQUE on org_id). Stores product |
|                | identity, 4U fields, and all AI-generated JSON.       |

#### CRM Tables (Migration 002)
| Table           | Purpose                                               |
|----------------|-------------------------------------------------------|
| leads          | Lead management. Raw contacts → IGNITE stages → MQL.  |
|                | Tracks: name, company, ignite_stage, t1_score, status.|
| activities     | Activity log for leads & opportunities. Types: call,  |
|                | email, meeting, demo, proposal, system_event.         |
| tasks          | Task management with reminders. Linked to leads/deals.|
|                | Fields: subject, priority, due_date, reminder_date.   |
| deal_timeline  | Audit trail for opportunities. Append-only log of all |
|                | stage changes, verdict changes, activities, tasks.    |

#### Sales Pipeline Tables
| Table           | Purpose                                               |
|----------------|-------------------------------------------------------|
| deals          | Opportunity metadata. Enhanced with converted_from_   |
|                | lead_id, sql_date, last_activity_date, next_task_date.|
| deal_states    | Versioned full-state JSONB snapshots per deal.        |
|                | Latest row = current state. Old rows = audit trail.   |
| weekly_reports | Weekly pipeline snapshots. UNIQUE per org/user/week/yr|

### RLS Model
- my_org_id() and my_role() are SECURITY DEFINER helpers used in all policies.
- Configs: all org members read; only admins write.
- Deals: reps see own; managers+admins see all in org.
- deal_states: inherits parent deal visibility.
- weekly_reports: reps see own; managers+admins see all.

### Signup Flow
1. client: supabase.auth.signUp({ email, password, data: { name } })
2. client: rpc('create_org_and_claim_admin', { p_org_name, p_slug, p_name })
   — atomically creates organisations row + users row (role=admin)
3. For invited reps: org_id + role passed in raw_user_meta_data at signup;
   the auth trigger handle_new_auth_user() creates the users row automatically.

### Key Design Decisions
- **Dual-Mode Architecture**: 
  - UAT mode (system/): localStorage-only, no auth, perfect for testing/demos
  - Production mode (app/): Supabase-first with localStorage write-through cache
- Deal IDs are UUIDs (crypto.randomUUID()). Legacy localStorage deals with
  non-UUID IDs are kept local-only and never synced to Supabase.
- loadConfig() is synchronous — reads from in-memory cache populated by
  db.init() — so the rest of the codebase needs zero changes.
- All writes go to localStorage first, then Supabase. This makes the app
  fully functional offline; Supabase writes are fire-and-forget.

## localStorage Keys
**UAT mode**: localStorage is source of truth (no Supabase connection)
**Production mode**: localStorage is write-through cache mirroring Supabase

- ignite_apex_config  → product config + 4U framework (mirrors configs table)
- ia_deal_registry    → array of deal stubs {id, prospect, verdict, savedAt}
- ia_deal_{id}        → full qualification state per deal (mirrors deal_states)
- ignite_apex_qual    → latest qualification snapshot for weekly report
- ia_weekly_W{n}_{y}  → weekly pipeline report data (mirrors weekly_reports)
- ia_admin_codes      → invite codes (admin page — not yet in Supabase)
- ia_admin_keys       → licence keys (admin page — not yet in Supabase)
- ia_anthropic_key    → user's Anthropic API key (configure page only)
- ia_pending_org      → temp: pending org claim after email confirmation

## Key Files

### Core Pages
- system/index.html    → main Sales OS (deal registry + all 6 modules +
                         3-tier qualification + report generation)
- app/index.html       → auth-gated version (login + full OS)
- configure/index.html → AI builder (Anthropic tool_use API)
- universal/index.html → manual 4-step config wizard
- weekly/index.html    → weekly pipeline report
- admin/index.html     → admin dashboard (codes, keys, users)

### CRM Pages (Migration 002)
- leads/index.html     → Lead list view with filters (My/Team/All)
- leads/detail.html    → Lead detail with tabs: Overview, Activity, Tasks, Notes
- opportunities/index.html → Enhanced deal registry with activity tracking
- opportunities/detail.html → Opportunity detail with timeline & tasks
- tasks/index.html     → Task manager (Today/Week/Overdue filters)
- dashboard/index.html → Role-based dashboard (pipeline, activities, forecast)

### Shared Components
- components/activity-log-modal.html → Modal for logging calls/emails/meetings
- components/task-modal.html         → Modal for creating/editing tasks
- components/activity-timeline.html  → Reusable timeline component
- components/lead-convert-modal.html → Convert lead to opportunity wizard

### JavaScript Data Layer
- nav.js               → shared navigation + IA global (localStorage helpers)
- supabase-client.js   → Supabase client + db object + patches IA.loadConfig /
                         IA.saveConfig. Load AFTER Supabase CDN, BEFORE nav.js.
- auth.js              → IA_Auth: signUp, signIn, signOut, getUser, resetPassword.
- crm-client.js        → CRM methods: leads, activities, tasks, dashboard data
- activity-logger.js   → Auto-logging for stage changes, conversions, qualifications
- task-reminder.js     → Multi-channel reminders (browser, email, badges, dashboard)

### Database Migrations
- supabase/migrations/001_initial_schema.sql → Initial DB schema + RLS
- supabase/migrations/002_crm_tables.sql     → CRM tables (leads, activities, tasks, timeline)

## Script Load Order (any page using Supabase)
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="../supabase-client.js"></script>
<script src="../auth.js"></script>
<script src="../nav.js"></script>
<!-- page-specific scripts last -->
```

## Critical Bugs Already Fixed
- Apostrophes in single-quoted JS strings silently kill all functions below them
- Always use template literals (backticks) for strings containing apostrophes
- T2/T3 questions render dynamically via renderTier2Questions() / renderTier3Questions()
- AI builder uses tool_use API (not text parsing) for guaranteed structured output

## Development Workflow

### UAT Testing (Local Mode)
Open standalone files directly in browser (no build, no auth required):
- Sales OS Template: `system/index.html` - full methodology, localStorage only
- AI Builder: `configure/index.html` - generates config with Anthropic API
- Manual Config: `universal/index.html` - build config step-by-step

**UAT mode characteristics:**
- No login required
- All data stays in browser localStorage
- Perfect for demos, training, trying the methodology
- Each user's browser = isolated environment

### Production Testing (Supabase Mode)
Test the full cloud-connected app:
- Auth app: `app/index.html` - requires signup/login
- Data syncs to Supabase in real-time
- Multi-user collaboration enabled
- Accessible from any device

### Deployment
Site is hosted on Netlify. Any push to main triggers auto-deploy.
No build process — pure static HTML/CSS/JS.

### Database Changes
1. Write migration in `supabase/migrations/` with sequential naming
2. Run in Supabase Dashboard → SQL Editor
3. Test RLS policies via client to verify permissions

## CRM Architecture (Migration 002)

### Lead-to-Opportunity Flow
**Lead Stage (IGNITE methodology)**:
1. Create raw lead → status = 'open'
2. Progress through IGNITE: I1 → G → N → I2 → T → E
3. Complete T1 Demand Gate (4/5 questions) → status = 'mql'
4. Convert lead to opportunity → status = 'converted'

**Opportunity Stage (APEX methodology)**:
1. Opportunity created (linked to original lead via converted_from_lead_id)
2. Work T2 Opportunity Qualifier (7/10 = SQL, marks sql_date)
3. Work T3 Forecast Commit Gate (5/5 = COMMIT)
4. Verdict: COMMIT (90%) | BEST CASE (65%) | PIPELINE+ (40%) | PIPELINE ONLY (20%)

### Activity Tracking
**Auto-logged activities** (system events):
- Lead stage changes: "Stage changed: Identify → Go Deep"
- Lead conversions: "Lead converted to Opportunity"
- Qualification results: "Passed T1 Demand Gate (4/5)"
- Task completions: "Task completed: [subject]"
- Deal verdict changes: "Verdict updated: PIPELINE+ → BEST CASE"

**Manually logged activities** (human interactions):
- Calls (outcome: Connected, VM, No Answer)
- Emails (with summary)
- Meetings (with attendees, duration, outcome)
- Demos, Proposals, LinkedIn interactions, Notes

Both appear in unified activity timeline, sorted chronologically (newest first).

### Task & Reminder System
**Multi-channel reminders**:
1. Browser push notifications (native, requires permission)
2. Email reminders (daily digest at 8am for overdue/due-today)
3. In-app badge counters (red badge on Tasks nav)
4. Dashboard alert section (prominent banner for overdue tasks)

Background worker checks tasks every 5 minutes, triggers notifications.

### Role-Based Access
- **Rep**: See own leads, opportunities, tasks | Create activities | Own dashboard
- **Manager**: See all team data | Reassign records | Team dashboard with rollup
- **Admin**: See entire org | Manage users/permissions | Org-wide dashboard

## CRM Deployment Status

### ✅ COMPLETE (Migration 002)
- Database schema with leads, activities, tasks, deal_timeline tables
- Full RLS policies for role-based access
- CRM data layer (crm-client.js) with all CRUD operations
- Auto-activity logging system (activity-logger.js)
- Multi-channel task reminders (task-reminder.js)
- Dashboard UI (crm/index.html)
- Lead management UI (crm/leads.html)
- Opportunity pipeline UI (crm/opportunities.html)
- Task manager UI (crm/tasks.html)

### 🚀 Ready to Deploy
Run migration 002, then access at: `https://shaamelz.com/crm/index.html`

### ⏳ Optional Enhancements (Future)
- Lead detail page with activity timeline
- Opportunity detail page with task list
- Activity log modal component
- Email/calendar integration (auto-log emails, sync tasks)
- Mobile responsive optimization
- Bulk actions (assign multiple records, update statuses)
- Advanced filters and saved views
- Export to CSV/PDF

## Known Gaps — Priority Order
1. ~~4U diagnosis missing from IGNITE, PROBE, ATTRACT, EXECUTE modules~~ DONE
2. ~~Data in localStorage — needs Supabase backend~~ DONE (migration 001)
3. ~~No activity tracking, task management, lead pipeline~~ DONE (migration 002)
4. Detail pages for individual leads/opportunities (optional)
5. Admin invite flow needs Edge Function (service role key required server-side)
6. deal_states grows unbounded — add a cleanup job to keep only last N per deal
7. Email/calendar integration
