# SDR Team Lead Role - Implementation Requirements

**Date**: 2026-06-20  
**Status**: Specification updated, implementation needed  
**Purpose**: Document what needs to be built to support SDR as "Team Lead" role

---

## Current State vs Required State

### Current Implementation (WRONG)
```
sdr = "Sales Dev Rep"
- Works own deals
- Views team (read-only)
- Cannot assign leads
- Cannot create/edit reports
- Cannot manage pipeline
```

### Required Implementation (CORRECT)
```
sdr = "Team Lead"
- Works own deals (own CRUD)
- Coordinates team work:
  ✅ Assign/reassign leads within team
  ✅ Manage team pipeline
  ✅ Create/edit team reports & forecasts
  ✅ View team dashboard
- CANNOT manage users (no hire/fire/edit)
```

---

## Implementation Checklist

### 1. Database / RLS Policies

**Current RLS for leads table**:
```sql
-- READ policy (correct - already allows team visibility)
CREATE POLICY "sdr_read_leads" ON leads
FOR SELECT USING (
  app_manages(lead_owner_id)  -- Returns true for self + downline
);

-- UPDATE policy (correct - own records only)
CREATE POLICY "sdr_update_leads" ON leads
FOR UPDATE USING (
  lead_owner_id = auth.uid()  -- Own records only
);
```

**MISSING: ASSIGN/REASSIGN policy**
```sql
-- NEW: Allow SDR to reassign team leads (change owner)
CREATE POLICY "sdr_reassign_team_leads" ON leads
FOR UPDATE USING (
  -- Can reassign if current owner OR new owner is in downline
  app_manages(lead_owner_id) OR 
  app_manages((SELECT lead_owner_id FROM leads WHERE id = leads.id))
)
WITH CHECK (
  -- New owner must be in SDR's downline
  app_manages(lead_owner_id)
);
```

**Apply same pattern to**:
- `opportunities` table (owner_id column)
- `deals` table (assigned_to column)
- `accounts` table (account_owner_id column)
- `contacts` table (contact_owner_id column)

### 2. Backend / Edge Functions

**File**: `supabase/functions/assign-lead/index.ts` (NEW)

```typescript
// Endpoint: POST /assign-lead
// Body: { leadId, newOwnerId }

// Validation:
// 1. Check caller role = sdr OR admin OR super_admin
// 2. Check new owner is in caller's downline (app_manages)
// 3. Update lead_owner_id
// 4. Log activity (who reassigned what to whom)

const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

if (!['sdr', 'admin', 'super_admin', 'super_duper_admin'].includes(profile.role)) {
  throw new Error('Insufficient permissions')
}

// Check new owner is in downline
const { data: canManage } = await supabase
  .rpc('app_manages', { target_user_id: newOwnerId })

if (!canManage) {
  throw new Error('Cannot assign to user outside your team')
}

// Reassign
await supabase
  .from('leads')
  .update({ lead_owner_id: newOwnerId })
  .eq('id', leadId)
```

**Status**: ❌ NOT BUILT YET

### 3. Frontend / CRM UI

#### A. Lead Assignment UI

**File**: `/crm/leads.html` (or wherever leads are displayed)

**Add for sdr role**:
```html
<!-- If user role = sdr OR admin, show reassign button -->
<button onclick="showReassignModal(leadId)">Reassign Lead</button>

<!-- Modal -->
<div id="reassign-modal">
  <select id="new-owner">
    <!-- Populate with team members from app_manages -->
  </select>
  <button onclick="reassignLead()">Confirm</button>
</div>
```

