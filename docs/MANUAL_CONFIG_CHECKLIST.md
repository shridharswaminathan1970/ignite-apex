# Manual Configuration Checklist

This document lists all manual configurations required in Supabase Dashboard before the invite flow will work correctly.

**Project**: gokslnrvxqledagcwghq  
**Production URL**: https://shaamelz.com  
**Status**: ⚠️ REQUIRES DASHBOARD ACCESS

---

## ✅ Configuration Checklist

### 1. Authentication → URL Configuration

**Navigate to**: Supabase Dashboard → Authentication → URL Configuration

#### Site URL
```
https://shaamelz.com
```

**Status**: ❓ Unknown (requires dashboard access to verify)

#### Redirect URLs
Add ALL of these URLs (one per line):

```
https://shaamelz.com/app/set-password.html
https://shaamelz.com/app/auth.html
https://shaamelz.com/app/launcher.html
https://shaamelz.com/crm/index.html
https://shaamelz.com/system/index.html
```

**Why needed**: 
- PKCE flow redirects to these URLs after authentication
- Without this, Supabase will reject the redirect and show error page

**Status**: ❓ Unknown (requires dashboard access to verify)

**How to add**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Scroll to "Redirect URLs" section
3. Click "Add URL"
4. Paste each URL above (one at a time)
5. Click "Save"

---

### 2. Authentication → Email Settings

**Navigate to**: Supabase Dashboard → Authentication → Email

#### Email Link Expiry

**Current default**: 60 seconds (too short!)

**Recommended value**: 
```
3600 (1 hour)
```

**Alternative**: 
```
7200 (2 hours)
```

**Why needed**: 
- Default 60 seconds is too short for users to read email and click
- Email scanners may pre-fetch links, consuming tokens
- Admins copy-paste invite links manually (no urgency)

**Status**: ❓ Unknown (requires dashboard access to verify)

**How to configure**:
1. Go to Supabase Dashboard → Authentication → Email
2. Find "Email Link Expiry" or "Magic Link Expiry" setting
3. Change from `60` to `3600`
4. Click "Save"

**If setting not found in UI**:
```bash
# Update via CLI (requires local Docker)
# Edit supabase/config.toml:
[auth]
email_link_expiry = 3600

# Deploy:
npx supabase db push --project-ref gokslnrvxqledagcwghq
```

---

### 3. SMTP Configuration (Optional but Recommended)

**Navigate to**: Supabase Dashboard → Authentication → Email → SMTP Settings

**Current status**: Gmail SMTP configured for muhammad.shaamel@gmail.com

**Settings**:
- Host: smtp.gmail.com
- Port: 587
- User: muhammad.shaamel@gmail.com
- Password: (app-specific password)

**Status**: ✅ Configured (but email delivery not tested)

**Test email delivery**:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Invite User"
3. Enter test email address
4. Check if email arrives

**If emails not arriving**:
- Check Gmail "Less secure apps" setting
- Use App-Specific Password instead of account password
- Check Supabase email logs

---

### 4. Edge Functions Secrets

**Navigate to**: Supabase Dashboard → Edge Functions → Secrets

**Required secrets**: None (all functions use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` which are auto-injected)

**Status**: ✅ No action required

---

## 🧪 Verification Steps

After configuring the above, verify each setting:

### Verify Redirect URLs

**Test**: 
1. Generate invite link via Company Dashboard
2. Open link in browser
3. Should redirect to `https://shaamelz.com/app/set-password.html?code=...`
4. Should NOT show Supabase error page

**Expected**: Pre-activation screen shows

**If fails**: Redirect URL not configured correctly

---

### Verify Email Link Expiry

**Test**:
1. Generate invite link
2. Wait 5 minutes
3. Open link
4. Should still work (if expiry >= 300 seconds)

**Expected**: Pre-activation screen shows, token can be exchanged

**If fails**: Link expires too quickly (still set to 60 seconds)

---

### Verify Email Delivery

**Test**:
1. Invite new user via Company Dashboard
2. Check if email arrives at user's inbox
3. Check spam folder if not in inbox

**Expected**: Email arrives within 1-2 minutes

**If fails**: 
- SMTP not configured correctly
- Gmail blocking emails
- Supabase email rate limit reached

---

## 📊 Configuration Status Summary

| Setting | Required | Status | Priority |
|---------|----------|--------|----------|
| Site URL | Yes | ❓ Unknown | 🔴 Critical |
| Redirect URLs | Yes | ❓ Unknown | 🔴 Critical |
| Email Link Expiry | Yes | ❓ Unknown | 🟡 High |
| SMTP Settings | Recommended | ✅ Configured | 🟢 Medium |
| Edge Functions | Yes | ✅ Deployed | ✅ Done |

**Legend**:
- ✅ Configured and verified
- ❓ Unknown (requires dashboard access)
- ❌ Not configured
- 🔴 Critical (blocks invite flow)
- 🟡 High (UX degradation)
- 🟢 Medium (fallback exists)

---

## 🚨 Current Blockers

### BLOCKER 1: Redirect URLs Not Verified
**Impact**: Invite links may fail with Supabase error page instead of showing set-password page

**Resolution**: Configure Redirect URLs in Supabase Dashboard

**Workaround**: None

---

### BLOCKER 2: Email Link Expiry Not Verified
**Impact**: Links may expire after 60 seconds (too short for real-world use)

**Resolution**: Increase Email Link Expiry to 3600 seconds in Supabase Dashboard

**Workaround**: Regenerate links quickly if they expire

---

## 📝 Post-Configuration Actions

After configuring all settings:

1. **Test invite flow end-to-end**:
   - Login as reenusha19 (super_admin)
   - Invite new user
   - Open invite link
   - Set password
   - Verify routing to correct workspace

2. **Monitor Edge Function logs**:
   ```bash
   # Check logs for errors
   npx supabase functions logs generate-invite-link --project-ref gokslnrvxqledagcwghq
   ```

3. **Update this checklist**:
   - Mark items as ✅ once verified
   - Document any issues encountered
   - Update configuration values if different

---

## 🔗 Related Documentation

- `/docs/INVITE_FLOW_HARDENING.md` - Complete hardening implementation details
- `/docs/INVITE_FLOW_TESTING.md` - Comprehensive test suite
- `/docs/SUPABASE_URL_CONFIG.md` - Configuration guide with rationale
- `/docs/BUG_FIXES_2026-06-14.md` - Bug fixes timeline

---

## 💡 Tips

**Finding Supabase Dashboard**:
1. Go to https://supabase.com
2. Sign in with muhammad.shaamel@gmail.com
3. Select project: gokslnrvxqledagcwghq
4. Sidebar → Authentication → URL Configuration

**Verifying Configuration**:
- URL Configuration: Should see list of redirect URLs
- Email Settings: Should see email link expiry value
- If values are different, update this checklist

**Common Issues**:
- "Invalid redirect URL" → Redirect URL not in whitelist
- "Link expired" immediately → Email link expiry too short
- "Auth session missing" → Redirect URL not configured
- Email not arriving → SMTP not configured or rate limited
