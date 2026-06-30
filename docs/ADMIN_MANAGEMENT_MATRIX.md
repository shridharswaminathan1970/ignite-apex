# Admin Management Powers Matrix

## Complete CRUD & Management Capabilities by Role

### 1. super_duper_admin (Platform Admin)
**Scope**: ALL companies, ALL users, ALL teams

| Function | Capability |
|----------|-----------|
| **Companies** | Full CRUD - Create, Read, Update, Delete any company |
| **Teams** | Full CRUD - Create, Read, Update, Delete, Rename teams in ANY org |
| **Users** | Full CRUD - Create, Read, Update, Delete users in ANY org |
| **User Management** | Assign/reassign teams, Assign/reassign roles, Change manager/reporting, Reset passwords, Activate/Deactivate |
| **Access Control** | Can grant/revoke any permission |

### 2. super_admin (Company Admin)
**Scope**: THEIR company only (cannot touch other companies)

| Function | Capability |
|----------|-----------|
| **Companies** | ❌ Cannot create companies (super_duper_admin only) |
| **Teams** | Full CRUD - Create, Read, Update, Delete, Rename teams in their org |
| **Users** | Full CRUD - Create, Read, Update, Delete ALL users in their org |
| **User Management** | Assign/reassign teams, Assign/reassign roles, Change manager/reporting, Reset passwords, Activate/Deactivate (org-wide) |
| **Access Control** | Can grant/revoke permissions within their org |

### 3. admin (Sales Manager)
**Scope**: THEIR team only (downline users they manage)

| Function | Capability |
|----------|-----------|
| **Companies** | ❌ Cannot CRUD companies |
| **Teams** | ❌ Cannot CRUD teams (can only assign users to existing teams) |
| **Users** | Full CRUD - Create, Read, Update, Delete users in their DOWNLINE only |
| **User Management** | Assign/reassign team members to teams, Assign/reassign roles to downline, Change manager within downline, Reset passwords for downline, Activate/Deactivate downline users |
| **Access Control** | Limited to their team scope |

### 4. admin_m (Management - Read Only)
**Scope**: ENTIRE company (view only)

| Function | Capability |
|----------|-----------|
| **Companies** | ✅ VIEW company details |
| **Teams** | ✅ VIEW all teams |
| **Users** | ✅ VIEW all users in the org |
| **Reports/Data** | ✅ VIEW all company assets and resources |
| **Modifications** | ❌ NO write/update/delete permissions at all |

### 5. sdr (Team Lead)
**Scope**: Own data + team coordination (NO user management)

| Function | Capability |
|----------|-----------|
| **Users** | ❌ Cannot create/edit/delete users |
| **Lead Assignment** | ✅ Can assign/reassign leads to team members |
| **Team Data** | ✅ Can view team pipeline, reports, forecasts |
| **Reports** | ✅ Can create/edit/delete team reports |

### 6. account_executive
**Scope**: Own data only

| Function | Capability |
|----------|-----------|
| **Own Data** | Full CRUD on own leads, opportunities, reports |
| **Team Data** | ❌ Cannot see or modify team data |
| **Users** | ❌ Cannot manage users |

## User Management Functions

All admin roles (super_duper_admin, super_admin, admin) can perform these on users within their scope:

1. **Create User**: Invite new user with email, name, role, team assignment
2. **Update User**: 
   - Change name, email
   - Reassign team
   - Reassign role
   - Change manager (reporting structure)
   - Toggle CRM access
3. **Activate/Deactivate**: Soft delete - disable user login without deleting data
4. **Reset Password**: Send password reset link to user
5. **Delete User**: Permanent deletion (with confirmation)

## Team Management Functions

Only super_duper_admin and super_admin can:

1. **Create Team**: New team in their org
2. **Rename Team**: Update team name
3. **Delete Team**: Remove team (reassign users first)
4. **Assign Users to Teams**: Move users between teams

## Implementation Requirements

### Database
- ✅ teams table created
- ✅ users.team_id added
- ⏳ Need RLS policies updated for full CRUD
- ⏳ Need soft delete (is_active flag already exists)

### Edge Functions Needed
- ⏳ update-user (change role, team, manager, activate/deactivate)
- ⏳ reset-user-password (already exists, needs testing)
- ⏳ delete-user (permanent delete with cascade)
- ⏳ manage-team (create, rename, delete teams)

### UI Components Needed
- ⏳ User management table with inline edit
- ⏳ Team selector dropdown
- ⏳ Role selector dropdown
- ⏳ Manager selector dropdown
- ⏳ Activate/Deactivate toggle
- ⏳ Reset password button
- ⏳ Delete user button (with confirmation)
- ⏳ Team management panel (super_admin + super_duper_admin only)