**JavaScript**:
```javascript
async function reassignLead() {
  const leadId = currentLeadId
  const newOwnerId = document.getElementById('new-owner').value
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/assign-lead`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ leadId, newOwnerId })
  })
  
  if (!response.ok) throw new Error('Failed to reassign')
  
  // Refresh lead list
  loadLeads()
}
```

**Status**: ❌ NOT BUILT YET

#### B. Team Dashboard for SDR

**File**: `/crm/team-dashboard.html` (NEW or add to existing dashboard)

**Show for sdr role**:
```html
<div id="sdr-team-dashboard">
  <h2>Team Pipeline</h2>
  
  <!-- Team members list with lead counts -->
  <div id="team-members">
    <!-- For each team member: -->
    <div class="team-member">
      <div class="member-name">Bob Smith</div>
      <div class="member-leads">12 leads</div>
      <button onclick="viewMemberPipeline(memberId)">View</button>
    </div>
  </div>
  
  <!-- Lead distribution chart -->
  <div id="lead-distribution">
    <!-- Bar chart showing leads per team member -->
  </div>
  
  <!-- Quick assign new lead -->
  <button onclick="openAssignLeadModal()">Assign New Lead</button>
</div>
```

**Status**: ❌ NOT BUILT YET

#### C. Team Reports for SDR

**File**: `/crm/reports.html`

**Update permissions check**:
```javascript
// Current (wrong):
if (userRole === 'admin') {
  showReportEditor()
}

// Correct:
if (['admin', 'sdr'].includes(userRole)) {
  showReportEditor()  // Allow sdr to create/edit team reports
}
```

**Status**: ⚠️ NEEDS UPDATE (currently restricts sdr)

### 4. Routing & Navigation

**File**: `/app/launcher.html`

**Current routing** (correct - no change needed):
```javascript
if (profile.role === 'sdr') {
  if (profile.crm_enabled) {
    window.location.replace('../crm/index.html')
  } else {
    window.location.replace('../system/index.html')
  }
}
```

**Status**: ✅ CORRECT (no change needed)

### 5. CRM Navigation Menu

**File**: `/crm/index.html` (or shared nav component)

**Update SDR menu** to include:
```html
<nav id="sdr-nav">
  <a href="./dashboard.html">My Dashboard</a>
  <a href="./leads.html">My Leads</a>
  <a href="./team-dashboard.html">Team Dashboard</a> <!-- NEW -->
  <a href="./team-pipeline.html">Team Pipeline</a> <!-- NEW -->
  <a href="./reports.html">Team Reports</a> <!-- UPDATE: enable editing -->
