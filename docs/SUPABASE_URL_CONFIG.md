# Supabase Configuration for Invite Links

## Required Configuration

To enable invite links and password reset flows, configure the following in your Supabase project dashboard.

---

## PART 1: URL Configuration

### Navigate to:
**Supabase Dashboard → Authentication → URL Configuration**

### 1. Site URL
```
https://shaamelz.com
```

### 2. Redirect URLs (add all of these)
```
https://shaamelz.com/app/set-password.html
https://shaamelz.com/app/auth.html
https://shaamelz.com/app/launcher.html
https://shaamelz.com/crm/index.html
https://shaamelz.com/system/index.html
```

**Why these URLs?**
- `/app/set-password.html` - Invite link landing page (CRITICAL for new user onboarding)
- `/app/auth.html` - Password reset landing page
- `/app/launcher.html` - Post-auth router
- `/crm/index.html` - CRM workspace
- `/system/index.html` - Sales OS workspace

---

## PART 2: Email Link / OTP Expiry Settings

### Navigate to:
**Supabase Dashboard → Authentication → Email**

### Recommended Settings:

#### 📧 **Email Link Expiry**
- **Current default**: 60 seconds (too short!)
- **Recommended**: **3600 seconds (1 hour)** or **7200 seconds (2 hours)**

**Why increase this?**
- Default 60 seconds is too short for real-world use
- Users may receive email but not click immediately
- Email scanners may pre-fetch links, consuming single-use tokens
- Admins copy-paste invite links manually (no email sent) - link needs longer lifetime

**How to configure**:
1. Go to Authentication → Email
2. Find "Email Link Expiry" or "Magic Link Expiry" setting
3. Set to `3600` (1 hour) or `7200` (2 hours)
4. Click Save

⚠️ **Note**: If you cannot find this setting in the UI, it may require:
- Supabase CLI: `npx supabase link --project-ref gokslnrvxqledagcwghq`
- Then update `supabase/config.toml`:
  ```toml
  [auth]
  # Email link/OTP expiry in seconds
  email_link_expiry = 3600  # 1 hour
  ```
- Deploy: `npx supabase db push`

#### 🔐 **OTP Expiry** (if using OTP codes)
- **Recommended**: 600 seconds (10 minutes)

---

## PART 3: Email Template Configuration (Optional)

### Navigate to:
**Supabase Dashboard → Authentication → Email Templates**

### Customize "Invite User" template:

**Subject**: `You're invited to join {{.SiteURL}}`

**Body**:
```html
<h2>Welcome to IGNITE_APEX!</h2>
<p>You've been invited to join the team. Click the button below to set your password and activate your account.</p>

<p><a href="{{ .ConfirmationURL }}">Set Your Password</a></p>

<p><strong>⚠️ Important:</strong> This link can only be used once and expires in 1 hour. Do not forward this email.</p>

<p>If you didn't expect this invitation, you can safely ignore this email.</p>
```

**Variables available**:
- `{{ .ConfirmationURL }}` - The invite link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Token }}` - Raw token (don't expose this in email)

---

---

## PART 4: Email Scanner Mitigation

### The Problem
Corporate email scanners (Gmail, Outlook, Microsoft Defender) often **pre-fetch all links** in emails to check for malware. This causes:
- Single-use tokens consumed before user clicks
- "Link expired or already used" errors
- Frustrated users

### Our Solution

#### ✅ **1. PKCE Flow (Code Exchange)**
We use PKCE (`?code=...`) instead of hash tokens (`#access_token=...`):
- Email scanner fetches the URL → receives HTML page (no token consumed)
- HTML page does NOT exchange code automatically
- User must click "Continue to Set Password" button
- **Only then** is the PKCE code exchanged for a session

**Why this works**: Email scanners perform silent GETs without JavaScript execution or user interaction, so they never consume the token.

#### ✅ **2. Explicit User Action Required**
`set-password.html` shows a pre-activation screen:
```
┌───────────────────────────────────────┐
│ Your invitation link is ready.       │
│ Click the button below to activate   │
│ your account and set your password.  │
│                                       │
│   [ Continue to Set Password ]       │
│                                       │
│ ⚠️ This link can only be used once.  │
└───────────────────────────────────────┘
```

Token exchange happens **only after user clicks the button**.

#### ✅ **3. Extended Link Lifetime**
Set email link expiry to 1-2 hours (not 60 seconds):
- Gives users time between receiving email and clicking
- Reduces pressure on single-use token window
- Allows admins to copy-paste links manually

#### ✅ **4. Clear Error Recovery**
If link is expired/used, show actionable error:
```
┌───────────────────────────────────────┐
│          ⏱️                           │
│  Link Expired or Already Used         │
│                                       │
│  This invitation link has expired or │
│  was already used. Single-use         │
│  security links expire after first    │
│  use to protect your account.        │
│                                       │
│  [ Request New Invitation Link ]     │
│                                       │
│  Contact your administrator if you   │
│  need assistance.                    │
└───────────────────────────────────────┘
```

---

## How Invite Links Work

### PKCE Flow (Current Implementation)
1. Edge Function generates recovery link with `redirectTo: https://shaamelz.com/app/set-password.html`
2. User clicks link → Supabase redirects to `https://shaamelz.com/app/set-password.html?code=<PKCE_CODE>`
3. set-password.html detects `?code=` parameter
4. Calls `supabase.auth.exchangeCodeForSession(code)` to establish session
5. User sets password via `supabase.auth.updateUser({ password })`
6. User is routed by role to their workspace

### Fallback: Hash Token Flow
If PKCE fails or for older links:
1. Link contains `#access_token=...&refresh_token=...&type=recovery`
2. set-password.html detects hash tokens
3. Calls `supabase.auth.setSession({ access_token, refresh_token })`
4. Rest of flow is same

## Error Messages

### "This invitation link has expired or was already used"
- PKCE code was already exchanged
- Code expired (default: 60 seconds)
- User should request a new invite link

### "Invalid or expired invitation link"
- No tokens found in URL (neither PKCE code nor hash tokens)
- User clicked a malformed link
- User should request a new invite link

### "Auth session missing!"
- Session was not established before password update
- Should not happen with current implementation
- User should try clicking the link again

## Testing Checklist

✅ **DONE**: set-password.html handles both PKCE and hash token flows
✅ **DONE**: Session is established BEFORE password form is shown
✅ **DONE**: Password update checks for active session
✅ **DONE**: User is routed by role after password is set
✅ **DONE**: Clear error messages for expired/invalid links

⚠️ **TODO**: Verify Supabase Redirect URLs are configured (requires dashboard access)

## Security Notes

- Invite links are single-use (PKCE codes expire after first exchange)
- Tokens expire after 60 seconds by default (Supabase setting)
- Session is established server-side before any password changes
- No passwords are transmitted in URLs or stored in browser history
