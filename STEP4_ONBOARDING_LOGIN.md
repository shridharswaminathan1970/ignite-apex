# STEP 4: Onboarding/Login Flow Verification

**Date**: 2026-06-15  
**Status**: 🟡 MOSTLY COMPLIANT (1 minor issue found)

---

## §9 Requirements

### Single Front Door ✅
- **Spec**: Entry point `/app/auth.html`
- **Implementation**: `/app/auth.html` exists and uses Supabase auth UI
- **Status**: ✅ COMPLIANT

---

### Role-Based Routing ✅

**Spec (§7)**:
```javascript
await session + profile
if (role === 'super_duper_admin') → /app/master-console.html
if (role === 'super_admin') → /app/company-dashboard.html
if (role IN ('admin','admin_m','sdr','account_executive')) {
  if (crm_enabled) → /crm/index.html
  else → /system/index.html
}
```

**Implementation** (`app/launcher.html` lines 160-246):
```javascript
// ✅ Awaits session
const { data: { session } } = await supabaseClient.auth.getSession();
if (!session) redirect to auth

// ✅ Awaits full profile
const { data: profile } = await supabaseClient
  .from('users')
  .select('id, email, name, role, org_id, crm_enabled, account_type')
  .eq('id', session.user.id)
  .single();

// ✅ Role-based routing matches spec exactly
if (profile.role === 'super_duper_admin') {
  window.location.href = './master-console.html';
  return;
}

if (profile.role === 'super_admin') {
  window.location.href = './company-dashboard.html';
  return;
}

if (['admin', 'admin_m', 'sdr', 'account_executive'].includes(profile.role)) {
  if (profile.crm_enabled) {
    window.location.href = '../crm/index.html';
  } else {
    window.location.href = '../system/index.html';
  }
  return;
}
```

**Status**: ✅ COMPLIANT

**Verified**:
- [x] Awaits full session before any logic
- [x] Awaits full profile (including role, org_id, crm_enabled)
- [x] Routing logic matches spec exactly
- [x] No redirect loops (previous bug fixed)
- [x] Terminal error pages don't redirect again

---

### Workspace Headers 🟡

**Spec (§7)**:
> Each workspace must display company context:
> - Company name (from organisations table via profile.org_id)
> - User name + role badge
> - Logout button

**Implementation**:

#### Launcher ✅
- ✅ Shows company name: `<div class="tb-org" id="org-name"></div>`
- ✅ Fetches org name from organisations table
- ✅ Shows user name + role
- ✅ Has logout button

#### CRM Workspace ⚠️
- ❌ Does NOT show company name in header
- ✅ Shows user name (window.IA_CurrentUser)
- ✅ Has logout button
- **Issue**: Missing company context

#### Sales OS Workspace ⚠️
- ❌ Does NOT show company name in header
- ✅ Shows user name (window.IA_CurrentUser)
- ✅ Has logout button
- **Issue**: Missing company context

**Status**: 🟡 PARTIAL - Launcher shows company, workspaces don't

---

## Findings Summary

### ✅ COMPLIANT
1. Single front door (`/app/auth.html`)
2. Role-based routing (awaits session + profile)
3. Routing logic matches spec exactly
4. No redirect loops
5. Terminal error pages

### 🟡 MINOR ISSUE
1. **Workspace headers missing company name**
   - **Impact**: Low (UX issue, not functional)
   - **Priority**: Medium (nice-to-have for context)
   - **Fix**: Add company name to CRM and Sales OS headers

---

## Recommendation

### Issue: Workspace Headers Missing Company Name

**Fix Required**: Add company name display to workspace headers

**Files to Update**:
- `/crm/index.html`
- `/system/index.html`

**Implementation**:
```javascript
// In both files, after loading profile:
if (profile.org_id) {
  const { data: org } = await sb
    .from('organisations')
    .select('name')
    .eq('id', profile.org_id)
    .single();
  
  if (org) {
    // Add to header element
    document.getElementById('company-name-display').textContent = org.name;
  }
}
```

**HTML Addition** (add to header):
```html
<div class="header-company">
  <span style="color: var(--t3); font-size: 0.75rem;">Company:</span>
  <span id="company-name-display" style="color: var(--t1); font-weight: 600;">Loading...</span>
</div>
```

**Priority**: MEDIUM (defer to STEP 5 or post-MVP)

---

## User Testing Checklist

Test the complete onboarding/login flow:

### Test 1: New User Onboarding
- [ ] User receives invite link
- [ ] Clicks link → lands on set-password.html
- [ ] Sees pre-activation screen
- [ ] Clicks "Continue to Set Password"
- [ ] Sets password successfully
- [ ] Routed to correct workspace based on role

### Test 2: Returning User Login
- [ ] User visits /app/auth.html
- [ ] Enters credentials
- [ ] Successful login → launcher.html
- [ ] Auto-routed based on role
- [ ] No redirect loops
- [ ] Company name shows in launcher (if applicable)

### Test 3: Role-Based Routing
Test each role:
- [ ] super_duper_admin → master-console.html
- [ ] super_admin → company-dashboard.html
- [ ] admin (crm_enabled=true) → crm/index.html
- [ ] admin (crm_enabled=false) → system/index.html
- [ ] sdr (crm_enabled=true) → crm/index.html
- [ ] account_executive (crm_enabled=false) → system/index.html
- [ ] public → system/index.html

### Test 4: Session Persistence
- [ ] Login
- [ ] Navigate to workspace
- [ ] Refresh page
- [ ] Session persists (no re-login required)
- [ ] User info still shows correctly

### Test 5: Logout
- [ ] Click logout from any page
- [ ] Session cleared
- [ ] Redirected to auth.html
- [ ] Cannot access protected pages without login

---

## Conclusion

**STEP 4 Status**: 🟡 MOSTLY COMPLIANT

**Critical Items**: ✅ All compliant (routing, session, auth guards)

**Minor Items**: 
- ⚠️ Workspace headers missing company name (low priority)

**Recommendation**: 
- **ACCEPT** current implementation as compliant for MVP
- **DEFER** workspace header enhancement to post-MVP or STEP 5

**User Testing**: Ready for end-to-end testing (see checklist above)

---

**Next**: Proceed to STEP 5 (User Management + Invites)
