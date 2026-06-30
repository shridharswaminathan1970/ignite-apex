# 🚀 DEPLOYMENT INSTRUCTIONS - IGNITE-APEX

**Date:** 2026-06-26  
**Tasks Completed:** B → C → A → D  
**Status:** Ready for deployment

---

## ⚙️ **PREREQUISITE: LINK SUPABASE PROJECT**

If you see "Cannot find project ref" errors:

```bash
cd C:\Projects\ignite-apex

# Link to your Supabase project
supabase link --project-ref gokslnrvxqledagcwghq

# This will prompt for your database password
# Use the password for the Supabase project
```

---

## 📦 **STEP 1: DEPLOY DATABASE MIGRATIONS**

```bash
cd C:\Projects\ignite-apex

# Check migration status
supabase migration list

# Deploy new migrations
supabase db push

# If you see "Remote migration versions not found", sync first:
supabase db pull
# Then manually apply new migrations or recreate them
```

**New Migrations to Deploy:**
- `20260626002000_add_trial_reminders_tracking.sql` - Trial reminders JSONB column

---

## 🔧 **STEP 2: CONFIGURE SECRETS**

### **A. Resend API Key**

1. **Get Resend API Key:**
   - Go to https://resend.com
   - Sign up / Log in
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_...`)

2. **Store in Supabase:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
   ```

   **Alternative (via Dashboard):**
   - Go to Supabase Dashboard
   - Project Settings → Edge Functions → Secrets
   - Add: `RESEND_API_KEY` = `re_xxxxxxxxxx`

### **B. Paddle Webhook Secret (if available)**

```bash
supabase secrets set PADDLE_WEBHOOK_SECRET=your_webhook_secret_from_paddle
```

---

## 📤 **STEP 3: DEPLOY EDGE FUNCTIONS**

```bash
cd C:\Projects\ignite-apex\supabase\functions

# Deploy send-email function
supabase functions deploy send-email

# Deploy trial-reminder-cron function
supabase functions deploy trial-reminder-cron

# Deploy paddle-webhook (if not already deployed)
supabase functions deploy paddle-webhook

# Verify deployments
supabase functions list
```

**Expected Output:**
```
┌──────────────────────────┬──────────┬─────────────────────┐
│ NAME                     │ STATUS   │ UPDATED             │
├──────────────────────────┼──────────┼─────────────────────┤
│ send-email               │ deployed │ 2026-06-26 10:00:00 │
│ trial-reminder-cron      │ deployed │ 2026-06-26 10:01:00 │
│ paddle-webhook           │ deployed │ 2026-06-26 10:02:00 │
└──────────────────────────┴──────────┴─────────────────────┘
```

---

## 📧 **STEP 4: CONFIGURE RESEND DOMAIN**

1. **Login to Resend:**
   - https://resend.com

2. **Add Domain:**
   - Dashboard → Domains → Add Domain
   - Enter: `shaamelz.com`

3. **Add DNS Records:**
   
   **DNS Provider (e.g., Cloudflare, Namecheap, GoDaddy):**
   
   ```
   Record Type: TXT
   Name: @
   Value: [Copy from Resend - verification code]
   TTL: Auto
   
   Record Type: MX
   Name: @
   Value: mx1.resend.com
   Priority: 10
   TTL: Auto
   
   Record Type: MX
   Name: @
   Value: mx2.resend.com
   Priority: 20
   TTL: Auto
   ```

4. **Verify Domain:**
   - Click "Verify" in Resend dashboard
   - May take 5-30 minutes for DNS propagation
   - Status should show "Verified" with green checkmark

---

## ⏰ **STEP 5: SCHEDULE CRON JOB**

### **Option A: Via Supabase SQL Editor**

```sql
-- Install pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily trial reminder check at 9:00 AM UTC
SELECT cron.schedule(
  'trial-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/trial-reminder-cron',
    headers := '{"Authorization": "Bearer <YOUR_ANON_KEY>"}'::jsonb
  ) AS request_id;
  $$
);

-- Verify cron job created
SELECT * FROM cron.job;
```

**Replace `<YOUR_ANON_KEY>`** with your Supabase Anon Key from:
- Supabase Dashboard → Project Settings → API → `anon` `public` key

### **Option B: Via External Cron (GitHub Actions, Vercel Cron, etc.)**

Create scheduled job to call:
```
POST https://gokslnrvxqledagcwghq.supabase.co/functions/v1/trial-reminder-cron
Header: Authorization: Bearer <ANON_KEY>
```

