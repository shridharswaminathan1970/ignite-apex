# IGNITE-APEX — Access, Roles & Capabilities Specification

**Status:** Canonical source of truth for roles, access, and permissions.  
**Version**: 2.0  
**Last Updated**: 2026-06-15  
**Backend:** Supabase (project `gokslnrvxqledagcwghq`), enforced by Row-Level Security.  
**Apps:** Sales OS (`/system`), CRM (`/crm`), shared shell (`/app`: auth, launcher, admin/master consoles).

---

## §1. Principles

1. **Multi-tenant.** Every company is an `organisation` (org). Every company user carries that company's `org_id`. Data is isolated per company.
2. **Security is in the database, not the UI.** RLS enforces who-sees-what and who-can-edit-what. Hiding buttons is cosmetic only.
3. **Nobody types a company ID.** A user created/invited by someone inside a company inherits that company automatically (server-side).
4. **Invite-based onboarding.** New users get an emailed link to set their own password. Existing passwords are never revealed or emailed (they are hashed and cannot be read back) — only fresh set-password/reset links are sent.
5. **The pipeline is diagnostic-gated.** CRM stage progression is driven by the IGNITE-APEX Sales OS qualification. A deal only advances when that stage's diagnostic is satisfied.

---

## §2. Roles

| Role | Meaning |
|---|---|
| `super_duper_admin` | **Platform Master** (muhammad.shaamel@gmail.com). Above all companies. Provisions companies and their super admins. Can do anything. |
| `super_admin` | **Company Owner.** Created by super_duper_admin. Full control of one company. Can CRUD all users in company, promote/demote, assign/reassign users and roles. Views everything under company. |
| `admin` | **Sales Manager.** Runs a team. Full CRUD on team users and team data. Can create/edit/delete team members. Manages team pipeline, reports, forecasts. |
| `admin_m` | **Management (Read-Only).** Company-wide oversight. Can VIEW everything in company, CANNOT edit anything. No user management. |
| `sdr` | **Team Lead.** Works own deals + coordinates team. Can assign/reassign team leads, manage team pipeline/forecast/reports. CANNOT create/edit/delete users. |
| `account_executive` | **Sales Executive.** Works own deals only. No team visibility. No admin powers. |
| `public` | **Evaluator.** Sales OS only, own data, no company, CRM locked. |

### Role Hierarchy

```
super_duper_admin (Platform Master - muhammad.shaamel@gmail.com)
  └── super_admin (Company Owner - full company CRUD + promote/demote)
      ├── admin (Sales Manager - team user CRUD + team data management)
      │   ├── sdr (Team Lead - coordinate team work, NO user CRUD)
      │   │   └── account_executive (subordinates managed by Team Lead)
      │   └── account_executive (Individual Contributor)
      └── admin_m (Management - Company-wide READ ONLY)
```

### Detailed Role Capabilities

#### super_duper_admin
- **Scope**: All organizations across platform
- **Access**: Full CRUD on everything
- **UI**: Master Console
- **Capabilities**: Provision companies, invite super_admins, manage all users/data, reset any password, deactivate any user

#### super_admin
- **Scope**: Own organization only
- **Access**: Full CRUD on all data in own org
- **UI**: Company Dashboard, Team Reports, CRM, Sales OS
- **Capabilities**: Manage company profile, invite/manage users within company, full data access, view/edit all reports

#### admin
- **Scope**: Self + downline (recursive via manager_id)
- **Access**: Full CRUD on own records + downline records
- **UI**: Team Reports, CRM, Sales OS
- **Capabilities**: Manage downline users, work own + team deals, create/edit reports, invite sdr/account_executive to team

#### admin_m (Read-Only Manager)
- **Scope**: Whole company (view-only)
- **Access**: READ ONLY on entire company
- **UI**: Team Reports (read-only), CRM (read-only), Sales OS (read-only)
- **Capabilities**: Monitor company-wide performance, view all reports, NO data editing, NO user management, CAN email reports

#### sdr (Team Lead)
- **Scope**: Own records (full CRUD) + team coordination (assign/reassign leads, manage pipeline)
- **Access**: 
  - WRITE: Own records (full CRUD) + can assign/reassign team leads (limited admin power)
  - READ: Own + downline (via app_manages) - full team visibility
  - Reports: Can CREATE/EDIT/DELETE team reports (like admin but team-scoped)
  - Pipeline/Forecast: Can manage team pipeline and forecast
  - Stage Movement: Can move own deals + can reassign team deals
  - User Management: NO (cannot create/edit/delete users)
