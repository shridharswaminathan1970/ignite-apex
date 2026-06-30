# IGNITE_APEX - Quick Start Guide

**Production URL:** https://shaamelz.com  
**Date:** 2026-06-25  
**Status:** 95% Complete - Ready for UAT

---

## 🚀 Get Started in 30 Minutes

### ✅ Step 1: Run Database Migration (5 min)

```sql
-- Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql
-- Copy and run the entire contents of:
-- C:\Projects\ignite-apex\supabase\migrations\20260625_add_jtbd_and_fixes.sql
```

---

### ✅ Step 2: Get Resend API Key (5 min)

1. Go to https://resend.com/signup
2. Create account (free: 3,000 emails/month)
3. Dashboard → API Keys → Create
4. Copy key (starts with `re_`)
5. Save for next step

---

### ✅ Step 3: Deploy Edge Functions (10 min)

```bash
# Open terminal in: C:\Projects\ignite-apex

# Set secrets (replace YOUR_KEY with actual values)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-W3fLgUFq...
supabase secrets set RESEND_API_KEY=re_YOUR_RESEND_KEY
supabase secrets set PADDLE_WEBHOOK_SECRET=temp_placeholder

# Deploy functions
supabase functions deploy ai-coaching
supabase functions deploy send-trial-reminders
supabase functions deploy paddle-webhook
```

**Expected output:**
```
✔ Deployed ai-coaching
✔ Deployed send-trial-reminders
✔ Deployed paddle-webhook
```

---

### ✅ Step 4: Set Up Cron Job (2 min)

1. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/database/cron-jobs
2. Click "Create a new cron job"
3. Settings:
   - **Name:** Trial Reminders
   - **Schedule:** `*/20 * * * *` (every 20 minutes)
   - **Function:** `send-trial-reminders`
4. Click "Create"

---

### ✅ Step 5: Test AI Coaching (3 min)

1. Go to https://shaamelz.com/crm/index.html
2. Log in
3. Open any opportunity
4. Click "Qualification" tab
5. Scroll to any gate
6. Click "Get AI Coaching" button
7. **Expected:** AI draft appears in modal

**If it fails:** Check Supabase Functions logs for errors

---

### ✅ Step 6: Test Email Reminders (5 min)

**Option A: Manual Trigger**

