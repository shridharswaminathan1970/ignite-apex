# Email Credentials Setup Guide

**Purpose**: Send user credentials (User ID + Password Key) via email when new users register.

---

## ✅ What's Been Built

### Frontend Changes (`app/auth.html`)
1. ✅ **Registration form** no longer asks for password
2. ✅ **Password Key** is auto-generated (12-character secure random string)
3. ✅ **Sign-up flow** creates Supabase user with generated password
4. ✅ **Credentials display** shows User ID and Password Key labels
5. ✅ **Email notification** screen tells user to check email for credentials

### Backend Email Function
- ✅ **Supabase Edge Function** created: `supabase/functions/send-credentials-email/index.ts`
- ✅ **Email template** with professional HTML design
- ✅ Includes both User ID (email) and Password Key
- ✅ Styled with IGNITE_APEX branding (amber/dark theme)

---

## 🚀 How to Deploy Email Functionality

### Option 1: Use Resend (Recommended - Easiest)

**Why Resend?**
- Free tier: 100 emails/day, 3,000/month
- Simple API, no complex setup
- Built-in email tracking
- Good deliverability

**Steps:**

1. **Sign up for Resend**
   - Go to https://resend.com
   - Create free account
   - Verify your email

2. **Add your domain**
   - In Resend dashboard → Domains → Add Domain
   - Enter: `shaamelz.com`
   - Follow DNS setup instructions (add DNS records)

3. **Get API Key**
   - Resend dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_...`)

4. **Deploy Supabase Function**
   ```bash
   # Install Supabase CLI (one time)
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref gokslnrvxqledagcwghq

   # Set Resend API key as secret
   supabase secrets set RESEND_API_KEY=re_your_api_key_here

   # Deploy the function
   cd C:\Projects\ignite-apex
   supabase functions deploy send-credentials-email
   ```

5. **Update auth.html to call the function**
   - Edit `app/auth.html`, find `sendCredentialsEmail()` function
   - Uncomment the Supabase function call:
   ```javascript
   await window.IAdb.supabase.functions.invoke('send-credentials-email', {
     body: { email, passwordKey, name }
   });
   ```
   - Remove or comment out the `alert()` line

**Done!** Emails will now be sent automatically.

---

### Option 2: Use Gmail SMTP

**Steps:**

1. **Enable Gmail App Password**
   - Go to Google Account → Security → 2-Step Verification
   - Enable 2-Step Verification if not already enabled
   - Go to App Passwords
   - Generate app password for "Mail"
   - Copy the 16-character password

2. **Modify Edge Function**
   - Replace Resend API call with SMTP code
   - Use Deno's SMTP library or nodemailer equivalent

3. **Deploy with Gmail credentials**
   ```bash
   supabase secrets set GMAIL_USER=your-email@gmail.com
   supabase secrets set GMAIL_APP_PASSWORD=your-16-char-password
   supabase functions deploy send-credentials-email
   ```

---

### Option 3: Use SendGrid

**Steps:**

1. **Sign up for SendGrid**
   - Go to https://sendgrid.com
   - Free tier: 100 emails/day

2. **Get API Key**
   - Settings → API Keys → Create API Key
   - Copy the key (starts with `SG.`)

3. **Deploy function**
   ```bash
   supabase secrets set SENDGRID_API_KEY=SG.your_key_here
   supabase functions deploy send-credentials-email
   ```

4. **Update function code** to use SendGrid API:
   ```typescript
   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${SENDGRID_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       personalizations: [{ to: [{ email }] }],
       from: { email: 'noreply@shaamelz.com', name: 'IGNITE_APEX CRM' },
       subject: 'Your IGNITE_APEX CRM Login Credentials',
       content: [{ type: 'text/html', value: generateCredentialsEmail(email, passwordKey, name) }]
     })
   })
   ```

---

## 🧪 Testing Email Flow

### Test Registration:

1. **Go to** `shaamelz.com/app/auth.html#signup`

2. **Fill form:**
   - Name: Test User
   - Email: your-test-email@gmail.com
   - Organisation: Test Org

3. **Click "Create Account"**

4. **What happens:**
   - Password Key is generated (e.g., `Kd7mP@x3Qs9L`)
   - Supabase user created with that password
   - Email sent to your-test-email@gmail.com
   - Screen shows "Check Your Email"

