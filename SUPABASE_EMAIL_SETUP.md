# Supabase Email Template Configuration

## Configure Email Templates in Supabase Dashboard

Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/templates

### 1. Confirm Signup Template

**Subject:** Welcome to IGNITE_APEX - Confirm Your Email

**Body (HTML):**
```html
<h2>Welcome to IGNITE_APEX CRM!</h2>

<p>Hi {{ .Data.name }},</p>

<p>Thank you for signing up for IGNITE_APEX CRM.</p>

<h3>Your Login Credentials:</h3>
<ul>
  <li><strong>User ID (Email):</strong> {{ .Email }}</li>
  <li><strong>Password Key:</strong> <code style="background:#f0f0f0;padding:4px 8px;border-radius:4px;font-size:1.1em">{{ .Data.password_key }}</code></li>
</ul>

<p><strong>⚠️ Save your password key somewhere safe!</strong> You'll need it to sign in.</p>

<p>To complete your registration and access the CRM, please confirm your email address:</p>

<p><a href="{{ .ConfirmationURL }}" style="background:#F59E0B;color:#000;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold">Confirm Email & Sign In</a></p>

<p>After confirming, you'll be redirected to the sign-in page where your email will be pre-filled. Just enter your password key to access your account.</p>

<p>If you didn't create this account, you can safely ignore this email.</p>

<hr>

<p style="color:#666;font-size:0.9em">
IGNITE_APEX CRM<br>
Sales Methodology & Pipeline Management
</p>
```

**Redirect URL:** 
```
{{ .SiteURL }}/app/auth.html?email={{ .Email }}
```

---

## How It Works

### Signup Flow:
1. User fills: Name, Organization, Email
2. System generates random password key (12 characters)
3. User sees password key on screen: "Save this password key!"
4. System creates:
   - Auth user in `auth.users`
   - Organization in `organisations` table
   - User record in `public.users` with org_id
5. Supabase sends email with:
   - User ID (email)
   - Password Key (embedded in email)
   - Confirmation link with `?email=user@example.com` parameter

### Email Confirmation Flow:
1. User clicks "Confirm Email & Sign In" link in email
2. Link goes to: `https://shaamelz.com/app/auth.html?email=user@example.com`
3. Email field is auto-filled
4. Success message: "✓ Email confirmed! Please enter your password key to sign in."
5. Password field is focused
6. User enters password key from email (or from signup screen)
7. System validates credentials
8. Redirects to CRM dashboard

---

## Alternative: Store Password Key in User Metadata

If Supabase doesn't allow custom variables in email templates, we can:

1. Store password key in `user_metadata` during signup
2. Access it in email template with `{{ .Data.password_key }}`

This is already implemented in the signup code:
```javascript
options: {
  data: {
    name: name,
    org_name: orgName,
    password_key: passwordKey  // ← Available as {{ .Data.password_key }}
  }
}
```

---

## Testing

1. Go to https://shaamelz.com/app/auth.html
2. Click "Create an account"
3. Fill:
   - Name: Test User
   - Organization: Test Org
   - Email: your-email@example.com
4. Click "Create Account"
5. You'll see: "Save this password key: ABC123XYZ456"
6. Check your email for confirmation link
7. Email should show the same password key
8. Click confirmation link
9. Should redirect to signin page with email pre-filled
10. Enter password key from email
11. Should log in successfully

---

## Fallback (Current Behavior)

Until email templates are configured:
- Password key is shown on screen after signup
- User must manually save it
- Confirmation email still sent (with default Supabase template)
- After clicking confirmation link, user enters saved password key

---

## Next Steps

1. Update email templates in Supabase dashboard (link above)
2. Test signup flow end-to-end
3. Verify password key appears in email
4. Verify auto-login works after email confirmation