```bash
# Replace YOUR_ANON_KEY with your Supabase anon key
curl -X POST https://gokslnrvxqledagcwghq.supabase.co/functions/v1/send-trial-reminders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Option B: Check Cron Logs**

1. Wait 20 minutes for cron to run
2. Go to: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/logs
3. Filter: Functions → `send-trial-reminders`
4. **Expected:** Log entries showing "Sent email to org..."

---

## 🎉 DONE! Now What?

### Option A: Start UAT Testing Now

Use existing test scripts:
- `UAT_Sheet1_Authentication.csv` (14 tests)
- `UAT_Sheet5_Qualification_Roadmap.csv` (35 tests)
- `UAT_Sheet7_Subscription_Trial.csv` (24 tests)

**Total:** 73 test cases ready to run

I'll create the remaining 150 test cases once you're ready for full UAT.

---

### Option B: Set Up Paddle (For Payment Integration)

Follow the comprehensive guide:
- `PADDLE_INTEGRATION_GUIDE.md`

**Steps:**
1. Sign up at https://vendors.paddle.com
2. Create 12 products
3. Get credentials
4. Update code
5. Deploy

**Time:** 1-2 hours + 1-2 days verification wait

---

### Option C: Deploy B2B Outreach

Follow the deployment checklist:
- `B2B_DEPLOYMENT_CHECKLIST.md`

**Steps:**
1. Choose hosting (Render.com recommended)
2. Set up Redis (Upstash free tier)
3. Deploy backend + worker
4. Deploy frontend to b2b.shaamelz.com
5. Test integration

**Time:** 4-6 hours  
**Cost:** ~$15/month

---

## 📂 File Reference

| File | Purpose |
|------|---------|
| `FINAL_STATUS_PRE_UAT.md` | Complete status & what's done |
| `PADDLE_INTEGRATION_GUIDE.md` | How to set up Paddle payments |
| `B2B_DEPLOYMENT_CHECKLIST.md` | How to deploy B2B Outreach |
| `B2B_OUTREACH_INTEGRATION_PLAN.md` | Architecture & integration points |
| `DEPLOYMENT_STATUS_FINAL.md` | Overall deployment status |
| `README_COMPLETE.md` | Master README |
| `UAT_MASTER_TEST_PLAN.md` | Testing overview |
| `UAT_Sheet1_Authentication.csv` | 14 auth test cases |
| `UAT_Sheet5_Qualification_Roadmap.csv` | 35 roadmap test cases |
| `UAT_Sheet7_Subscription_Trial.csv` | 24 subscription test cases |

---

## 🧪 Quick Test Checklist

Test these features right now:

- [ ] Login works (https://shaamelz.com/app/auth.html)
- [ ] Sales OS loads (https://shaamelz.com/system/index.html)
- [ ] CRM dashboard loads (https://shaamelz.com/crm/index.html)
- [ ] Can create new opportunity
- [ ] Qualification roadmap shows 8 stages
- [ ] IGNITE gates (4U + JTBD + diagnostics) visible
- [ ] APEX gates (Qualification → Closed Won) work
- [ ] AI Coaching button works
- [ ] Trial banner shows (if applicable)
- [ ] Pricing page loads (https://shaamelz.com/pricing.html)
- [ ] Checkout page loads (https://shaamelz.com/checkout.html)
- [ ] B2B gate page works (https://shaamelz.com/outreach/)
- [ ] Admin dashboard accessible (https://shaamelz.com/app/company-dashboard.html)
- [ ] Invoice generator works (https://shaamelz.com/crm/admin/invoices.html)

---

## 🐛 Troubleshooting

### Edge Functions not working?

**Check 1: Secrets set?**
```bash
supabase secrets list
```
Should show: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `PADDLE_WEBHOOK_SECRET`

**Check 2: Functions deployed?**
```bash
supabase functions list
```
Should show: `ai-coaching`, `send-trial-reminders`, `paddle-webhook`

**Check 3: View logs**
```bash
supabase functions logs ai-coaching
```

---

### Database migration failed?

**Error: "column already exists"**
- Safe to ignore - means columns were already added

**Error: "syntax error"**
- Make sure you copied the entire file
- Run in Supabase SQL Editor, not in psql terminal

---

### Email reminders not sending?

**Check 1: Resend API key valid?**
- Go to https://resend.com/api-keys
- Verify key is active

**Check 2: Cron job running?**
- Go to Supabase → Database → Cron Jobs
- Check "Last Run" timestamp
- Should run every 20 minutes

**Check 3: Test orgs exist?**
- Query: `SELECT * FROM org_subscriptions WHERE status = 'trial'`
- Need orgs with trial_ends_at within next 30 days

---

### AI Coaching returns errors?

**Check 1: Anthropic API key valid?**
- Test: https://console.anthropic.com/settings/keys

**Check 2: Opportunity data exists?**
- Ensure opportunity has name, account, contact

**Check 3: Function logs**
```bash
supabase functions logs ai-coaching --tail
```

---

## 📞 Get Help

**Questions?**
- muhammad.shaamel@gmail.com
- muhammad.shaamel@shaamelz.com

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- Paddle Docs: https://developer.paddle.com
- Resend Docs: https://resend.com/docs

---

## ✅ You're Ready!

After completing Steps 1-6 above (30 minutes total):

🎯 **Your platform is 95% complete**  
🧪 **Ready for UAT testing**  
🚀 **Only missing: Paddle integration (needs account signup)**

**Next:** Run UAT test scripts OR set up Paddle OR deploy B2B Outreach

**All three can be done in parallel if needed!**

---

**Good luck! 🎉**
