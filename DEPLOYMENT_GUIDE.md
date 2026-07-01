# IGNITE_APEX Deployment Guide

**Version:** 1.0  
**Date:** 2026-07-01  
**Status:** Production Ready (65-70% feature complete)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Required Accounts & Access

- [ ] Supabase project created (Project ID: `gokslnrvxqledagcwghq`)
- [ ] GitHub repository access (`shridharswaminathan1970/ignite-apex`)
- [ ] Netlify account connected to GitHub repo
- [ ] Anthropic API key (for AI coaching)
- [ ] Resend API key (for email sending)
- [ ] Custom domain configured: `shaamelz.com`

### Required Tools

- [ ] Supabase CLI v2.105.0+ (`supabase --version`)
- [ ] Git (`git --version`)
- [ ] Node.js 18+ (`node --version`)
- [ ] PostgreSQL client (optional, for local testing)

### Environment Variables

Create `.env` file (never commit to Git):

```bash
# Supabase
SUPABASE_URL=https://gokslnrvxqledagcwghq.supabase.co
SUPABASE_ANON_KEY=<from_supabase_dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from_supabase_dashboard>

# Anthropic (AI Coaching)
ANTHROPIC_API_KEY=<your_api_key>

# Resend (Email)
RESEND_API_KEY=<your_api_key>
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/shridharswaminathan1970/ignite-apex.git
cd ignite-apex
```

### 2. Link Supabase Project

```bash
supabase login
supabase link --project-ref gokslnrvxqledagcwghq
```

### 3. Verify Connection

```bash
supabase status
# Should show: Linked to project gokslnrvxqledagcwghq
```

---

## Database Setup

### 1. Run Migrations (In Order)

**Check existing migrations:**
```bash
ls -la supabase/migrations/
```

**Apply all migrations:**
```bash
supabase db push
```

**Verify migrations applied:**
```sql
-- In Supabase SQL Editor
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;
```

### 2. Enable RLS on All Tables

**Run in Supabase SQL Editor:**

```bash
# Copy contents of AUTO_RESTORE_RLS.sql
# Paste into SQL Editor
# Execute
```

**Expected output:**
```
✅ RLS RESTORE COMPLETE
```

**Verify:**
```sql
-- Should show all 26 tables with rls_enabled = true
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 3. Set Up Database Monitoring

**Run migration:**
```bash
# Copy contents of supabase/migrations/20260701_rls_monitoring.sql
# Paste into SQL Editor
# Replace YOUR_SERVICE_ROLE_KEY with actual key
# Execute
```

**Verify cron job created:**
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'rls-monitor-hourly';
```

### 4. Set Up Trial Monitoring Cron Jobs

**Run FIX_CRON_JOBS.sql:**
```bash
# Copy contents of FIX_CRON_JOBS.sql
# Replace YOUR_SERVICE_ROLE_KEY with actual key
# Paste into SQL Editor
# Execute
```

**Verify cron jobs:**
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobid;

-- Should see:
-- crm-trial-monitor (daily 2 AM)
-- b2b0-trial-monitor (daily 3 AM)
-- rls-monitor-hourly (every hour)
```

---

## Edge Functions Deployment

### 1. Set Secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=<your_key>
supabase secrets set RESEND_API_KEY=<your_key>
```

**Verify:**
```bash
supabase secrets list
# Should show ANTHROPIC_API_KEY and RESEND_API_KEY
```

### 2. Deploy All Functions

```bash
# AI Coaching
supabase functions deploy ai-coaching --project-ref gokslnrvxqledagcwghq --no-verify-jwt

# Trial Monitors
supabase functions deploy crm-trial-monitor --project-ref gokslnrvxqledagcwghq --no-verify-jwt
supabase functions deploy b2b0-trial-monitor --project-ref gokslnrvxqledagcwghq --no-verify-jwt

# RLS Monitor
supabase functions deploy monitor-rls --project-ref gokslnrvxqledagcwghq --no-verify-jwt

# User Management
supabase functions deploy manage-user --project-ref gokslnrvxqledagcwghq --no-verify-jwt

# Invite Generation
supabase functions deploy generate-invite-link --project-ref gokslnrvxqledagcwghq --no-verify-jwt
```

### 3. Test Functions

**Test AI Coaching (requires authentication):**
```bash
curl -X POST \
  https://gokslnrvxqledagcwghq.supabase.co/functions/v1/ai-coaching \
  -H "Authorization: Bearer <user_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"opportunityId": "test", "stageId": "ignite_gate", "gateField": "demand_4u_unworkable"}'
```

**Test RLS Monitor:**
```bash
curl -X POST \
  https://gokslnrvxqledagcwghq.supabase.co/functions/v1/monitor-rls \
  -H "Authorization: Bearer <service_role_key>"
```

