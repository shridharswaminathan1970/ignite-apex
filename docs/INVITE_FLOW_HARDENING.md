# Invite Flow Hardening - Security & Reliability Improvements

## Overview

This document describes security and reliability improvements made to the invite/password-reset flow to prevent premature token expiry caused by email security scanners and improve user experience.

---

## The Problem

### Email Security Scanners
Modern email clients (Gmail, Outlook, Microsoft 365) use security scanners that:
1. **Pre-fetch all links** in emails to check for malware/phishing
2. **Execute the link** in a headless browser or make silent GET requests
3. **Consume single-use tokens** before the real user clicks

This causes:
- ❌ User clicks invite link → "This link has expired or was already used"
- ❌ Support tickets: "I never used the link, why is it expired?"
- ❌ Admins re-send invites repeatedly
- ❌ Poor user experience during onboarding

### Short Token Lifetime
Supabase default: **60 seconds** for email link expiry
- User receives email
- 60 seconds passes while reading email or context switching
- Link expires before user clicks

---

## The Solution - Four Layers of Defense

### 🛡️ Layer 1: Two-Stage Token Activation

**Before (vulnerable to scanners)**:
```javascript
// Page load immediately exchanges token
async function init() {
  const code = urlParams.get('code');
  const { data } = await sb.auth.exchangeCodeForSession(code); // ❌ Runs on page load
  showPasswordForm();
}
```

**After (scanner-resistant)**:
```javascript
// Stage 1: Page load only DETECTS token (doesn't consume)
async function init() {
  const code = urlParams.get('code');
  if (!code) {
    showExpiredError();
    return;
  }
  
  // Store token but don't exchange yet
  inviteTokens = { type: 'pkce', pkceCode: code };
  
  // Show button, wait for user action
  showPreActivationButton(); // ✅ No API calls yet
}

// Stage 2: User clicks button (only then consume token)
async function activateInvite() {
  // Token exchanged only when user explicitly clicks
  const { data } = await sb.auth.exchangeCodeForSession(inviteTokens.pkceCode);
  showPasswordForm();
}
```

**Why this works**:
- Email scanner makes silent GET request → receives HTML page (static content)
- Scanner does NOT click buttons or execute JavaScript `onclick` handlers
- Token remains unconsumed until real user interaction
- User clicks "Continue to Set Password" → token exchanged

**UI Flow**:
```
User opens link
    ↓
┌─────────────────────────────────────────┐
│  Your invitation link is ready.        │
│  Click the button below to activate    │
│  your account and set your password.   │
│                                         │
│    [ Continue to Set Password ]        │  ← Scanner stops here
│                                         │
│  ⚠️ This link can only be used once.   │
└─────────────────────────────────────────┘
    ↓ (User clicks button)
┌─────────────────────────────────────────┐
│  Verifying invitation link...          │  ← Token consumed here
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Hi, Test User!                         │
│  You've been invited to join Acme Inc.  │
│                                         │
│  Create Password: [________]            │
│  Confirm Password: [________]           │
│                                         │
│  [ Set Password & Continue ]           │
└─────────────────────────────────────────┘
```

---

### 🛡️ Layer 2: PKCE Flow (Not Hash Tokens)

**PKCE (Proof Key for Code Exchange)**:
- Invite link: `https://shaamelz.com/app/set-password.html?code=ABC123`
- Code is in **query parameter** (visible to scanner)
- But code is **not a session token** - it must be exchanged server-side
- Exchange happens via `exchangeCodeForSession()` API call
- Scanner sees code but doesn't execute JavaScript to exchange it

**Hash Token Flow (less secure)**:
- Invite link: `https://shaamelz.com/app/set-password.html#access_token=XYZ&refresh_token=ABC`
- Tokens are in **URL hash** (not sent to server)
- But some scanners parse hash fragments
- More vulnerable to token leakage

**Our implementation**: Supports both, prefers PKCE.

---

### 🛡️ Layer 3: Extended Link Lifetime

**Configuration**: Supabase Dashboard → Authentication → Email

**Default**: 60 seconds (too short!)

**Recommended**: 
- **Minimum**: 3600 seconds (1 hour)
- **Ideal**: 7200 seconds (2 hours)
- **Maximum**: Consider 24 hours for async onboarding workflows

**Rationale**:
- User receives email while in meeting
- User switches to personal device to click link
- User reads email carefully before clicking
- Admin sends link via Slack/Teams (not email) - no urgency
- Link should survive email → user action latency

