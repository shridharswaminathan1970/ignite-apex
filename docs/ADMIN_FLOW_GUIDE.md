# IGNITE-APEX Admin Flow & CRUD Operations Guide

**Purpose**: Complete reference for super_duper_admin first login and all admin CRUD operations  
**Date**: 2026-06-20  
**Status**: Canonical guide for understanding platform hierarchy and operations

---

## 1. First Super Duper Admin Login Flow

### Step 1: Initial Login
```
https://shaamelz.com/app/auth.html
→ Email: muhammad.shaamel@gmail.com
→ Password: [your password]
→ Sign In
```

### Step 2: Automatic Routing
```
auth.html checks session
→ Found: role = 'super_duper_admin'
→ Redirects to: /app/master-console.html
```

### Step 3: Master Console (Platform Master View)
**What you see**:
- **Tab 1: Companies & Users** - All companies across platform
- **Tab 2: Pending Registrations** - Casual/free signup requests

**What you can do**:
1. **Provision New Company**
   - Click "+ Provision New Company"
   - Fill: Company Name, Super Admin Email, Super Admin Name
   - System creates:
     - New organisation record
     - New super_admin user for that company
     - Sends invite link to super admin's email
   
2. **View All Companies**
   - Select company from dropdown
   - See all users in that company
   - Full CRUD on any user in any company

3. **Approve/Reject Free Signups**
   - Go to "Pending Registrations" tab
   - See all casual/free signup requests
   - Approve → creates user with role='public', crm_enabled=false
   - Reject → marks request as rejected

---

## 2. Role Hierarchy & Login Destinations

```
1. super_duper_admin (Platform Master - muhammad.shaamel@gmail.com)
   → /app/master-console.html
   → Can do ANYTHING across all companies
   ↓ provisions companies & creates super_admins

2. super_admin (Company Owner)
   → /app/company-dashboard.html
   → Full CRUD on company users + data
   → Can promote/demote users, assign/reassign roles
   → Views EVERYTHING under company
   ↓ creates company hierarchy

3. admin_m (Management - Read Only)
   → /crm/index.html (read-only) OR /system/index.html
   → Views EVERYTHING in company
   → CANNOT edit anything
   → No user management

4. admin (Sales Manager)
   → /crm/index.html (if crm_enabled) OR /system/index.html
   → Full CRUD on team users
   → Full admin powers for team & subordinates
   → Can promote/demote within team
   ↓ manages team

5. sdr (Team Lead)
   → /crm/index.html OR /system/index.html
   → Like admin_m but TEAM-SCOPED + can assign leads
   → Can assign/reassign team leads
   → Can manage team pipeline, forecast, reports
   → Views all team data
   → CANNOT create/edit/delete users
   ↓ coordinates team subordinates

6. account_executive (Sales Executive)
   → /crm/index.html OR /system/index.html
   → Handles OWN data ONLY
   → No team visibility
   → No admin powers

7. public (Free/Casual User)
   → /system/index.html (Sales OS only, CRM locked)
```

---

## 3. Super Admin (Company Owner) CRUD Operations

### Login Flow
```
super_admin logs in at /app/auth.html
→ Routed to /app/company-dashboard.html
```

### Company Dashboard Capabilities

#### A. View Company Profile
- Company name
- Contact email
- Created date
- Total users count

#### B. User Management (Create/Invite)
**Can create these roles**:
- `admin` (Team Manager)
- `admin_m` (Management - Read Only)
- `sdr` (Sales Dev Rep)
- `account_executive` (Individual Contributor)

**Invite Flow**:
1. Click "Invite User"
2. Fill form:
   - Name
   - Email
   - Role (dropdown: admin, admin_m, sdr, account_executive)
   - Manager (for admin/sdr/account_executive - dropdown of existing managers)
   - CRM Enabled (checkbox - default true for company users)
3. Click "Send Invite"
4. System:
   - Creates user record with org_id = super_admin's org_id
   - Sets manager_id if specified
   - Generates invite link
   - Emails invite to user
5. User receives email → clicks link → sets password → routed to their workspace