---

## Frontend Deployment

### 1. Netlify Deployment (Automatic)

**Connected via GitHub:**
- Repository: `shridharswaminathan1970/ignite-apex`
- Branch: `master`
- Build command: (none - static site)
- Publish directory: `/`
- Domain: `shaamelz.com`

**Every push to master triggers auto-deploy:**
```bash
git push origin master
# Netlify builds and deploys automatically
# Check: https://app.netlify.com/sites/<your-site>/deploys
```

### 2. Custom Domain Setup

**In Netlify Dashboard:**
1. Site Settings → Domain Management
2. Add custom domain: `shaamelz.com`
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: <netlify_ip>

   Type: CNAME
   Name: www
   Value: <your-site>.netlify.app
   ```
4. Enable HTTPS (automatic via Let's Encrypt)

### 3. Environment Variables (Netlify)

**Not needed** - Frontend uses `supabase-client.js` which reads from Supabase public config.

---

## Post-Deployment Verification

### Critical Path Tests (Run in Order)

#### Test 1: Anonymous Access (Should Fail)

```bash
# Try to access users table without auth
curl https://gokslnrvxqledagcwghq.supabase.co/rest/v1/users \
  -H "apikey: <anon_key>"

# Expected: [] (empty array - RLS blocks)
```

#### Test 2: User Registration

1. Go to: https://shaamelz.com/app/register.html
2. Fill form with test data
3. Submit
4. Expected: "Request Submitted!" message

#### Test 3: Admin Approval

1. Login as muhammad.shaamel@gmail.com
2. Go to: https://shaamelz.com/app/master-console.html
3. Click "Pending Registrations"
4. Find test user
5. Click "Approve"
6. Expected: Success message + email sent to shaamel@shaamelz.com

#### Test 4: New User Login

1. Check email at shaamel@shaamelz.com
2. Click password reset link
3. Set password
4. Login with new credentials
5. Expected: Reaches launcher.html without errors

#### Test 5: CRM Access

1. From launcher, click "Launch CRM"
2. Expected: Redirects to crm/index.html
3. Verify dashboard loads
4. Create new opportunity
5. Expected: Opportunity saves and appears in list

#### Test 6: AI Coaching

1. Open opportunity
2. Go to "Qualification Roadmap" tab
3. Fill in a gate answer
4. Click "Get AI Coaching"
5. Expected: Blue panel appears with draft, flags, next action

#### Test 7: Trial Countdown

1. Verify trial banner at top of launcher
2. Expected: Shows "X days remaining" with correct count
3. Verify color (green >30d, amber 10-30d, red ≤9d)

---

## Rollback Procedures

### Database Rollback

**If migration breaks:**
```bash
# Rollback last migration
supabase db reset --db-url "<connection_string>"

# Or restore from backup
# Supabase Dashboard → Database → Backups
# Select backup → Restore
```

### Edge Function Rollback

**If function deploy breaks:**
```bash
# Redeploy previous version from Git
git checkout <previous_commit_hash>
supabase functions deploy <function_name> --project-ref gokslnrvxqledagcwghq
git checkout master
```

### Frontend Rollback

**Netlify auto-rollback:**
1. Netlify Dashboard → Deploys
2. Find previous working deploy
3. Click "Publish deploy"
4. Site reverts to that version

---

## Production Checklist

Before going live:

- [ ] All migrations applied successfully
- [ ] All 26 tables have RLS enabled (verified via SQL)
- [ ] All Edge Functions deployed and tested
- [ ] Secrets set in Supabase (ANTHROPIC_API_KEY, RESEND_API_KEY)
- [ ] Cron jobs created and running
- [ ] Email sending tested (registration approval emails)
- [ ] AI coaching tested (returns draft suggestions)
- [ ] Trial countdown displays correctly
- [ ] Cross-org access blocked (RLS enforced)
- [ ] Custom domain configured and HTTPS enabled
- [ ] Backup strategy confirmed (Supabase auto-backups enabled)
- [ ] Monitoring set up (RLS monitor, trial monitors)
- [ ] Emergency contacts documented
- [ ] SUPABASE_SAFETY_GUIDE.md reviewed by all admins

---

## Emergency Contacts

**Supabase Issues:**
- Support: https://supabase.com/dashboard/support
- Status: https://status.supabase.com/

**Platform Owner:**
- Email: shaamel@shaamelz.com
- Backup: muhammad.shaamel@gmail.com

**Critical Files:**
- Emergency RLS Restore: `AUTO_RESTORE_RLS.sql`
- RLS Verification: `VERIFY_RLS_TRUTH.sql`
- Safety Guide: `SUPABASE_SAFETY_GUIDE.md`
- Cron Fix: `FIX_CRON_JOBS.sql`

---

**Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** 2026-07-01