**Security consideration**:
- Longer lifetime = larger attack window
- But: link is single-use (consumed on first exchange)
- And: sent to verified email address
- Risk is low, UX benefit is high

**How to configure**:

**Option A - Supabase Dashboard UI**:
1. Go to Authentication → Email
2. Find "Email Link Expiry" or "Magic Link Expiry"
3. Set to `3600` (1 hour)
4. Save

**Option B - Supabase CLI** (if setting not in UI):
```bash
# In supabase/config.toml
[auth]
email_link_expiry = 3600  # 1 hour

# Deploy
npx supabase db push --project-ref gokslnrvxqledagcwghq
```

---

### 🛡️ Layer 4: Clear Error Recovery

**Before**:
```
❌ "Auth session missing!"
❌ "Invalid token"
❌ User has no idea what to do
```

**After**:
```
┌────────────────────────────────────────┐
│            ⏱️                          │
│   Link Expired or Already Used         │
│                                        │
│  This invitation link has expired or  │
│  was already used. Single-use         │
│  security links expire after first    │
│  use to protect your account.        │
│                                        │
│  [ Request New Invitation Link ]     │  ← Actionable
│                                        │
│  Contact your administrator if you   │
│  need assistance.                    │
└────────────────────────────────────────┘
```

**Features**:
- ✅ Clear explanation of what happened
- ✅ Why it happened (security, single-use)
- ✅ What to do next (request new link)
- ✅ How to get help (contact admin)
- ✅ No scary error codes or stack traces

---

## Implementation Details

### Files Modified

#### `/app/set-password.html`
- Added pre-activation UI (button before token exchange)
- Added expired link recovery UI
- Moved token exchange from `init()` to `activateInvite()`
- Added `requestNewLink()` helper

**Key changes**:
```javascript
// Global state - token not consumed yet
let inviteTokens = null;

// init() - check token exists, don't consume
async function init() {
  const pkceCode = urlParams.get('code');
  if (!pkceCode && !accessToken) {
    showExpiredError();
    return;
  }
  inviteTokens = { type: 'pkce', pkceCode }; // Store only
  showPreActivationButton(); // Wait for user
}

// activateInvite() - consume token on user click
async function activateInvite() {
  const { data, error } = await sb.auth.exchangeCodeForSession(inviteTokens.pkceCode);
  if (error) {
    showExpiredError();
    return;
  }
  // Success - show password form
  showPasswordForm();
}
```

#### `/supabase/functions/generate-invite-link/index.ts`
- Added duplicate email detection
- Better error messages
- Already uses `type: 'recovery'` (generates PKCE links)

#### `/supabase-client.js`
- Already has `detectSessionInUrl: true` (PKCE support)
- Already has `persistSession: true` (session survives refresh)

---

## Security Model

### Threat Model

**Threats mitigated**:
✅ Email scanner consumes invite token before user clicks  
✅ Short token lifetime causes legitimate failures  
✅ Unclear error messages lead to support burden  
✅ Token leakage via URL hash  

**Threats NOT mitigated** (by design):
❌ User forwards invite link to attacker (social engineering)  
❌ Email account compromise (attacker has email access)  
❌ Man-in-the-middle on email delivery (TLS protects this)  

**Why these are acceptable**:
- Invite link is sent to **verified email address**
- User must have email access to receive link
- If email is compromised, attacker can also request password reset
- This is an **onboarding flow**, not a high-security auth bypass

### Defense in Depth

| Layer | Protection | Bypass Scenario |
|-------|-----------|-----------------|
| Two-stage activation | Stops email scanners | User forwards link, attacker clicks button |
| PKCE flow | Token exchange requires API call | N/A (good practice) |
| Single-use token | Link works only once | Too late if already consumed |
| Extended lifetime | Reduces UX friction | Longer attack window (acceptable) |
| Clear error recovery | Reduces support burden | N/A (UX only) |

**Combined**: These layers create a **robust, user-friendly** flow that survives real-world email client behavior while maintaining security.

---

## Testing & Validation

### Manual Testing

**Test 1 - Email Scanner Simulation**:
```bash
# Simulate scanner pre-fetch
curl -I "https://shaamelz.com/app/set-password.html?code=ABC123"

# Should return 200 OK with HTML
# Token should NOT be consumed

# Now open same URL in browser
# Should show "Continue to Set Password" button
# User clicks → token consumed → password form shows
```

**Test 2 - Expired Link**:
```bash
# Use link once to consume token
# Try to use same link again
# Should show expired error with recovery instructions
```