#### C. View All Users
- Table showing all users in company:
  - Name
  - Email
  - Role (badge with color)
  - Manager (if any)
  - CRM Access (yes/no)
  - Actions: Edit, Reset Password, Deactivate

#### D. Edit User
- Change name
- Change role
- Change manager
- Toggle CRM access
- Cannot change org_id (locked to company)

#### E. Reset Password / Send Login Link
- Button per user: "Send Login Link"
- Generates recovery link
- Emails to user
- User clicks → sets new password

#### F. Deactivate User
- Sets is_active = false
- User cannot login
- Data remains (not deleted)
- Can reactivate later

---

## 4. Admin (Team Manager) CRUD Operations

### Login Flow
```
admin logs in at /app/auth.html
→ if crm_enabled=true → /crm/index.html
→ if crm_enabled=false → /system/index.html
```

### Team Management Capabilities

#### A. View Team (Downline)
**Scope**: Self + all users where manager_id points to this admin (recursive)

Example hierarchy:
```
admin (Alice)
  ├── sdr (Bob)
  ├── account_executive (Carol)
  └── admin (Dave)
      ├── sdr (Eve)
      └── account_executive (Frank)
```
Alice sees: Bob, Carol, Dave, Eve, Frank

#### B. Invite Team Members
**Can create**:
- `sdr` (Sales Dev Rep)
- `account_executive` (Individual Contributor)

**Process**:
1. Click "Invite Team Member"
2. Fill: Name, Email, Role (sdr or account_executive)
3. System sets manager_id = this admin automatically
4. User inherits org_id from admin
5. Invite sent

#### C. View Team Data
**CRM Records (leads, opportunities, deals, accounts, contacts, activities, tasks)**:
- READ: Self + full downline (recursive via app_manages())
- WRITE: Self + full downline

**Reports**:
- CREATE/EDIT/DELETE: Own reports + team reports
- VIEW: Own + team

**Dashboard**:
- See team pipeline
- See team activities
- See team forecast
- Company-wide data NOT visible (only downline)

#### D. Manage Team Members
- Edit team member details
- Reassign team member to different manager
- Transfer leads from one team member to another
- Reset team member passwords
- Deactivate team members

#### E. Assign Leads
- Create lead and assign to self or team member
- Reassign existing leads between team members
- Move leads through IGNITE stages (subject to diagnostic gates)

---

## 5. Admin_M (Management - Read Only) Operations

### Login Flow
```
admin_m logs in at /app/auth.html
→ if crm_enabled=true → /crm/index.html (read-only mode)
→ if crm_enabled=false → /system/index.html (read-only mode)
```

### Capabilities
**Scope**: Entire company (view-only)

#### A. View Company-Wide Data
- READ: All leads, opportunities, deals, accounts, contacts, activities, tasks in company
- WRITE: NONE (completely read-only)

#### B. View All Reports
- Company-wide pipeline
- Company-wide forecast
- All team reports
- All individual reports
- Cannot CREATE/EDIT/DELETE reports

#### C. View Dashboards
- Company level
- Team level
- User level

#### D. Email Reports
- Can email any report they can view
- To: Company management contact
- Cc: Report owner

#### E. NO User Management
- Cannot invite users
- Cannot edit users
- Cannot deactivate users
- Cannot reset passwords

---

## 6. SDR (Team Lead) Operations

### Login Flow
```
sdr logs in at /app/auth.html
→ if crm_enabled=true → /crm/index.html
→ if crm_enabled=false → /system/index.html
```

### Capabilities
**Scope**: Own records (full CRUD) + Team coordination (assign leads, manage pipeline/reports)

**Key Distinction**: SDR is a **Team Lead** - has limited admin powers for coordinating work (assign leads, manage pipeline/forecast/reports) but CANNOT manage users (hire/fire/edit roles).

#### A. Work Own Pipeline
- CREATE/EDIT/DELETE: Own leads, opportunities, deals
- Handle leads assigned by manager
- Move own deals through stages (subject to diagnostic gates)
- Close own deals (won/lost)
- Track own activities
- Manage own tasks