---

## 💳 **STEP 6: CONFIGURE PADDLE WEBHOOK**

1. **Login to Paddle Dashboard:**
   - https://vendors.paddle.com (or new dashboard)

2. **Add Webhook Endpoint:**
   - Developer Tools → Notifications (or Webhooks)
   - Click "Add Endpoint"
   - URL: `https://shaamelz.com/supabase/functions/v1/paddle-webhook`
   - OR: `https://gokslnrvxqledagcwghq.supabase.co/functions/v1/paddle-webhook`

3. **Subscribe to Events:**
   - ✅ `transaction.completed`
   - ✅ `transaction.updated`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.past_due`

4. **Copy Webhook Secret:**
   - After creating endpoint, copy the "Webhook Secret"
   - Store in Supabase secrets (see Step 2B)

5. **Test Webhook:**
   - Paddle Dashboard → Developer Tools → Events
   - Send test event
   - Check Supabase Functions logs

---

## 🧪 **STEP 7: TEST DEPLOYMENTS**

### **Test 1: Send Email Function**

```bash
curl -X POST https://gokslnrvxqledagcwghq.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email from IGNITE-APEX",
    "html": "<h1>Test Successful!</h1><p>Email service is working.</p>"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "messageId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Check:** Your inbox should receive the email within seconds.

### **Test 2: Trial Reminder Cron**

```bash
curl -X POST https://gokslnrvxqledagcwghq.supabase.co/functions/v1/trial-reminder-cron \
  -H "Authorization: Bearer <YOUR_ANON_KEY>"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2026-06-26T10:00:00.000Z",
  "results": {
    "day90_popup": 0,
    "day120_email": 0,
    "day130_email": 0,
    "day140_email": 0
  }
}
```

### **Test 3: B2B0 Module in Launcher**

1. Login to IGNITE-APEX
2. Navigate to launcher (`/app/launcher.html`)
3. Should see 3 module cards:
   - Sales OS (unlocked)
   - CRM (locked/unlocked based on entitlement)
   - **B2B0 Outreach Agent** (locked with purple badge)

---

## 📊 **STEP 8: VERIFY DATABASE SCHEMA**

```sql
-- Check trial_reminders_sent column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'org_subscriptions' 
  AND column_name = 'trial_reminders_sent';

-- Expected result:
-- column_name: trial_reminders_sent
-- data_type: jsonb

-- Check B2B0 columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'org_subscriptions' 
  AND column_name LIKE 'b2b0%';

-- Expected results:
-- b2b0_enabled (boolean)
-- b2b0_plan (text)
-- b2b0_seats (integer)
-- b2b0_trial_started_at (timestamptz)
-- b2b0_trial_ends_at (timestamptz)
```

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Supabase project linked (`supabase link`)
- [ ] Database migrations deployed (`supabase db push`)
- [ ] Resend API key generated
- [ ] Resend API key stored in Supabase secrets
- [ ] `send-email` Edge Function deployed
- [ ] `trial-reminder-cron` Edge Function deployed
- [ ] `paddle-webhook` Edge Function deployed (if exists)
- [ ] Resend domain verified (DNS records added)
- [ ] Test email sent successfully
- [ ] Cron job scheduled (daily at 9:00 AM UTC)
- [ ] Paddle webhook endpoint configured
- [ ] Paddle webhook secret stored
- [ ] B2B0 module visible in launcher
- [ ] All database columns verified

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Functions won't deploy**

```bash
# Check if logged in
supabase status

# Re-login if needed
supabase login

# Link project
supabase link --project-ref gokslnrvxqledagcwghq
```

### **Issue: Email not sending**

1. Check Resend API key is correct
2. Check domain is verified in Resend
3. Check Supabase Function logs:
   - Dashboard → Edge Functions → send-email → Logs
4. Check for errors in response

### **Issue: Cron job not running**

1. Check if `pg_cron` extension is enabled
2. Verify cron job exists: `SELECT * FROM cron.job;`
3. Check cron job logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
4. Verify URL and auth token are correct

### **Issue: B2B0 module not showing**

1. Clear browser cache
2. Check `app/launcher.html` was deployed (check file on server)
3. Check browser console for JavaScript errors
4. Verify subscription query includes B2B0 fields

---

## 🎯 **POST-DEPLOYMENT VERIFICATION**

Run all tests in the **IGNITE_APEX_TEST_SUITE.xlsx** workbook (see next file).

---

**Status:** Ready for deployment. Follow steps in order.
