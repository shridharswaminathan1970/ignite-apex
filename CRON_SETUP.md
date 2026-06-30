# Cron Job Setup for Trial Monitors

## Overview

Two Edge Functions need to run daily to monitor trial lifecycles:
1. **crm-trial-monitor** - Monitors 99-day CRM trials
2. **b2b0-trial-monitor** - Monitors 7-day B2B0 trials

---

## Setup in Supabase

### Option 1: Using Supabase Cron (Recommended)

**Go to:** https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/database/cron-jobs

**Create Job 1: CRM Trial Monitor**
```sql
-- Run daily at 2 AM UTC
SELECT cron.schedule(
  'crm-trial-monitor',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/crm-trial-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Create Job 2: B2B0 Trial Monitor**
```sql
-- Run daily at 3 AM UTC
SELECT cron.schedule(
  'b2b0-trial-monitor',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/b2b0-trial-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Verify Cron Jobs:**
```sql
SELECT * FROM cron.job;
```

**View Cron Logs:**
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

### Option 2: External Cron Service

If Supabase cron extension not enabled, use external service:

**Services:**
- GitHub Actions (free)
- Vercel Cron
- cron-job.org
- EasyCron

**Example: GitHub Actions** (.github/workflows/trial-monitors.yml)

```yaml
name: Trial Monitors

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  crm-monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Call CRM Monitor
        run: |
          curl -X POST \
            https://gokslnrvxqledagcwghq.supabase.co/functions/v1/crm-trial-monitor \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"

  b2b0-monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Call B2B0 Monitor
        run: |
          curl -X POST \
            https://gokslnrvxqledagcwghq.supabase.co/functions/v1/b2b0-trial-monitor \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

---

## Manual Testing

**Test CRM Monitor:**
```bash
curl -X POST \
  https://gokslnrvxqledagcwghq.supabase.co/functions/v1/crm-trial-monitor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Test B2B0 Monitor:**
```bash
curl -X POST \
  https://gokslnrvxqledagcwghq.supabase.co/functions/v1/b2b0-trial-monitor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Service Role Key Location:**
Supabase Dashboard → Project Settings → API → service_role key (secret)

---

## What the Monitors Do

### CRM Trial Monitor (99 days)

**Day 90:** Insert popup notification (9 days remaining warning)
```sql
INSERT INTO notifications (user_id, type, message, created_at)
VALUES (user_id, 'trial_warning', 'Your CRM trial expires in 9 days', NOW());
```

**Day 110:** Send email reminder (11 days past 99-day trial, in grace period)
- Email via Resend API
- Subject: "CRM Trial Expired - Upgrade to Continue"

**Day 145:** Final warning email (5 days until hard deactivation)
- Email via Resend API
- Subject: "Final Warning: CRM Access Ends in 5 Days"

**Day 150:** Hard deactivation
```sql
UPDATE users SET crm_enabled = false WHERE trial_day >= 150;
```

### B2B0 Trial Monitor (7 days)

**Day 9:** Hard block (7-day trial + 2-day grace)
```sql
UPDATE users SET b2b0_enabled = false WHERE trial_day >= 9;
```

---

## Monitoring & Alerts

**Check Edge Function Logs:**
https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/logs/edge-functions

**Monitor Trial Status:**
```sql
-- Users approaching trial end
SELECT id, email, name, 
       DATE_PART('day', NOW() - crm_trial_activated_at) as days_in_trial,
       99 - DATE_PART('day', NOW() - crm_trial_activated_at) as days_remaining
FROM users
WHERE crm_trial_activated_at IS NOT NULL
  AND crm_enabled = true
  AND DATE_PART('day', NOW() - crm_trial_activated_at) > 80
ORDER BY days_in_trial DESC;
```

---

## Troubleshooting

**Cron not running?**
1. Check pg_cron extension enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Enable if missing: `CREATE EXTENSION pg_cron;`
3. Verify job schedule: `SELECT * FROM cron.job;`

**Edge Function errors?**
1. Check logs in Supabase Dashboard
2. Verify RESEND_API_KEY secret exists
3. Test manually with curl commands above

**Emails not sending?**
1. Verify Resend API key valid
2. Check domain verification status
3. Review Edge Function logs for errors

---

## Status

- [ ] Supabase cron extension enabled
- [ ] CRM trial monitor cron job created
- [ ] B2B0 trial monitor cron job created
- [ ] Manual test of CRM monitor successful
- [ ] Manual test of B2B0 monitor successful
- [ ] Email notifications working
- [ ] Monitoring dashboard set up

**Last Updated:** 2026-07-01