#### B. Coordinate Team Work
**What they CAN do**:
- READ: Own records + full team/downline (via app_manages)
- **ASSIGN/REASSIGN leads** within team
- **Manage team pipeline** (move team deals between stages)
- **Create/Edit team reports** (weekly reports, forecasts)
- **View team dashboard** (pipeline, activities, forecast)
- **Transfer leads** between team members

**What they CANNOT do**:
- Create/Invite users
- Edit user profiles (roles, permissions)
- Delete/Deactivate users
- Reset user passwords
- Promote/Demote users

#### C. Reports & Forecasts
- VIEW: Own + team reports
- CREATE/EDIT/DELETE: **Team reports** (like admin but team-scoped)
- EMAIL: Team reports to management
- Manage team forecast

#### D. Dashboard
- Own pipeline metrics
- **Team pipeline** (full visibility + management)
- Team activities
- Team forecast
- Can drill into team member deals

#### E. Lead Assignment
- **Assign new leads** to team members
- **Reassign existing leads** between team members
- View lead distribution across team
- Balance workload

---

## 7. Account Executive (Individual Contributor) Operations

### Login Flow
```
account_executive logs in at /app/auth.html
→ if crm_enabled=true → /crm/index.html
→ if crm_enabled=false → /system/index.html
```

### Capabilities
**Scope**: Own records only

#### A. Work Own Pipeline
- CREATE/EDIT/DELETE: Own leads, opportunities, deals, accounts, contacts
- Move own deals through stages (subject to diagnostic gates)
- Close own deals (won/lost)
- Track own activities and tasks
- Manage own calendar

#### B. View Own Data Only
- Cannot see team
- Cannot see peers
- Cannot see company-wide data
- Only own records

#### C. Reports
- VIEW: Own reports only
- CREATE/EDIT: NONE (cannot create aggregate reports)
- EMAIL: Can email own report to own manager only

#### D. Submit to Manager
- Weekly report submission
- Deal status updates
- Activity logs

---

## 8. Public (Free/Casual User) Operations

### Login Flow
```
public logs in at /app/auth.html
→ Routed to /system/index.html (Sales OS only)
```

### Capabilities
**Scope**: Own records, Sales OS only, CRM LOCKED

#### A. Sales OS Access
- Full IGNITE diagnostic on own leads
- 4U qualification framework
- Root cause diagnostic
- Pipeline qualification
- Objection handling scripts
- CEMENT stickiness framework

#### B. CRM Access
**LOCKED** - Shows message:
> "You need to register under a company to use the CRM. To request access, email platform admin muhammad.shaamel@gmail.com."

#### C. Data Isolation
- org_id = 'NA' (holding company)
- RLS filters by auth.uid() ONLY
- Cannot see other public users' data
- Each public user isolated from others

#### D. Upgrade Path
**To become company user**:
1. Contact muhammad.shaamel@gmail.com
2. Super duper admin:
   - Creates real company OR adds to existing company
   - Changes user's org_id to real company
   - Changes role to appropriate role (sdr, account_executive, etc.)
   - Sets crm_enabled = true
3. User data STAYS INTACT (no migration needed - two-lens model)
4. CRM unlocks instantly

---

## 9. Key CRUD Patterns by Resource

### A. Users Table CRUD

| Role | CREATE (invite) | READ | UPDATE | DELETE/Deactivate |
|------|-----------------|------|--------|-------------------|
| super_duper_admin | Any role, any company | All users | All users | All users |
| super_admin | admin, admin_m, sdr, account_executive in own company | Own company | Own company | Own company |
| admin | sdr, account_executive in own team | Self + downline | Own team | Own team |
| admin_m | ❌ None | Whole company (read-only) | ❌ None | ❌ None |
| sdr | ❌ None | Self + team (read-only) | ❌ None | ❌ None |
| account_executive | ❌ None | Self only | ❌ None | ❌ None |
| public | ❌ None | Self only | ❌ None | ❌ None |

### B. CRM Records CRUD (leads, opportunities, deals, accounts, contacts, activities, tasks)

