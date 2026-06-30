# Password Reset Email Template Configuration

## Setup in Supabase

Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/templates

---

## Template: "Reset Password"

### Subject:
```
IGNITE_APEX - Reset Your Password
```

### Body (HTML):
```html
<h2 style="color:#F59E0B;font-family:sans-serif">Password Reset Request</h2>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  Hi <strong>{{ .Data.name }}</strong>,
</p>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  We received a request to reset the password for your IGNITE_APEX account (<strong>{{ .Email }}</strong>).
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
    Reset Your Password
  </a>
</p>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  This link will expire in 1 hour for security reasons.
</p>

<div style="background:#fff3cd;border-left:4px solid:#ff9800;padding:16px;margin:20px 0;border-radius:4px">
  <p style="font-family:sans-serif;color:#856404;font-size:14px;margin:0">
    ⚠️ <strong>Security Notice:</strong><br>
    If you did not request this password reset, please <strong>ignore this email</strong> and contact us immediately at 
    <a href="mailto:info@shaamelz.com" style="color:#F59E0B;font-weight:bold">info@shaamelz.com</a>
  </p>
  <p style="font-family:sans-serif;color:#856404;font-size:14px;margin:8px 0 0 0">
    Your account security is important to us. We recommend changing your password if you suspect unauthorized access.
  </p>
</div>

<hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0">

<p style="font-family:sans-serif;color:#999;font-size:13px">
  This password reset was requested from: <strong>{{ .SiteURL }}</strong><br>
  Time: {{ .CreatedAt }}<br>
  If you didn't request this, your account is still secure.
</p>

<p style="font-family:sans-serif;color:#999;font-size:13px">
  <strong>IGNITE_APEX</strong><br>
  Sales Methodology & CRM Platform<br>
  <a href="https://shaamelz.com" style="color:#F59E0B">shaamelz.com</a>
</p>
```

---

## Additional Email: Password Reset Confirmation

Create a second email template for **after** password is successfully changed.

### Template Name: "Password Changed Notification"

This would need a custom Supabase Edge Function or webhook trigger.

### Subject:
```
IGNITE_APEX - Password Changed Successfully
```

### Body (HTML):
```html
<h2 style="color:#10B981;font-family:sans-serif">✓ Password Changed Successfully</h2>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  Hi <strong>{{ .Data.name }}</strong>,
</p>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  Your IGNITE_APEX password for <strong>{{ .Email }}</strong> has been successfully changed.
</p>

<p style="font-family:sans-serif;color:#333;font-size:16px">
  You can now sign in with your new password at:
</p>

<p style="text-align:center;margin:30px 0">
  <a href="https://shaamelz.com/app/auth.html" 
     style="background:#10B981;
            color:#fff;
            padding:14px 32px;
            text-decoration:none;
            border-radius:8px;
            font-family:sans-serif;
            font-size:16px;
            font-weight:bold;
            display:inline-block">
    Sign In to IGNITE_APEX
  </a>
</p>

<div style="background:#ffebee;border-left:4px solid:#f44336;padding:16px;margin:20px 0;border-radius:4px">
  <p style="font-family:sans-serif;color:#c62828;font-size:14px;margin:0">
    🚨 <strong>SECURITY ALERT:</strong><br>
    If you did <strong>NOT</strong> change your password, your account may be compromised.
  </p>
  <p style="font-family:sans-serif;color:#c62828;font-size:14px;margin:8px 0 0 0">
    <strong>Contact us immediately:</strong> 
    <a href="mailto:info@shaamelz.com" style="color:#f44336;font-weight:bold">info@shaamelz.com</a>
  </p>
</div>

<hr style="border:none;border-top:1px solid #e0e0e0;margin:30px 0">

<p style="font-family:sans-serif;color:#999;font-size:13px">
  Password changed: {{ .CreatedAt }}<br>
  Location: {{ .Location }}<br>
  Device: {{ .UserAgent }}
</p>

<p style="font-family:sans-serif;color:#999;font-size:13px">
  <strong>IGNITE_APEX</strong><br>
  Sales Methodology & CRM Platform<br>
  <a href="https://shaamelz.com" style="color:#F59E0B">shaamelz.com</a>
</p>
```

---

## Implementation Steps

### 1. Update Reset Password Template in Supabase
- Go to Auth → Email Templates
- Edit "Reset Password" template
- Paste HTML above
- Save

### 2. Create Edge Function for Password Change Notification

This requires a Supabase Edge Function that listens to auth password change events.

**File:** `supabase/functions/password-changed-notification/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { user_id, email } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('name')
      .eq('id', user_id)
      .single()

    // Send security notification email
    // Use your email service (SendGrid, Resend, etc.)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

### 3. Alternative: Use Database Trigger

Create a database trigger that sends an email when password is updated:

```sql
-- Create function to send password change notification
CREATE OR REPLACE FUNCTION notify_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the password change
  INSERT INTO password_change_log (user_id, changed_at)
  VALUES (NEW.id, NOW());

  -- In production, trigger email via Edge Function
  -- PERFORM http_post(
  --   'https://your-project.supabase.co/functions/v1/password-changed-notification',
  --   json_build_object('user_id', NEW.id, 'email', NEW.email)
  -- );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users
CREATE TRIGGER on_password_change
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW
  WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
  EXECUTE FUNCTION notify_password_change();
```

---

## Simpler Approach (For MVP)

For now, just update the "Reset Password" email template with the security notice.

The user will see the security warning when they request a password reset:
- ⚠️ "If you didn't request this, contact info@shaamelz.com"

This covers the main security requirement without needing complex Edge Functions.

---

## Testing

1. Go to CRM → Click user dropdown → "Reset Password"
2. Check email inbox
3. Verify email contains:
   - ✅ "Reset Your Password" button
   - ✅ Security warning: "If you didn't request this, contact info@shaamelz.com"
   - ✅ Expiration notice (1 hour)
4. Click reset link
5. Set new password
6. Login with new password

---

**Status:** Template ready to paste into Supabase dashboard