- **UI**: CRM, Sales OS, Team Reports (full management)
- **Capabilities**: Work own pipeline, coordinate team work (assign leads, manage pipeline), create team reports, NO user CRUD (cannot hire/fire)

**SDR vs Admin:** SDR is "Team Lead" - can coordinate work (reassign leads, manage pipeline/reports) but cannot manage users (hire/fire/edit roles). Admin has full user management for team.

**SDR vs Account Executive:** Account Executive works only own records in isolation. SDR additionally coordinates team (assign leads, manage team pipeline/reports).

#### account_executive
- **Scope**: Own records only
- **Access**: Full CRUD on own records, can edit weekly_reports
- **UI**: CRM, Sales OS
- **Capabilities**: Work own pipeline, close deals, submit reports, move own deals through stages, can email own report to manager

#### public (Free Tier)
- **Scope**: Own records only
- **Access**: Full CRUD on own records
- **UI**: Sales OS only (CRM locked)
- **Capabilities**: Basic sales workflow, IGNITE diagnostic on own leads, upgrade required for CRM
- **Isolation**: Parked under "NA" holding company, cannot see other public users' data (RLS filters by auth.uid())

---

## §3. Data Access — core CRM records

**Tables**: `leads`, `opportunities`, `deals`, `accounts`, `contacts`, `activities`, `tasks`

| Role | Can VIEW | Can CREATE / EDIT / DELETE | Can ASSIGN/REASSIGN leads | Move leads through stages |
|---|---|---|---|---|
| super_duper_admin | all companies | all companies | all | all |
| super_admin | whole company | whole company | whole company | whole company |
| admin | self + team (full downline) | self + team (full downline) | self + team | yes (own + team) |
| admin_m | whole company | **nothing — view only** | **no** | no |
| sdr | self + team (full downline) | **self only** | **yes (team leads)** | yes (own only, but can reassign team deals) |
| account_executive | self only | self only | **no** | yes (own only) |
| public | self (Sales OS only) | self (Sales OS only) | **no** | yes (own only) |

### Owner Column Names (by table)
- `leads`: `lead_owner_id`
- `opportunities`: `owner_id`
- `deals`: `assigned_to`
- `accounts`: `account_owner_id`
- `contacts`: `contact_owner_id`
- `activities`: `owner_id`
- `tasks`: `assignee_id`

---

## §4. Reports, Dashboards, Forecasts, Closed-Won / Closed-Lost

**Tables**: `weekly_reports` and all derived pipeline/forecast/win-loss views

| Role | View | Create/Edit/Delete reports | Email a report (see §7) |
|---|---|---|---|
| super_duper_admin | all | yes | yes |
| super_admin | whole company | yes | yes |
| admin | self + team | yes (own + team) | yes |
| admin_m | whole company | **no — view only** | yes |
| sdr | self + team | **yes (team reports)** | yes (team reports) |
| account_executive | self | **yes (own reports)** | own report to own manager only |
| public | self | no | no |

**Key Distinction**: Closing one's *own* deal (won/lost status on a record you own) is a normal data action under §3 — it is **not** restricted by this report-layer rule. The restriction here applies to the aggregate report/forecast layer.

**Effect**:
- admin_m can VIEW all reports company-wide but cannot CREATE/EDIT/DELETE
- sdr can VIEW own + team reports but cannot CREATE/EDIT/DELETE
- account_executive cannot create/edit aggregate reports (separate from closing own deals)

---

## §5. User Management — who can create / edit / delete / invite whom

| Actor | Can create & invite | Can edit | Can delete / deactivate | Can promote/demote roles | Can send login / reset link |
|---|---|---|---|---|---|
| super_duper_admin | a new company + its `super_admin` | any user, any company | any | any | any |
| super_admin | `admin`, `admin_m`, `sdr`, `account_executive` (own company) | own-company users | own-company users | **yes (own company)** | own-company users |
| admin | `sdr`, `account_executive` (their own team) | their team | their team | **yes (team only)** | their team |
| admin_m | none | none | none | **no** | none |
| sdr | **none (Team Lead cannot CRUD users)** | **none** | **none** | **no** | **none** |
| account_executive | none | none | none | **no** | none |
| public | none | none | none | **no** | none |