| Role | CREATE | READ | UPDATE | DELETE | ASSIGN/REASSIGN |
|------|--------|------|--------|--------|-----------------|
| super_duper_admin | All | All | All | All | All |
| super_admin | Whole company | Whole company | Whole company | Whole company | Whole company |
| admin | Self + team | Self + team | Self + team | Self + team | Self + team |
| admin_m | ❌ None | Whole company | ❌ None | ❌ None | ❌ None |
| sdr | **Self only** | Self + team | **Self only** | **Self only** | **✅ Team leads** |
| account_executive | Self only | Self only | Self only | Self only | ❌ None |
| public | Self only (Sales OS) | Self only (Sales OS) | Self only (Sales OS) | Self only (Sales OS) | ❌ None |

**Key Distinction**: 
- **SDR (Team Lead)** can VIEW team + **ASSIGN/REASSIGN team leads** but can only CREATE/UPDATE/DELETE own records
- This allows SDR to coordinate team work (distribute leads) without editing team members' data
- Admin has full CRUD on team; SDR has read + assign authority

### C. Reports & Forecasts CRUD

| Role | CREATE/EDIT | VIEW | DELETE | EMAIL |
|------|-------------|------|--------|-------|
| super_duper_admin | All | All | All | Yes |
| super_admin | Whole company | Whole company | Whole company | Yes |
| admin | Self + team | Self + team | Self + team | Yes |
| admin_m | ❌ None | Whole company | ❌ None | Yes (view-only) |
| sdr | ❌ None | Self + team | ❌ None | Own to manager only |
| account_executive | ❌ None | Self only | ❌ None | Own to manager only |
| public | ❌ None | Self only | ❌ None | ❌ None |

---

## 10. Common Admin Workflows

### Workflow 1: Super Duper Admin Provisions First Company

1. Login: muhammad.shaamel@gmail.com → Master Console
2. Click "Provision New Company"
3. Fill:
   - Company Name: "Acme Corp"
   - Super Admin Email: "john@acme.com"
   - Super Admin Name: "John Doe"
4. Submit
5. System:
   - Creates organisation "Acme Corp"
   - Creates user: john@acme.com, role=super_admin, org_id=acme
   - Emails invite to john@acme.com
6. John receives email → clicks link → sets password → lands at /app/company-dashboard.html

### Workflow 2: Super Admin Creates First Team

1. Login: john@acme.com → Company Dashboard
2. Click "Invite User"
3. Fill:
   - Name: "Alice Manager"
   - Email: "alice@acme.com"
   - Role: admin (Team Manager)
   - Manager: (none - top-level manager)
   - CRM Enabled: ✓ checked
4. Submit
5. System:
   - Creates user: alice@acme.com, role=admin, org_id=acme, manager_id=NULL
   - Emails invite
6. Alice logs in → lands at /crm/index.html

### Workflow 3: Admin Builds Team

1. Login: alice@acme.com → CRM
2. Click "Invite Team Member"
3. Invite SDR:
   - Name: "Bob Smith"
   - Email: "bob@acme.com"
   - Role: sdr
4. Invite Account Executive:
   - Name: "Carol Jones"
   - Email: "carol@acme.com"
   - Role: account_executive
5. Both inherit:
   - org_id = acme (from Alice)
   - manager_id = alice's user id
   - crm_enabled = true
6. Bob and Carol login → land at /crm/index.html

### Workflow 4: Admin Assigns Lead to Team Member

1. Alice (admin) in CRM
2. Click "New Lead"
3. Fill lead details
4. Assign To: dropdown shows:
   - Self (Alice)
   - Bob (sdr)
   - Carol (account_executive)
5. Select Bob → Save
6. Lead created with lead_owner_id = Bob's user id
7. Bob can now work the lead
8. Alice can still view/edit (manager privilege)

### Workflow 5: Admin Transfers Lead Between Team Members

1. Alice views Bob's leads
2. Selects lead currently owned by Bob
3. Click "Reassign"
4. Select new owner: Carol
5. Confirm
6. System updates lead_owner_id = Carol's id
7. Carol now sees lead in her pipeline
8. Bob loses access (no longer owner)