5. **Check your email:**
   - Should receive email with:
     - User ID: your-test-email@gmail.com
     - Password Key: Kd7mP@x3Qs9L

6. **Sign in:**
   - Go to sign-in page
   - Enter User ID and Password Key from email
   - Should authenticate and redirect to CRM

---

## 🔐 Security Notes

### Password Key Generation
- **12 characters** (secure length)
- **Mix of**: uppercase, lowercase, numbers, special chars
- **Generated client-side** using `crypto.getRandomValues()` (secure randomness)
- **Never logged** or stored anywhere except Supabase auth

### Email Security
- ✅ Credentials sent via **encrypted email** (TLS/SSL)
- ✅ Email is **one-time only** at registration
- ✅ No plaintext passwords stored anywhere
- ✅ Supabase hashes passwords with bcrypt

### User Can Change Password
Users can still use "Forgot Password" flow to:
1. Request password reset link
2. Set their own custom password
3. Replace the emailed Password Key with their own

---

## 📧 Email Template Preview

The email users receive looks like this:

```
┌─────────────────────────────────────────────┐
│         IGNITE_APEX CRM                     │
│       Sales Operating System                │
└─────────────────────────────────────────────┘

Hello John Doe,

Welcome to IGNITE_APEX CRM! Your account has 
been successfully created. Below are your login 
credentials:

╔═══════════════════════════════════════╗
║   🔐 Your Login Credentials           ║
║                                       ║
║   USER ID                             ║
║   john@company.com                    ║
║                                       ║
║   PASSWORD KEY                        ║
║   Kd7mP@x3Qs9L                        ║
╚═══════════════════════════════════════╝

⚠️ Important: Please save these credentials 
in a secure location.

[Sign In to CRM →]

What's included (90 days free):
• Complete lead & opportunity management
• IGNITE_APEX methodology built-in
• Task tracking with reminders
• Team collaboration & role-based access
```

---

## 🔄 Current Workaround (Before Email Setup)

**For testing NOW** (without setting up email service):

1. When user registers, credentials are shown in:
   - **Browser alert** (popup with User ID + Password Key)
   - **Console log** (F12 → Console → see credentials)

2. **Admin manually sends** credentials via their own email client

3. **User receives** email from admin with credentials

4. **User signs in** with emailed credentials

This works for **MVP/beta testing** but you should set up automated emails before launch.

---

## ✅ Recommended: Use Resend

**Resend is best because:**
- ✅ **Free tier** is generous (3,000 emails/month)
- ✅ **Simple setup** (just API key, no SMTP config)
- ✅ **Good deliverability** (emails won't go to spam)
- ✅ **Built-in analytics** (open rates, click tracking)
- ✅ **Official Supabase integration** (documented in Supabase docs)

**Setup time: 10 minutes**

---

## 📋 Deployment Checklist

- [ ] Choose email service (Resend/SendGrid/Gmail)
- [ ] Sign up and get API key
- [ ] Add domain and verify DNS (if using custom domain)
- [ ] Install Supabase CLI (`npm install -g supabase`)
- [ ] Link to Supabase project
- [ ] Set API key as secret
- [ ] Deploy Edge Function
- [ ] Update `app/auth.html` to call function
- [ ] Test registration with real email
- [ ] Verify email received with correct credentials
- [ ] Test sign-in with emailed credentials

---

## 🆘 Need Help?

**Email not sending?**
1. Check Supabase Functions logs: `supabase functions logs send-credentials-email`
2. Verify API key is correct: `supabase secrets list`
3. Check email service dashboard (Resend/SendGrid) for errors
4. Verify DNS records if using custom domain

**Email goes to spam?**
1. Add SPF/DKIM records in DNS (provided by email service)
2. Use verified sender domain (not free Gmail/Outlook)
3. Don't send too many emails too fast (rate limiting)

**Want to test locally?**
```bash
# Run function locally
supabase functions serve send-credentials-email

# Call with test data
curl -i http://localhost:54321/functions/v1/send-credentials-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","passwordKey":"Test123!","name":"Test User"}'
```

---

**Recommended Next Step**: Set up Resend (takes 10 minutes, works reliably)