**Inheritance Rules**:
- Every user an actor creates inherits the actor's `org_id` automatically
- For users created by `admin`: `manager_id` = the admin
- No company ID is ever entered by hand
- New user receives invite link with `redirectTo = https://shaamelz.com/app/set-password.html`

---

## §6. Credential Actions

### Password Management

- Control panels expose a **"Send login link"** action per user
- This sends the user a **set-password / recovery link** by email (Supabase `generateLink` type `recovery`)
- Link redirects to: `https://shaamelz.com/app/set-password.html`
- **Existing passwords are never displayed or emailed** — they are hashed and unreadable
- Temporary passwords are NOT used by default (invite link model only)

### Invite Link Flow (Email Scanner Protected)

**Implementation**:
1. Edge Function generates PKCE recovery link with `redirectTo`
2. Link expires after 3600 seconds (1 hour, configurable in Supabase)
3. Landing page (`set-password.html`) uses **two-stage activation**:
   - Stage 1: Detect token but don't consume (shows "Continue to Set Password" button)
   - Stage 2: User clicks button → token exchanged via `exchangeCodeForSession()`
4. **Why**: Email scanners pre-fetch links but don't click buttons → token not consumed by scanner
5. User sets password → auto-routed to workspace based on role + crm_enabled

**Security**:
- Single-use tokens (consumed on first exchange)
- PKCE flow (code exchange, not direct tokens in URL)
- Clear error messages for expired/used links
- "Request New Link" recovery flow

---

## §7. Report-Email Actions

Authorised actors (`admin`, `admin_m`, `super_admin`, `super_duper_admin`) can email a report or dataset — leads, pipeline, forecast, closed-won, closed-lost — directly from the screen it's shown on.

**Recipients:**
- **To:** the company's Management (`admin_m`) via `organisations.contact_email`
- **Cc:** the subordinate who owns the data in that report
- Optionally Cc the sender

**Authorization**:
- `sdr` and `account_executive` may email only their *own* report, and only to their own manager
- Report data automatically filtered by RLS (app_manages) — cannot email data user doesn't have access to

**Implementation Status**: 
- Edge Function authorization: ✅ Complete
- Email sending: 🟡 Stub (integration with SendGrid/Resend pending)

---

## §8. Sales OS ↔ CRM — two lenses, one data layer, diagnostic-gated

**Sales OS and the CRM are not two systems — they are two lenses over the same records.** The Sales OS is the diagnostic/qualification lens; the CRM is the full-lifecycle management lens. Both read and write the same `leads` / `opportunities` / `deals`, which already carry the diagnostic state (`ignite_data`, `attract_data`, `probe_data`, `execute_data`).

### Two-Lens Model

- **`crm_enabled` decides how many lenses a user can open** — it is an access flag, never a second copy of the data.
  - `crm_enabled = false` (casual/public) → Sales OS lens only
  - `crm_enabled = true` (company users) → both lenses available
- **Switching is seamless and lossless.** A casual user later registered to a company does not migrate anything — flipping `crm_enabled` to true simply unlocks the CRM lens onto the records they already created. Nothing copies.
- **Same data, different views**: Sales OS shows IGNITE diagnostic progress, CRM shows full pipeline with accounts/contacts/activities

### Diagnostic-Gated Lifecycle

**Applies to ALL users (public, company users, all roles) working deals:**

1. **Lead created** → the **IGNITE** portion of the diagnostic runs (6-question / 4U qualification)
2. **If it qualifies** → converts to an **opportunity** and enters the pipeline
   - **If not** → stays a lead or becomes a **cold lead** (never converts)
3. The **APEX** stages (Attract → Probe → Execute) each have their own diagnostic gate
4. The opportunity advances **stage-by-stage only as each gate is satisfied** → ending in **closed-won** or **closed-lost**
5. The qualification result is **stored on the deal** (`ignite_data`, `attract_data`, `probe_data`, `execute_data`)
6. Result is **checked on every stage move**, anywhere the CRM shows leads/opportunities/stages

### Manual vs Automatic Movement

The diagnostic determines *eligibility*; movement is configurable:

- **Automatic** (default for lead → opportunity): Advance the moment a stage's gate passes
- **Manual with gate check** (default inside pipeline): Rep advances/drags, system validates gate first, blocks move if unmet
- **Configuration**: Per-stage setting (stored in `diagnostic_config` table)

### RLS Integration

- A person can only advance deals they're allowed to write (§3)
- Stage movement blocked if:
  1. User doesn't own/manage the deal (RLS WRITE check)
  2. Diagnostic gate not satisfied (qualification check)