### Workflow 6: Admin Views Team Dashboard

1. Alice in CRM Dashboard
2. Sees:
   - Own pipeline + Bob's pipeline + Carol's pipeline (aggregated)
   - Team forecast
   - Team activities
   - Team closed-won / closed-lost
3. Can filter by team member
4. Can drill into individual deals
5. Can edit team deals (full CRUD on downline)

### Workflow 7: Admin_M Views Company Dashboard

1. Login: dave@acme.com (role=admin_m) → CRM
2. Sees:
   - ALL teams in company (Alice's team, other teams)
   - Company-wide pipeline
   - Company-wide forecast
   - All activities
3. CANNOT:
   - Edit any deal
   - Create any record
   - Reassign any lead
   - Manage any user
4. CAN:
   - Email reports to management
   - Export data views

### Workflow 8: SDR Works Own Deals + Monitors Team

1. Login: bob@acme.com (role=sdr) → CRM
2. Own Pipeline Tab:
   - See own leads (full CRUD)
   - Move own deals through stages
   - Close own deals
3. Team View Tab:
   - See Alice's deals (read-only)
   - See Carol's deals (read-only)
   - Purpose: Coordination, avoid duplication
4. CANNOT:
   - Edit Carol's deals
   - Reassign team leads
   - Create team reports

### Workflow 9: Public User Requests CRM Access

1. User visits shaamelz.com
2. Click "Try Sales OS Free"
3. Fill: Name, Email, Company (optional)
4. Submit
5. System:
   - Creates registration_request (status=pending)
   - Emails muhammad.shaamel@gmail.com
6. Muhammad in Master Console:
   - Goes to "Pending Registrations"
   - Sees request
   - Click "Approve"
7. System:
   - Creates user: role=public, org_id=NA, crm_enabled=false
   - Emails invite
8. User logs in → lands at /system/index.html (Sales OS)
9. CRM button shows: "Locked - contact admin to upgrade"

### Workflow 10: Upgrade Public User to Company User

1. Public user emails muhammad.shaamel@gmail.com
2. Request: Join Acme Corp as account_executive
3. Muhammad (or John, super_admin of Acme) in admin console:
   - Edit user
   - Change org_id: NA → acme
   - Change role: public → account_executive
   - Set manager_id: alice (admin)
   - Set crm_enabled: true
   - Save
4. User logs out and back in
5. Now lands at /crm/index.html
6. All previous Sales OS data INTACT (two-lens model)
7. CRM unlocked

---

## 11. Troubleshooting Common Issues

### Issue 1: Super Duper Admin Not Routing to Master Console
**Symptom**: After login, redirects to wrong page or loops

**Check**:
1. Database: `SELECT role FROM users WHERE email = 'muhammad.shaamel@gmail.com';`
   - Should be: `super_duper_admin`
2. Launcher.html line 232-236 should have:
   ```javascript
   if (profile.role === 'super_duper_admin') {
     window.location.replace('./master-console.html');
     return;
   }
   ```

**Fix**: Ensure role is exact match (case-sensitive), no trailing spaces

### Issue 2: Super Admin Cannot See Company Dashboard
**Symptom**: After login, super_admin lands at wrong page

**Check**:
1. Database: `SELECT role, org_id FROM users WHERE role = 'super_admin';`
   - Should have: role='super_admin', org_id=(valid company UUID)
2. company-dashboard.html exists at /app/company-dashboard.html
3. Launcher.html lines 239-243 handle super_admin routing

**Fix**: Verify routing logic matches role exactly

### Issue 3: Admin Cannot See Team Members
**Symptom**: Admin sees empty team list

**Check**:
1. Database: 
   ```sql
   SELECT manager_id FROM users WHERE email = 'team-member@company.com';
   ```
   - Should match admin's user id
2. RLS policy app_manages() functioning
3. Team members have same org_id as admin

**Fix**: Ensure manager_id is set correctly when inviting users

### Issue 4: SDR Can Edit Team Records (Should Be Read-Only)
**Symptom**: SDR has write access to team data

**Check**:
1. RLS policies on leads/opportunities/deals tables:
   - READ policy: Uses app_manages (returns self + downline)
   - WRITE policy: Uses auth.uid() = owner_id (self only)
2. Frontend should disable edit buttons for non-owned records

**Fix**: Verify RLS policies separate READ from WRITE correctly

### Issue 5: Public User Sees CRM Access
**Symptom**: Public user can access CRM

**Check**:
1. Database: `SELECT crm_enabled FROM users WHERE role = 'public';`
   - Should be: false
2. Routing logic checks crm_enabled before allowing CRM access
3. CRM pages check crm_enabled and show lock message if false

**Fix**: Set crm_enabled=false for all public users

---

## 12. Reference: Complete Access Matrix

| Action | super_duper_admin | super_admin | admin | admin_m | sdr | account_executive | public |
|--------|-------------------|-------------|-------|---------|-----|-------------------|--------|
| **Login Destination** | master-console.html | company-dashboard.html | crm/system | crm/system | crm/system | crm/system | system only |
| **Provision Company** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invite super_admin** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invite admin/admin_m/sdr/account_executive** | ✅ | ✅ (own company) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invite sdr/account_executive to team** | ✅ | ✅ | ✅ (own team) | ❌ | ❌ | ❌ | ❌ |
| **View all companies** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View own company users** | ✅ | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |
| **View own team** | ✅ | ✅ | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ |
| **Edit any user** | ✅ | ✅ (own company) | ✅ (own team) | ❌ | ❌ | ❌ | ❌ |
| **Reset any password** | ✅ | ✅ (own company) | ✅ (own team) | ❌ | ❌ | ❌ | ❌ |
| **View all company CRM data** | ✅ | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |
| **View team CRM data** | ✅ | ✅ | ✅ | ✅ | ✅ (read-only) | ❌ | ❌ |
| **View own CRM data** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (Sales OS only) |
| **Edit company CRM data** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Edit team CRM data** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Edit own CRM data** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ (Sales OS only) |
| **Assign/Reassign team leads** | ✅ | ✅ | ✅ | ❌ | ✅ (team leads) | ❌ | ❌ |
| **View company dashboard** | ✅ | ✅ | ❌ | ✅ (read-only) | ❌ | ❌ | ❌ |
| **View team dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ (read-only) | ❌ | ❌ |
| **Create/Edit team reports** | ✅ | ✅ | ✅ | ❌ | ✅ (team) | ✅ (own) | ❌ |
| **View reports** | ✅ All | ✅ Company | ✅ Team | ✅ Company | ✅ Team | ✅ Own | ✅ Own (Sales OS) |
| **Email reports** | ✅ | ✅ | ✅ | ✅ | ✅ (team reports) | ⚠️ Own to manager | ❌ |
| **CRM Access** | ✅ | ✅ | ✅ (if crm_enabled) | ✅ (if crm_enabled) | ✅ (if crm_enabled) | ✅ (if crm_enabled) | ❌ LOCKED |
| **Sales OS Access** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 13. Summary

The IGNITE-APEX platform implements a **hierarchical role-based access control (RBAC)** system with **multi-tenancy** and **row-level security (RLS)**.

**Key Principles**:
1. **Top-down provisioning**: super_duper_admin → super_admin → admin → sdr/account_executive
2. **Inheritance**: org_id and manager_id cascade down automatically
3. **Security in database**: RLS enforces who-sees-what, UI is cosmetic
4. **Two-lens model**: Sales OS and CRM are views of same data, crm_enabled is access flag
5. **Read ≠ Write**: Some roles (admin_m, sdr) have broader read but limited write
6. **Invite-based onboarding**: No passwords in email, users set own passwords
7. **Diagnostic-gated pipeline**: Deal progression requires IGNITE-APEX qualification

**For Questions/Issues**:
- Check this guide first
- Verify database records (users table: role, org_id, manager_id, crm_enabled)
- Check routing logic in launcher.html (lines 232-266)
- Verify RLS policies enforce spec (docs/ACCESS_SPEC.md)

---

**End of Admin Flow Guide**
