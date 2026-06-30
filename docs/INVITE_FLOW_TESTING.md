# Invite Flow Testing Guide

## Pre-Test Checklist

### ✅ Supabase Configuration
Before testing, verify these settings in Supabase Dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `https://shaamelz.com`
   - Redirect URLs include: `https://shaamelz.com/app/set-password.html`

2. **Authentication → Email Settings**
   - Email Link Expiry: **3600 seconds (1 hour)** or higher
   - NOT the default 60 seconds

3. **Edge Functions**
   - `generate-invite-link` deployed successfully
   - Check logs for any errors

---

## Test Scenarios

### 🧪 TEST 1: Happy Path - New User Invite

**Steps:**
1. Login as **reenusha19** (super_admin) at https://shaamelz.com/app/auth.html
2. Navigate to Company Dashboard
3. Click "Add Team Member"
4. Fill in:
   - Email: `test-user-{timestamp}@example.com` (use unique email each time)
   - Name: Test User
   - Role: sdr
   - Manager: (select yourself)
   - CRM Enabled: Yes
5. Click "Invite"
6. Copy the setup link from success message
7. Open link in **incognito/private window**

**Expected Result:**
```
✅ Page loads quickly (no delay)
✅ Shows pre-activation screen:
   "Your invitation link is ready. Click the button below to activate..."
   [ Continue to Set Password ]
   "⚠️ This link can only be used once."

✅ User clicks "Continue to Set Password"
✅ Shows "Verifying invitation link..." spinner
✅ Shows welcome message:
   "Hi, Test User!"
   "You've been invited to join [Company Name]."
✅ Password form is enabled
✅ User enters password (min 8 chars) and confirms
✅ Shows "✓ Password set successfully! Redirecting..."
✅ User is redirected to CRM workspace (because crm_enabled=true)
✅ No redirect loops
✅ CRM shows correct company data
```

**Timing:**
- Pre-activation screen: < 1 second
- After clicking Continue: 1-2 seconds to show password form
- After setting password: 1-2 seconds to redirect

---

### 🧪 TEST 2: Email Scanner Simulation

**Purpose**: Verify email scanners don't consume the invite token.

**Steps:**
1. Generate invite link (same as TEST 1, steps 1-6)
2. **Before opening in browser**, use curl to simulate email scanner:
   ```bash
   curl -I "https://shaamelz.com/app/set-password.html?code=XXXX"
   ```
   (Replace XXXX with actual PKCE code from invite link)
3. Check response: should be 200 OK with HTML
4. **Now** open the same link in browser (incognito)

**Expected Result:**
```
✅ curl request completes successfully (200 OK)
✅ Browser still shows pre-activation screen (token NOT consumed by curl)
✅ User can click "Continue" and proceed normally
✅ Password can be set successfully
```

**If this fails**: Token was consumed by curl request, indicating the page is calling `exchangeCodeForSession()` on page load instead of waiting for user button click.

---

### 🧪 TEST 3: Expired Link Handling

**Steps:**
1. Generate invite link
2. Open link in browser
3. Click "Continue to Set Password" to consume the token
4. Set password and complete flow
5. Try to open the **same link** again in new incognito window

**Expected Result:**
```
✅ Shows pre-activation screen initially
✅ User clicks "Continue to Set Password"
✅ Shows spinner briefly
✅ Shows expired link screen:
   "⏱️ Link Expired or Already Used"
   "This invitation link has expired or was already used."
   [ Request New Invitation Link ]
   "Contact your administrator if you need assistance."
✅ Clicking "Request New Link" shows alert with instructions
```

---

### 🧪 TEST 4: Duplicate Email Error

**Steps:**
1. Login as **reenusha19** (super_admin)
2. Navigate to Company Dashboard
3. Click "Add Team Member"
4. Enter email: **shaamel1970@gmail.com** (already exists as admin_m)
5. Fill other fields, click "Invite"

**Expected Result:**
```
✅ Invite fails with clear error message:
   "User with email shaamel1970@gmail.com already exists in the system.
    Email addresses must be unique across all organizations.
    Please use a different email address or contact the existing user's administrator."
✅ NO invite link is generated
✅ UI shows error clearly
```

---

### 🧪 TEST 5: Malformed Link

**Steps:**
1. Visit URL without any tokens:
   ```
   https://shaamelz.com/app/set-password.html
   ```
2. Visit URL with invalid code:
   ```
   https://shaamelz.com/app/set-password.html?code=invalid-code-12345
   ```

**Expected Result:**

**Scenario 1 (no tokens):**
```
✅ Shows expired link screen immediately
✅ No "Continue" button shown
✅ Clear error: "Invalid or expired invitation link"
```

**Scenario 2 (invalid code):**
```
✅ Shows pre-activation screen (token exists in URL)
✅ User clicks "Continue"
✅ Shows error: "Could not verify invitation link"
✅ Shows expired link screen with recovery options
```