---

## §9. Login & Onboarding Flow

### §9.1. Entry Point

**One front door — `shaamelz.com`:** Log in / Sign up only. The system routes after auth; users never type app URLs.

### §9.2. Casual / Free Sign-Up (public, self-serve)

**Flow**:
1. User self-registers at `https://shaamelz.com` (Supabase auth UI)
2. User parked under the **NA** holding company:
   - `role = 'public'`
   - `crm_enabled = false`
   - `org_id = NA company UUID`
   - `account_type = 'casual'`
3. NA holds *only* casual users — never real company users
4. Supabase sends set-password email automatically (no manual master invite for this tier - keep free sign-up frictionless)
5. User opens link → sets and confirms password → auto-logged in → routed into **Sales OS**
6. **Platform notification**: On successful registration, send Platform Master (`muhammad.shaamel@gmail.com`) a signup notification:
   - User's email
   - Company: NA
   - Timestamp
   - **Never the password** (passwords are hashed and must never be transmitted)
7. **In the app**: Sales OS available, CRM button/card disabled with popup:
   > "You need to register under a company to use the CRM. To request access, email platform admin muhammad.shaamel@gmail.com."

**Isolation**:
- Casual users share the NA org but RLS isolates them: `public` role sees only records where `owner_col = auth.uid()`
- They cannot see each other's data despite same org_id
- If later added to a real company: `org_id` changes, `crm_enabled` flips to true → seamless upgrade

### §9.3. Company Provisioned (by Platform Master)

**Flow**:
1. super_duper_admin goes to Master Console → "Provision New Company"
2. Enter: company name, address, contact email/phone + super admin name/email
3. Backend:
   - Creates `organisations` record (with slug)
   - Creates `super_admin` user tagged to that org
   - Generates invite link (PKCE recovery type)
4. Invite link emailed or shown to master for manual distribution
5. Invited super admin opens link → sets password → lands as `super_admin` of that org (never defaulted to `public`)

### §9.4. Login Routing (after session + profile fully loaded)

**Critical**: Never redirect on a half-loaded state — await FULL profile including role, org_id, crm_enabled before any routing decision.

**Router Logic** (`/app/launcher.html`):
```javascript
await session = getSession()
await profile = getProfile(session.user.id) // role, org_id, crm_enabled, is_active

if (profile.role === 'super_duper_admin') → /app/master-console.html
if (profile.role === 'super_admin') → /app/company-dashboard.html

if (profile.role IN ['admin','admin_m','sdr','account_executive']) {
  if (profile.crm_enabled) → /crm/index.html
  else → /system/index.html
}

if (profile.role === 'public') → /system/index.html (CRM locked)
```

**Terminal Error Pages**: If unauthorized, show terminal error (no redirect loop). User sees "Access Denied" with "Back to Launcher" link — page does NOT auto-redirect again.

### §9.5. Workspace Headers

**All workspaces must show**:
- Company name (from `organisations.name` via `profile.org_id`)
- User name + role badge
- Logout button

**Current Status**:
- ✅ Launcher shows company name
- 🟡 CRM and Sales OS workspaces: company name missing (minor UX issue, non-blocking)

### §9.6. Team Building

**Flow**:
1. super_admin or admin navigates to user management UI
2. Clicks "Add Team Member" → modal opens
3. Fills: name, email, role, manager (dropdown), crm_enabled checkbox
4. Clicks "Send Invitation"
5. Backend:
   - Creates user in `auth.users` with random password
   - Creates profile in `public.users` with inherited `org_id`
   - Sets `manager_id` (for admin-created users)
   - Generates invite link → returns to UI
6. UI shows invite link with "Copy Link" button
7. Admin sends link to new user (email, Slack, etc.)
8. New user follows §6 invite flow

---

## §10. RLS Implementation (policy logic)

### Helper Functions

Already deployed in `001_rbac.sql`:

```sql
app_role() -- Returns current user's role
app_org() -- Returns current user's org_id
app_manages(target_user_id UUID) -- TRUE if target is current user or in their downline (recursive)
```

**app_manages Logic**:
- Recursive CTE walks `manager_id` chain upward from target
- Returns TRUE if `auth.uid()` appears in the chain
- Used for hierarchical permissions (admin, admin_m, sdr can read their downline)

### Core Data Tables Policy Pattern