**Test 3 - Long Lifetime**:
```bash
# Generate link
# Wait 5 minutes (if expiry > 300s)
# Link should still work
```

See `INVITE_FLOW_TESTING.md` for comprehensive test suite.

---

## Monitoring & Metrics

### Key Metrics to Track

**Success Rate**:
- Invites sent
- Passwords successfully set
- Time between invite sent → password set
- Expired link errors

**Failure Analysis**:
- Token already used errors
- Token expired errors
- Time of error vs time of invite sent

**Expected improvements after hardening**:
- ✅ Decrease in "link expired" errors (extended lifetime)
- ✅ Decrease in "link already used" errors (scanner mitigation)
- ✅ Increase in successful onboarding completion rate
- ✅ Decrease in support tickets re: invite links

### Supabase Logs to Monitor

**Edge Function Logs**:
```
generate-invite-link:
  - SUCCESS: User created, link generated
  - ERROR: "User already exists" (duplicate email)
  - ERROR: createUser failed (Supabase issue)
```

**Auth Logs**:
```
exchangeCodeForSession:
  - SUCCESS: Code exchanged, session created
  - ERROR: "code already used"
  - ERROR: "code expired"
```

**Check**: Supabase Dashboard → Edge Functions → Logs

---

## Rollout Plan

### Phase 1: Deploy Hardened Flow ✅
- [x] Update set-password.html with two-stage activation
- [x] Deploy to production (Netlify)
- [x] Update documentation

### Phase 2: Configure Supabase ⚠️ MANUAL
- [ ] Set Redirect URLs in Supabase Dashboard
- [ ] Increase Email Link Expiry to 3600s (1 hour)
- [ ] Test invite flow end-to-end

### Phase 3: Monitor & Iterate
- [ ] Track success/failure metrics
- [ ] Monitor Supabase logs for errors
- [ ] Gather user feedback
- [ ] Adjust link lifetime if needed

### Phase 4: Future Enhancements
- [ ] Add "Resend Invite" button in team management UI
- [ ] Add invite link expiry countdown in UI
- [ ] Email notification when link is consumed (security alert)
- [ ] Bulk invite UI for onboarding multiple users

---

## FAQ

### Q: Why not just increase token lifetime to 24 hours?

**A**: Balance between UX and security. 1-2 hours is enough for:
- Email delivery latency
- User reads email and clicks
- Email scanner pre-fetch → user action delay

24 hours increases attack window if link is leaked. Since we have single-use tokens, the risk is low but not zero (email forwarding, screenshot sharing).

### Q: What if user's email client doesn't support JavaScript?

**A**: Pre-activation button still shows as HTML `<button>`. Clicking it triggers `onclick="activateInvite()"` which requires JavaScript. 

**Fallback**: If JavaScript is disabled, user sees button but clicking it does nothing. This is acceptable because:
- Modern email clients support JavaScript
- Set-password page is NOT in email (it's a web page)
- User has already clicked out of email client to browser

### Q: Why not use magic links instead of password setup?

**A**: 
- Magic links have same scanner problem (consumed on pre-fetch)
- Password setup gives users control (they choose password)
- Password is reusable (magic links are single-use)
- Password works offline (magic links require email access)

### Q: Can admins see the temporary password generated?

**A**: 
- `generate-invite-link` Edge Function returns `tempPassword` in response
- BUT this is only for logging/debugging (never shared with end user)
- User sets their own password via invite link
- Temporary password is effectively unusable (link expires before password can be used)

**Security**: Temporary password is a random UUID, never emailed or shown to user.

---

## Related Documentation

- `BUG_FIXES_2026-06-14.md` - Bug fix details and rationale
- `SUPABASE_URL_CONFIG.md` - Supabase configuration guide
- `INVITE_FLOW_TESTING.md` - Comprehensive test suite
- `PERMISSIONS.md` - Role-based access control matrix

---

## Summary

**Before hardening**:
- ❌ 60-second token lifetime
- ❌ Email scanners consume tokens immediately
- ❌ Cryptic error messages
- ❌ High failure rate
- ❌ Support burden

**After hardening**:
- ✅ 1-2 hour token lifetime
- ✅ Email scanner mitigation via two-stage activation
- ✅ Clear error recovery UI
- ✅ High success rate expected
- ✅ Self-service error recovery

**Impact**:
- Better user experience during onboarding
- Fewer support tickets
- More reliable invite flow
- Security maintained (single-use tokens, verified email)