---

### 🧪 TEST 6: Role-Based Routing

**Purpose**: Verify users land in correct workspace after password setup.

**Test Matrix:**

| Role | crm_enabled | Expected Landing Page |
|------|-------------|----------------------|
| super_admin | N/A | `/app/company-dashboard.html` |
| admin | true | `/crm/index.html` |
| admin | false | `/system/index.html` |
| admin_m | true | `/crm/index.html` |
| sdr | true | `/crm/index.html` |
| account_executive | false | `/system/index.html` |

**Steps:**
For each role:
1. Create invite with specific role + crm_enabled setting
2. Complete password setup
3. Verify landing page matches expected

**Expected Result:**
```
✅ Each role lands on correct workspace
✅ No redirect loops
✅ Workspace loads user profile correctly
✅ RLS filters data correctly (user sees only allowed data)
```

---

### 🧪 TEST 7: Long Link Lifetime

**Purpose**: Verify extended link expiry works.

**Prerequisite**: Email Link Expiry set to 3600 seconds (1 hour)

**Steps:**
1. Generate invite link
2. **Wait 5 minutes**
3. Open link and complete flow

**Expected Result:**
```
✅ Link still works after 5 minutes
✅ Password can be set successfully
✅ User is routed to workspace
```

**If Expiry = 60 seconds (default):**
```
❌ Link expires after 60 seconds
❌ Shows "expired" error after waiting 5 minutes
```

---

## Common Issues & Troubleshooting

### Issue: "Auth session missing!" error

**Cause**: Session not established before password update

**Check**:
1. Browser console shows `[SetPassword] PKCE session established for: user@example.com`
2. If not, check if `exchangeCodeForSession()` succeeded
3. Verify Supabase Redirect URLs are configured

**Fix**: Verify URL configuration in Supabase Dashboard

---

### Issue: Token consumed by email scanner

**Symptoms**:
- User clicks invite link → shows "expired" immediately
- Link works once but never again (even if user didn't complete flow)

**Diagnosis**:
1. Check browser console on first page load
2. If you see `[SetPassword] Exchanging PKCE code for session...` immediately on page load (before user clicks button), the fix isn't working
3. Token should ONLY be exchanged after user clicks "Continue to Set Password"

**Fix**: Verify `init()` function doesn't call `exchangeCodeForSession()` - should only store token info

---

### Issue: Redirect loop after password set

**Symptoms**:
- Password set successfully
- Page redirects but then redirects again
- Flashing between pages

**Diagnosis**:
Check the target workspace's auth guard:
1. Does it wait for full session + profile?
2. Does it have explicit allowed roles list?
3. Does it have terminal error page (no auto-redirect)?

**Fix**: See `system/index.html` and `crm/index.html` auth guards - they should NOT redirect back to set-password

---

### Issue: "User already exists" but no user visible

**Symptoms**:
- Invite fails with "user already exists"
- But user is not in team list

**Diagnosis**:
1. Check `auth.users` table in Supabase Dashboard
2. User may exist in auth but not in `public.users` table (orphaned)

**Fix**: 
- Delete orphaned auth user via Supabase Dashboard → Authentication → Users
- OR update Edge Function to handle orphaned records

---

## Performance Benchmarks

**Expected timing:**

| Step | Target Time | Acceptable Range |
|------|-------------|------------------|
| Page load (pre-activation) | < 1s | 0.5s - 2s |
| PKCE code exchange | < 2s | 1s - 3s |
| Profile fetch | < 1s | 0.5s - 2s |
| Password update | < 2s | 1s - 3s |
| Redirect to workspace | < 1s | 0.5s - 2s |
| **Total (user clicks Continue to workspace load)** | **< 6s** | **3s - 10s** |

**If slower**: Check network tab for slow Supabase API calls or RLS policy queries

---

## Security Checklist

✅ **Link Consumption**
- [ ] Token only consumed on explicit user action (button click)
- [ ] No automatic token exchange on page load
- [ ] Email scanner pre-fetch doesn't consume token

✅ **Error Messages**
- [ ] No sensitive data in error messages
- [ ] No auth tokens visible in UI
- [ ] Clear, actionable error guidance

✅ **Session Security**
- [ ] Session established server-side (Supabase auth)
- [ ] No passwords in URLs or browser history
- [ ] Session invalidated on logout

✅ **Link Expiry**
- [ ] Single-use tokens (can't reuse link)
- [ ] Reasonable expiry window (1+ hours)
- [ ] Clear expired link messaging

---

## Post-Test Cleanup

After testing, clean up test users:

1. Login as **reenusha19** (super_admin)
2. Navigate to Company Dashboard → Team
3. Find test users (test-user-*)
4. Click "Deactivate" on each test user
5. OR use master console to bulk deactivate

**Note**: Deactivation keeps the user record but sets `is_active=false`, preventing login while preserving audit trail.