</nav>
```

**Status**: ⚠️ NEEDS UPDATE

---

## Implementation Priority

### Phase 1: Core Functionality (HIGH PRIORITY)
1. ✅ Update ACCESS_SPEC.md (DONE)
2. ✅ Update ADMIN_FLOW_GUIDE.md (DONE)
3. ❌ Add RLS policies for lead reassignment
4. ❌ Create `assign-lead` Edge Function
5. ❌ Add "Reassign Lead" button in CRM leads view
6. ❌ Test: SDR can reassign team lead

### Phase 2: Team Management (MEDIUM PRIORITY)
7. ❌ Build Team Dashboard for SDR
8. ❌ Add lead distribution view
9. ❌ Enable report editing for SDR role
10. ❌ Test: SDR can create/edit team reports

### Phase 3: UX Polish (LOW PRIORITY)
11. ❌ Add lead balance indicator (warn if uneven distribution)
12. ❌ Add bulk assign (select multiple leads → assign to team member)
13. ❌ Add team activity feed
14. ❌ Add team forecast view

---

## Database Schema Changes

### New Table: lead_assignments (Optional - for audit trail)

```sql
CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- RLS: Viewable by managers of either party
CREATE POLICY "view_lead_assignments" ON lead_assignments
FOR SELECT USING (
  app_manages(from_user_id) OR 
  app_manages(to_user_id) OR 
  assigned_by = auth.uid()
);
```

**Purpose**: Track who assigned what to whom (audit trail)

**Status**: ❌ OPTIONAL - not required for basic functionality

---

## Testing Scenarios

### Test 1: SDR Assigns New Lead
1. Login as SDR (Bob)
2. Create new lead
3. Assign to team member (Carol)
4. Verify: Carol sees lead in her pipeline
5. Verify: Bob can still view (read-only)

### Test 2: SDR Reassigns Existing Lead
1. Login as SDR (Bob)
2. View team leads (see Carol's lead)
3. Click "Reassign" on Carol's lead
4. Select new owner (Dave)
5. Confirm
6. Verify: Lead moved from Carol to Dave
7. Verify: Carol no longer sees lead
8. Verify: Dave sees lead

### Test 3: SDR Cannot Reassign Outside Team
1. Login as SDR (Bob, team A)
2. Try to reassign lead to user in team B
3. Verify: Error - "Cannot assign outside your team"

### Test 4: SDR Creates Team Report
1. Login as SDR (Bob)
2. Go to Reports
3. Click "Create Report"
4. Select report type: Weekly Pipeline
5. Scope: Team (not just own)
6. Save
7. Verify: Report shows team aggregate data
8. Verify: Admin (Alice) can also view this report

### Test 5: SDR Cannot Edit Users
1. Login as SDR (Bob)
2. Try to access user management
3. Verify: No "Invite User" button visible
4. Try direct URL to user-edit page
5. Verify: Access denied or redirected

### Test 6: Account Executive Cannot Assign Leads
1. Login as Account Executive (Carol)
2. View own leads
3. Verify: No "Reassign" button visible
4. Try to call assign-lead API directly
5. Verify: Error - "Insufficient permissions"

---

## API Endpoints Summary

### New Endpoints Needed

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/assign-lead` | POST | sdr, admin, super_admin | Assign/reassign lead to team member |
| `/functions/v1/team-pipeline` | GET | sdr, admin, admin_m | Get team pipeline aggregate |
| `/functions/v1/team-members` | GET | sdr, admin, admin_m | Get list of team members (downline) |

### Existing Endpoints to Update

| Endpoint | Change |
|----------|--------|
| `/functions/v1/create-report` | Allow role=sdr to create team reports |
| `/functions/v1/update-report` | Allow role=sdr to edit team reports |
| `/functions/v1/delete-report` | Allow role=sdr to delete team reports |

---

## RLS Functions to Verify

### app_manages(target_user_id)
**Current implementation** (should be correct):
```sql
CREATE OR REPLACE FUNCTION app_manages(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns true if caller manages target (recursive downline check)
  -- Used by sdr to see team
  RETURN EXISTS (
    WITH RECURSIVE downline AS (
      SELECT id FROM users WHERE id = auth.uid()
      UNION
      SELECT u.id FROM users u
      INNER JOIN downline d ON u.manager_id = d.id
    )
    SELECT 1 FROM downline WHERE id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Status**: ✅ Should be correct (verify exists in database)

### app_org()
**Current implementation**:
```sql
CREATE OR REPLACE FUNCTION app_org()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT org_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Status**: ✅ Correct (no changes needed)

---

## Summary

**What's Done**:
- ✅ Specification updated (ACCESS_SPEC.md, ADMIN_FLOW_GUIDE.md)
- ✅ Role clarified: SDR = Team Lead

**What's Needed**:
- ❌ RLS policies for lead reassignment
- ❌ Edge Function: assign-lead
- ❌ Frontend: Reassign button in CRM
- ❌ Frontend: Team Dashboard for SDR
- ❌ Frontend: Enable report editing for SDR
- ❌ Testing: All 6 scenarios above

**Estimated Effort**:
- Phase 1 (core): ~4 hours
- Phase 2 (team mgmt): ~6 hours
- Phase 3 (polish): ~4 hours
- Total: ~14 hours

**Next Steps**:
1. Confirm this matches your requirements
2. Implement Phase 1 (core lead assignment)
3. Test with real SDR user
4. Implement Phase 2 if needed
5. Deploy and verify in production

---

**End of SDR Team Lead Implementation Requirements**