**Tables**: `leads`, `opportunities`, `deals`, `accounts`, `contacts`, `activities`, `tasks`

Replace `owner_col` / `org_col` with each table's real column names (see §3).

```sql
-- READ Policy
CREATE POLICY {table}_select ON public.{table}
  FOR SELECT
  USING (
    app_role() = 'super_duper_admin'
    OR (org_col = app_org() AND (
          app_role() IN ('super_admin','admin_m')
          OR app_manages(owner_col)))
  );

-- WRITE Policy (INSERT/UPDATE/DELETE)
CREATE POLICY {table}_insert ON public.{table}
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_col = app_org() AND (
          app_role() = 'super_admin'
          OR (app_role() = 'admin' AND app_manages(owner_col))
          OR (app_role() IN ('sdr','account_executive','public') 
                AND owner_col = auth.uid())))
  );

-- Similar for UPDATE/DELETE with USING instead of WITH CHECK
```

**Effect**:
- super_duper_admin: bypasses all checks
- super_admin, admin_m: see whole company
- admin: sees self + downline, writes self + downline
- sdr: sees self + downline, writes **self only**
- account_executive, public: see and write **self only**

### Report/Forecast Tables Policy Pattern

**Tables**: `weekly_reports`, forecast tables

Same READ policy as core data, but WRITE **excludes sdr and admin_m**:

```sql
-- WRITE Policy (sdr and admin_m excluded)
CREATE POLICY weekly_reports_insert ON public.weekly_reports
  FOR INSERT
  WITH CHECK (
    app_role() = 'super_duper_admin'
    OR (org_col = app_org() AND (
          app_role() = 'super_admin'
          OR (app_role() = 'admin' AND app_manages(owner_col))
          OR (app_role() = 'account_executive' AND owner_col = auth.uid())))
  );
```

### Special Tables

**Config tables** (`configs`): org-wide read, `super_admin`/master write  
**Platform tables** (`app_settings`): master / super_admin only  
**`deal_states`** (no own owner/org): gate access via its parent `deal`  
**`users`**: See existing policy in `001_rbac.sql` (users can read managed users, write needs permission)

---

## §11. Migration History

| Migration | Description | Status |
|-----------|-------------|--------|
| 001_rbac.sql | Initial RLS + helper functions | ✅ Applied |
| 002_fix_configs_policies.sql | Fixed configs table policies | ✅ Applied |
| 003_cleanup_old_policies.sql | Removed manual dashboard policies | ✅ Applied |
| 004_onboarding_flow.sql | Company contact fields, initial sdr read-only (WRONG) | ✅ Applied |
| 005_fix_sdr_permissions.sql | **Fixed sdr to WRITE own + READ team** | ✅ Applied |

**Current schema version**: 005

**Next**: 006_diagnostic_tables.sql (when diagnostic-gated pipeline is implemented)

---

## §12. Edge Functions Inventory

| Function | Purpose | Authorization | Status |
|----------|---------|---------------|--------|
| provision-company | Create org + super_admin | super_duper_admin only | ✅ Deployed |
| generate-invite-link | Invite team member | super_admin, admin | ✅ Deployed |
| generate-login-link | Send password reset | super_admin (own org) | ✅ Deployed |
| reset-user-password | Reset password (master) | super_duper_admin only | ✅ Deployed |
| send-team-report | Email team report | super_admin, admin, admin_m, sdr | 🟡 Stub (auth works) |

**All functions**:
- Verify JWT via service_role admin API
- Check caller authorization before executing
- Return clear errors on failure
- Use service_role key for admin operations

---

## §13. Acceptance Checklist

**Authentication & Session**:
- [ ] Login routes cleanly by role — no redirect loop
- [ ] Session persists across page reloads
- [ ] Logout works from any page
- [ ] No redirect loops on any page

