-- RLS Monitoring Helper Functions
-- These support the monitor-rls Edge Function

-- Function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(tablename name, rowsecurity boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tablename::name, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;

-- Function to enable RLS on a specific table
CREATE OR REPLACE FUNCTION enable_rls_on_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
END;
$$;

-- Grant execute to service role (used by Edge Function)
GRANT EXECUTE ON FUNCTION check_rls_status() TO service_role;
GRANT EXECUTE ON FUNCTION enable_rls_on_table(text) TO service_role;

-- Create a scheduled job to run RLS monitoring every hour
-- (Requires pg_cron extension and pg_net extension - both already enabled)
SELECT cron.schedule(
  'rls-monitor-hourly',
  '0 * * * *', -- Every hour at :00
  $$
    SELECT extensions.http_post(
      url := 'https://gokslnrvxqledagcwghq.supabase.co/functions/v1/monitor-rls',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
