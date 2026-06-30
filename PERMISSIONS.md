# IGNITE_APEX Role-Based Permissions

## Role Definitions

### super_duper_admin (Platform Master)
- Full access to everything across all organizations
- Can provision companies and invite super_admins
- Access: Master Console

### super_admin (Company Administrator)
- Full access within their organization
- Can manage all users in their company
- Can create/edit/delete all data in their org
- Access: Company Dashboard, Team Reports, CRM, Sales OS

### admin (Team Manager)
- Can manage users in their downline (via app_manages)
- Full CRUD on data owned by themselves or their team
- Can create/edit/delete records for managed users
- Access: Team Reports, CRM, Sales OS

### admin_m (Manager - Read Only)
- Monitor-only role for team oversight
- READ access to their downline (via app_manages)
- NO write access to any data
- NO user management
- Access: Team Reports (read-only), CRM (read-only), Sales OS (read-only)

### sdr (Sales Development Rep)
- **Sales Rep** - works their own deals like an account_executive
- **Full CRUD** on their OWN records (leads, opportunities, deals, accounts, contacts, activities, tasks)
- Can move their own deals through pipeline stages
- **READ visibility** into team (via app_manages) for monitoring/aiding admin
- **READ-ONLY** on reports/forecasts (cannot edit weekly_reports)
- **NO user management**
- Access: CRM, Sales OS

### account_executive (Account Executive)
- Full CRUD on their OWN records only
- Can work leads, opportunities, deals through full pipeline
- Can create/edit weekly reports
- READ access to only their own data
- Access: CRM, Sales OS

### public (Free Tier User)
- Sales OS access only
- CRM locked (must upgrade)
- Own data only

---

## Data Access Matrix

### Core Data Tables
`leads`, `opportunities`, `deals`, `accounts`, `contacts`, `activities`, `tasks`

| Role | READ | INSERT | UPDATE | DELETE |
|------|------|--------|--------|--------|
| **super_duper_admin** | All orgs | All orgs | All orgs | All orgs |
| **super_admin** | Own org, all users | Own org, all users | Own org, all users | Own org, all users |
| **admin** | Self + downline | Self + downline | Self + downline | Self + downline |
| **admin_m** | Self + downline | ❌ None | ❌ None | ❌ None |
| **sdr** | Self + downline | ✅ Own records only | ✅ Own records only | ✅ Own records only |
| **account_executive** | Own records only | Own records only | Own records only | Own records only |
| **public** | Own records only | Own records only | Own records only | Own records only |

### Report/Forecast Tables
`weekly_reports`, forecast tables

| Role | READ | WRITE |
|------|------|-------|
| **super_duper_admin** | All orgs | All orgs |
| **super_admin** | Own org, all users | Own org, all users |
| **admin** | Self + downline | Self + downline |
| **admin_m** | Self + downline | ❌ None |
| **sdr** | Self + downline | ❌ None (READ-ONLY) |
| **account_executive** | Own records only | Own records only |
| **public** | Own records only | Own records only |

### User Management

| Role | Can Invite | Can Edit | Can Deactivate |
|------|------------|----------|----------------|
| **super_duper_admin** | ✅ Any role | ✅ Anyone | ✅ Anyone |
| **super_admin** | ✅ Company roles | ✅ Own org | ✅ Own org |
| **admin** | ✅ Team members | ✅ Downline | ✅ Downline |
| **admin_m** | ❌ None | ❌ None | ❌ None |
| **sdr** | ❌ None | ❌ None | ❌ None |
| **account_executive** | ❌ None | ❌ None | ❌ None |
| **public** | ❌ None | ❌ None | ❌ None |

---

## RLS Implementation Details

### Helper Functions
- `app_role()` - Returns current user's role
- `app_org()` - Returns current user's org_id
- `app_manages(target_user_id)` - Returns TRUE if current user manages target (recursive downline check)

### Core Data Pattern
```sql
-- READ: super_duper_admin OR (same org AND (super_admin/admin_m OR manages owner))
-- WRITE: super_duper_admin OR (same org AND (
--   super_admin 
--   OR (admin manages owner)
--   OR (sdr/AE owns record)))
```

### Report/Forecast Pattern
```sql
-- READ: same as core data
-- WRITE: super_duper_admin OR (same org AND (
--   super_admin
--   OR (admin manages owner)
--   OR (AE owns record)))
-- Note: sdr and admin_m excluded from WRITE
```

---

## Key Differences: sdr vs account_executive

| Capability | sdr | account_executive |
|------------|-----|-------------------|
| Work own leads/deals | ✅ Yes | ✅ Yes |
| Move deals through pipeline | ✅ Yes | ✅ Yes |
| Close own deals | ✅ Yes | ✅ Yes |
| View team data (READ) | ✅ Yes (via app_manages) | ❌ No (own only) |
| Edit team data | ❌ No | ❌ No |
| Edit weekly reports | ❌ No (READ-ONLY) | ✅ Yes (own only) |
| Manage users | ❌ No | ❌ No |

**Summary**: 
- **sdr** = Sales rep with team visibility (monitor/aid) but read-only on reports
- **account_executive** = Individual contributor, own data only, can edit reports

---

## UI Visibility Rules

### sdr User Interface
- ✅ **CAN** see: Own deals, team deals (read-only), pipeline view, team reports
- ✅ **CAN** edit: Own leads, own deals, own contacts, own activities
- ❌ **CANNOT** see: User management controls, report edit buttons (on team reports)
- ❌ **CANNOT** edit: Team member records, weekly reports, forecasts

### admin_m User Interface
- ✅ **CAN** see: Own data, team data, all reports
- ❌ **CANNOT** edit: Anything (full read-only)
- ❌ **CANNOT** see: User management controls

---

## Migration History

- `001_rbac.sql` - Initial RLS setup with helper functions
- `002_fix_configs_policies.sql` - Fixed configs table policy function names
- `003_cleanup_old_policies.sql` - Removed manually created dashboard policies
- `004_onboarding_flow.sql` - Added company contact fields, initially made sdr read-only (INCORRECT)
- `005_fix_sdr_permissions.sql` - **CORRECTED** sdr to be sales rep with own-record CRUD + team READ visibility

---

## Testing Checklist

### Test as sdr user:
- [ ] Can create own lead
- [ ] Can edit own lead
- [ ] Can move own deal through pipeline stages
- [ ] Can close own deal
- [ ] Can view team member's deals (read-only)
- [ ] CANNOT edit team member's deal
- [ ] Can view weekly reports
- [ ] CANNOT edit weekly reports
- [ ] CANNOT see user management buttons

### Test as account_executive:
- [ ] Can create own lead
- [ ] Can edit own deal
- [ ] Can create weekly report
- [ ] Can edit own weekly report
- [ ] CANNOT see other team member's data

### Test as admin_m:
- [ ] Can view team data
- [ ] CANNOT edit any data
- [ ] Can view reports
- [ ] CANNOT edit reports
- [ ] CANNOT see user management
