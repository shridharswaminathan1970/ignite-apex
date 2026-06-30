# 📧 Configure Supabase Email Template with Password Key

## Critical: Update Email Template to Include Password

The signup flow generates a password key, but Supabase's default confirmation email doesn't include it. You must update the email template.

---

## Step 1: Go to Email Templates

**URL:** https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/templates

Or navigate:
1. Go to Supabase Dashboard
2. Select your project: **gokslnrvxqledagcwghq**
3. Click **Authentication** in sidebar
4. Click **Email Templates**

---

## Step 2: Edit "Confirm signup" Template

Click on **"Confirm signup"** template

---

## Step 3: Update Subject Line

**Subject:**
```
Welcome to IGNITE_APEX - Your Login Credentials
```

---

## Step 4: Update Email Body (HTML)

Replace the entire email body with this:

```html
<h2 style="color:#F59E0B;font-family:sans-serif">Welcome to IGNITE_APEX CRM!</h2>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  Hi <strong>{{ .Data.name }}</strong>,
</p>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  Thank you for signing up for <strong>IGNITE_APEX CRM</strong>. Your account has been created for <strong>{{ .Data.org_name }}</strong>.
</p>

<div style="background:#f8f9fa;border-left:4px solid #F59E0B;padding:20px;margin:20px 0">
  <h3 style="font-family:sans-serif;color:#333;margin-top:0">🔑 Your Login Credentials</h3>
  <table style="font-family:sans-serif;font-size:16px;width:100%">
    <tr>
      <td style="padding:8px 0"><strong>User ID (Email):</strong></td>
      <td style="padding:8px 0">{{ .Email }}</td>
    </tr>
    <tr>
      <td style="padding:8px 0"><strong>Password Key:</strong></td>
      <td style="padding:8px 0">
        <code style="background:#1E2333;color:#F59E0B;padding:8px 12px;border-radius:6px;font-size:18px;font-weight:bold;letter-spacing:1px">{{ .Data.password_key }}</code>
      </td>
    </tr>
  </table>
</div>

<p style="font-family:sans-serif;color:#d32f2f;font-size:16px;background:#ffebee;padding:12px;border-radius:6px">
  ⚠️ <strong>Save your password key somewhere safe!</strong> You'll need it every time you sign in.
</p>

<h3 style="font-family:sans-serif;color:#333">Next Step: Confirm Your Email</h3>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  Click the button below to confirm your email address and access your CRM:
</p>

<p style="text-align:center;margin:30px 0">
  <a href="{{ .ConfirmationURL }}" 
     style="background:#F59E0B;
            color:#000;
            padding:14px 32px;
            text-decoration:none;
            border-radius:8px;
            font-family:sans-serif;
            font-size:16px;
            font-weight:bold;
            display:inline-block">
    Confirm Email & Sign In
  </a>
</p>

<p style="font-family:sans-serif;color:#666;font-size:14px">
  After confirming, you'll be taken to the sign-in page where you can log in using your email and password key shown above.
</p>

<hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0">

<p style="font-family:sans-serif;color:#999;font-size:13px">
  If you didn't create this account, you can safely ignore this email.
</p>

<p style="font-family:sans-serif;color:#999;font-size:13px">
  <strong>IGNITE_APEX CRM</strong><br>
  Sales Methodology & Pipeline Management<br>
  <a href="https://shaamelz.com" style="color:#F59E0B">shaamelz.com</a>
</p>
```

---

## Step 5: Update Redirect URL

In the **"Redirect URL"** field, set:

```
{{ .SiteURL }}/app/auth.html?email={{ .Email }}
```

This ensures the user lands on the login page with their email pre-filled.

---

## Step 6: Save Template

Click **Save** button at the bottom

---

## How the Variables Work

The template uses these variables that we set during signup:

| Variable | Source | Value |
|----------|--------|-------|
| `{{ .Email }}` | Supabase auth | User's email address |
| `{{ .Data.name }}` | signup options.data | User's full name |
| `{{ .Data.org_name }}` | signup options.data | Organization name |
| `{{ .Data.password_key }}` | signup options.data | Generated password key |
| `{{ .ConfirmationURL }}` | Supabase | Email confirmation link |
| `{{ .SiteURL }}` | Supabase project settings | https://shaamelz.com |