**Casual / Public User Flow**:
- [ ] Public user: Sales OS only, CRM locked with upgrade message
- [ ] Self-registration creates user under NA company
- [ ] Public users isolated from each other (cannot see each other's data)
- [ ] Platform master receives signup notification (email only, no password)

**Company Provisioning**:
- [ ] Invited super_admin lands as `super_admin` of their own company (not `public`)
- [ ] Super_admin sees company profile (name, address, contact)
- [ ] Super_admin sees only their company data (cross-company isolation)

**Team Building**:
- [ ] Invited team member inherits company automatically; no company ID typed
- [ ] Invite link displays with copy-to-clipboard
- [ ] Invite link survives email scanner pre-fetch (two-stage activation)
- [ ] Password setup routes to correct workspace

**Data Access - Core Tables**:
- [ ] AE: creates and stage-advances only their own leads; sees only their own data
- [ ] SDR: creates/stage-advances their own leads; sees (read-only) their team; cannot edit team records
- [ ] SDR: cannot manage users; read-only on reports
- [ ] admin: full CRUD on self + team; can create/edit/delete/invite their team
- [ ] admin_m: views everything company-wide, edits nothing
- [ ] super_admin: full company control + all company user management

**Data Access - Reports**:
- [ ] SDR can view reports (own + team) but cannot create/edit
- [ ] admin_m can view reports company-wide but cannot create/edit
- [ ] account_executive cannot create aggregate reports (can close own deals)
- [ ] admin can email reports to admin_m + owning subordinate

**Cross-Company Isolation**:
- [ ] Company A users never see Company B data
- [ ] Public users (NA company) cannot see each other's data

**Diagnostic-Gated Pipeline** (when implemented):
- [ ] Pipeline stage moves blocked unless stage's IGNITE diagnostic is satisfied
- [ ] Diagnostic state stored on deal record
- [ ] Qualification checked on every stage move

---

## §14. Two-Lens Model Implementation Notes

### Database Schema

**No separate tables**: Both lenses use same tables (`leads`, `opportunities`, `deals`)

**Diagnostic columns on deals**:
```sql
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS ignite_data JSONB;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS attract_data JSONB;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS probe_data JSONB;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS execute_data JSONB;
```

**Structure**:
```json
{
  "completed": true,
  "score": 78,
  "passed": true,
  "completed_at": "2026-06-15T10:30:00Z",
  "responses": [
    {"question": "I1", "answer": "High cost", "score": 8},
    {"question": "G1", "answer": "Strong interest", "score": 9}
  ]
}
```

### UI Routing

**Sales OS** (`/system/index.html`):
- Shows IGNITE diagnostic interface
- Focuses on qualification questions
- Available to all roles (including public)

**CRM** (`/crm/index.html`):
- Shows full pipeline with accounts/contacts
- Uses diagnostic state from same deals
- Only available if `crm_enabled = true`

**User with `crm_enabled = true`**:
- Can open both `/system` and `/crm`
- Sees same deals in both places
- Diagnostic completed in Sales OS → visible in CRM
- Deal moved in CRM → diagnostic state checked

---

## §15. Security Model

### Defense Layers

1. **RLS**: Database-level row filtering (primary security boundary)
2. **JWT**: Session authentication via Supabase Auth
3. **Edge Functions**: Server-side validation with service_role key
4. **UI Guards**: Client-side role checks (convenience, not security)

### Trust Model

- **Never trust client**: All permissions enforced server-side (RLS + Edge Functions)
- **JWT is source of truth**: `auth.uid()` determines user identity
- **Profile is authoritative**: `public.users` table determines role/org
- **RLS is final arbiter**: Even if UI allows action, RLS blocks unauthorized writes

### Data Leakage Prevention

- All SELECT queries filtered by RLS (org_id + app_manages)
- No cross-org data visible (except super_duper_admin)
- Manager hierarchy prevents lateral access (peer cannot see peer)
- `public.users` table has RLS to prevent role escalation

---

## Appendix A: Quick Reference

### Role Capabilities Matrix

| Capability | super_duper | super_admin | admin | admin_m | sdr | AE | public |
|------------|-------------|-------------|-------|---------|-----|----|----|
| See all orgs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| See own org (all) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| See downline | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit own data | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Edit downline data | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access CRM | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ❌ |
| Access Sales OS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*if crm_enabled=true

### RLS Pattern Quick Reference

**Core Data** (leads, opps, deals, etc.):
- READ: super_duper OR (own org AND (super_admin/admin_m OR manages owner))
- WRITE: super_duper OR (own org AND (super_admin OR (admin manages) OR (sdr/AE/public owns)))

**Reports/Forecasts**:
- READ: same as core data
- WRITE: super_duper OR (own org AND (super_admin OR (admin manages) OR (AE owns)))
- NOTE: sdr + admin_m + public excluded from WRITE

**Users**:
- READ: super_duper OR (own org AND (super_admin OR manages target))
- WRITE: super_duper OR (own org AND (super_admin OR (admin manages)))

---

**END OF SPECIFICATION**

This is the single, authoritative source of truth for IGNITE-APEX access control.
