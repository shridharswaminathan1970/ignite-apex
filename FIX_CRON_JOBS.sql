-- ===================================================================
-- FIX CRON JOBS: Install pg_net + Update cron jobs
-- ===================================================================

-- Step 1: Install pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Step 2: Delete broken cron jobs
SELECT cron.unschedule(1);
SELECT cron.unschedule(2);

-- Step 3: Create new cron jobs with correct function reference
-- NOTE: Replace YOUR_SERVICE_ROLE_KEY with actual key from Supabase Dashboard → Settings → API
SELECT cron.schedule(
  'crm-trial-monitor',
  '0 2 * * *',
  $$
    SELECT extensions.http_post(
      url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/crm-trial-monitor',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

SELECT cron.schedule(
  'b2b0-trial-monitor',
  '0 3 * * *',
  $$
    SELECT extensions.http_post(
      url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/b2b0-trial-monitor',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Step 4: Verify jobs created
SELECT jobid, schedule, active FROM cron.job ORDER BY jobid;

-- Step 5: Test CRM monitor manually
SELECT extensions.http_post(
  url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/crm-trial-monitor',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{}'::jsonb
) AS crm_test;

-- Step 6: Test B2B0 monitor manually
SELECT extensions.http_post(
  url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/b2b0-trial-monitor',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{}'::jsonb
) AS b2b0_test;

-- Final status
SELECT '✅ Cron jobs fixed!' as status;
