# 🤖 Complete Email Automation Setup

Follow these steps exactly to enable automated credential emails.

---

## ✅ Step 1: Get Resend API Key (3 minutes)

### 1a. Sign up for Resend
1. Go to: https://resend.com/signup
2. Create account with your email
3. Verify your email
4. Log in

### 1b. Get API Key
1. Dashboard → **"API Keys"** (left sidebar)
2. Click **"Create API Key"**
3. Name: `IGNITE_APEX_CRM`
4. Click **"Add"**
5. **COPY THE KEY** (starts with `re_...`)

**Save it! You'll need it in Step 3.**

---

## ✅ Step 2: Get Supabase Access Token (2 minutes)

### 2a. Generate Token
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Name: `CRM_CLI_Access`
4. Click **"Generate token"**
5. **COPY THE TOKEN** (starts with `sbp_...`)

**Save it! You'll need it in Step 3.**

---

## ✅ Step 3: Deploy Email Function (5 minutes)

### 3a. Open Terminal/Command Prompt
Press `Win + R`, type `cmd`, press Enter

### 3b. Navigate to Project
```bash
cd C:\Projects\ignite-apex
```

### 3c. Set Environment Variables
Replace `YOUR_SUPABASE_TOKEN` and `YOUR_RESEND_KEY` with actual values:

**Windows CMD:**
```cmd
set SUPABASE_ACCESS_TOKEN=YOUR_SUPABASE_TOKEN
set RESEND_API_KEY=YOUR_RESEND_KEY
```

**Windows PowerShell:**
```powershell
$env:SUPABASE_ACCESS_TOKEN="YOUR_SUPABASE_TOKEN"
$env:RESEND_API_KEY="YOUR_RESEND_KEY"
```

**Git Bash:**
```bash
export SUPABASE_ACCESS_TOKEN="YOUR_SUPABASE_TOKEN"
export RESEND_API_KEY="YOUR_RESEND_KEY"
```

### 3d. Link to Supabase Project
```bash
supabase link --project-ref gokslnrvxqledagcwghq
```

Should show: `✔ Linked to project: gokslnrvxqledagcwghq`

### 3e. Set Resend API Key as Secret
```bash
supabase secrets set RESEND_API_KEY=%RESEND_API_KEY%
```

**PowerShell users use:**
```powershell
supabase secrets set RESEND_API_KEY=$env:RESEND_API_KEY
```

**Git Bash users use:**
```bash
supabase secrets set RESEND_API_KEY=$RESEND_API_KEY
```

Should show: `✔ Finished supabase secrets set`

### 3f. Deploy the Email Function
```bash
supabase functions deploy send-credentials-email
```

Should show:
```
✔ Deployed Function send-credentials-email on project gokslnrvxqledagcwghq
Function URL: https://gokslnrvxqledagcwghq.supabase.co/functions/v1/send-credentials-email
```

---

## ✅ Step 4: Test It! (2 minutes)

### 4a. Register a Test User
1. Go to: https://shaamelz.com/app/auth.html#signup
2. Fill in:
   - Name: Test User
   - Email: **your-real-email@gmail.com** (use real email!)
   - Org: Test Company
3. Click **"Create Account"**

### 4b. Check Your Email
Within 30 seconds, you should receive:
- Email subject: "Your IGNITE_APEX CRM Login Credentials"
- Contains: User ID + Password Key
- Branded with IGNITE_APEX design

### 4c. Sign In
1. Go to: https://shaamelz.com/app/auth.html
2. Enter credentials from email
3. Click **"Sign In"**
4. Should redirect to CRM dashboard!

---

## 🔧 Troubleshooting

### "supabase: command not found"
```bash
npm install -g supabase
```

### "Project not linked"
```bash
supabase link --project-ref gokslnrvxqledagcwghq
```

### "Email not received"
**Check:**
1. Spam folder
2. Resend dashboard → Emails → see if it sent
3. Supabase logs:
   ```bash
   supabase functions logs send-credentials-email
   ```

### "Function deploy failed"
**Check:**
1. RESEND_API_KEY is set correctly
2. Token has correct permissions
3. Run with debug:
   ```bash
   supabase functions deploy send-credentials-email --debug
   ```

### Email goes to spam
**Solution: Verify your domain in Resend**
1. Resend dashboard → **Domains**
2. Add domain: `shaamelz.com`
3. Add DNS records shown
4. Wait 10 minutes
5. Click **"Verify"**

After verification, emails send from `noreply@shaamelz.com` instead of `onboarding@resend.dev` (better deliverability)

---

## 🎯 Success Checklist

- [ ] Resend account created
- [ ] Resend API key obtained (starts with `re_`)
- [ ] Supabase access token obtained (starts with `sbp_`)
- [ ] Supabase CLI installed (`supabase --version` works)
- [ ] Project linked (`supabase link` succeeded)
- [ ] Secret set (`supabase secrets set` succeeded)
- [ ] Function deployed (shows Function URL)
- [ ] Test email received in inbox
- [ ] Can sign in with emailed credentials

---

## 📧 What Happens After Setup

**When new user registers:**
1. ✅ Form submitted (name, email, org)
2. ✅ System generates secure 12-char Password Key
3. ✅ Supabase creates user account
4. ✅ **Email automatically sent** with credentials
5. ✅ User receives email within seconds
6. ✅ User signs in with emailed credentials

**Completely automated - no manual intervention needed!**

---

## 🚨 For Existing User (shaame@shaamelz.com)

Since the email function wasn't deployed when they registered:

**Option 1: Reset Password**
1. Go to: https://shaamelz.com/app/auth.html
2. Click "Forgot password?"
3. Enter: shaame@shaamelz.com
4. Check email for reset link
5. Set new password

**Option 2: Manual Password Reset via Supabase**
1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/auth/users
2. Find user: shaame@shaamelz.com
3. Click **"Send password reset email"**
4. User receives email with reset link

---

## 💰 Resend Free Tier Limits

- ✅ **100 emails/day**
- ✅ **3,000 emails/month**
- ✅ Perfect for: ~100 registrations/day

If you exceed limits, upgrade to paid plan ($20/month for 50k emails)

---

## 📝 Next Steps After Setup

1. ✅ **Test registration flow** - make sure emails arrive
2. ✅ **Verify domain** (optional but recommended for better deliverability)
3. ✅ **Invite your team** - they'll receive credentials automatically
4. ✅ **Monitor Resend dashboard** - see all sent emails

---

## Need Help?

If you get stuck:
1. Check Supabase function logs: `supabase functions logs send-credentials-email`
2. Check Resend dashboard: https://resend.com/emails
3. Verify API keys are correct
4. Try deploying again: `supabase functions deploy send-credentials-email`

---

**Ready? Start with Step 1!**