These are set in `auth.html` during signup:

```javascript
await window.IAdb.supabase.auth.signUp({
  email: email,
  password: passwordKey,
  options: {
    data: {
      name: name,              // ← {{ .Data.name }}
      org_name: orgName,       // ← {{ .Data.org_name }}
      password_key: passwordKey // ← {{ .Data.password_key }}
    },
    emailRedirectTo: `${origin}/app/auth.html?email=${email}`
  }
});
```

---

## Verification

### Test the Email Template:

1. Create a new test account at https://shaamelz.com/app/auth.html
2. Check the email you receive
3. Verify it includes:
   - ✅ Your name
   - ✅ Your organization name
   - ✅ Your email (User ID)
   - ✅ **Your password key in a highlighted box**
   - ✅ "Confirm Email & Sign In" button

4. Click the confirmation button
5. Should redirect to: `https://shaamelz.com/app/auth.html?email=your-email@example.com`
6. Email should be pre-filled
7. Enter the password key from the email
8. Should log in successfully

---

## Alternative: Plain Text Email (if HTML not supported)

If the HTML template doesn't work, use this plain text version:

**Subject:** Welcome to IGNITE_APEX - Your Login Credentials

**Body:**
```
Welcome to IGNITE_APEX CRM!

Hi {{ .Data.name }},

Thank you for signing up. Your account has been created for {{ .Data.org_name }}.

YOUR LOGIN CREDENTIALS:
=======================
User ID (Email): {{ .Email }}
Password Key: {{ .Data.password_key }}

⚠️ IMPORTANT: Save your password key somewhere safe! You'll need it to sign in.

CONFIRM YOUR EMAIL:
Click this link to confirm your email and access the CRM:
{{ .ConfirmationURL }}

After confirming, you'll be able to sign in at https://shaamelz.com/app/auth.html using your email and password key.

---
IGNITE_APEX CRM
Sales Methodology & Pipeline Management
https://shaamelz.com
```

---

## What Happens After Email Confirmation

### Updated Flow (with fix):

1. User clicks confirmation link in email
2. Link goes to: `https://shaamelz.com/app/auth.html?email=user@example.com`
3. **NEW:** System detects email confirmation and signs user out immediately
4. Email field auto-filled
5. Success message: "✓ Email confirmed! Please enter your password key to sign in."
6. User enters password key (from email or signup screen)
7. Clicks "Sign In"
8. Password validated
9. Redirects to CRM

This ensures users must **always validate their password** before accessing the CRM.

---

## Testing Checklist

After configuring the email template:

- [ ] Create new account with test email
- [ ] Check inbox for confirmation email
- [ ] Verify password key is visible in email
- [ ] Click "Confirm Email & Sign In" button
- [ ] Verify redirects to login page (not CRM directly)
- [ ] Verify email is pre-filled
- [ ] Enter password key from email
- [ ] Verify login works
- [ ] Verify redirects to CRM after valid login
- [ ] Try wrong password - should fail
- [ ] Try correct password - should succeed

---

## Troubleshooting

### Password key not showing in email?

Check that the variable name matches exactly:
- In signup code: `password_key: passwordKey`
- In email template: `{{ .Data.password_key }}`

### User still auto-logs in after email confirmation?

The code now signs the user out when it detects email confirmation. Make sure the latest deployment is live:
```bash
cd C:/Projects/ignite-apex
netlify deploy --prod --dir=.
```

### Email template changes not taking effect?

- Wait 1-2 minutes for Supabase to update
- Clear browser cache
- Try incognito window for fresh test

---

## Next Steps

1. ✅ Update email template in Supabase (this guide)
2. ✅ Deploy latest auth.html (already done)
3. ✅ Test complete signup flow
4. ✅ Verify password validation works
5. ✅ Test with real email account

---

**Status: Awaiting email template configuration in Supabase dashboard**

Once you update the template, the complete workflow will be:
- Signup → Password shown on screen + sent in email
- Email confirmation → Redirects to login (signed out)
- Login → Must enter password to access CRM
