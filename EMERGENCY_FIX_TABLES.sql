-- EMERGENCY: Re-enable all tables and fix RLS
-- Issue: All tables disabled in Supabase

-- First, check what "disabled" means - are tables dropped or RLS blocking?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Enable RLS on core tables (if disabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- CRITICAL: Ensure basic SELECT policies exist
-- Users table
DROP POLICY IF EXISTS "users_can_read_users" ON users;
CREATE POLICY "users_can_read_users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow users to update themselves
DROP POLICY IF EXISTS "users_can_update_self" ON users;
CREATE POLICY "users_can_update_self"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Organisations table
DROP POLICY IF EXISTS "org_read_policy" ON organisations;
CREATE POLICY "org_read_policy"
ON organisations FOR SELECT
TO authenticated
USING (true);

-- Teams table
DROP POLICY IF EXISTS "teams_read_policy" ON teams;
CREATE POLICY "teams_read_policy"
ON teams FOR SELECT
TO authenticated
USING (true);

-- Opportunities table
DROP POLICY IF EXISTS "opportunities_read_policy" ON opportunities;
CREATE POLICY "opportunities_read_policy"
ON opportunities FOR SELECT
TO authenticated
USING (
  -- User can see opportunities in their org
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.org_id = opportunities.org_id
  )
);

DROP POLICY IF EXISTS "opportunities_write_policy" ON opportunities;
CREATE POLICY "opportunities_write_policy"
ON opportunities FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.org_id = opportunities.org_id
  )
);

-- Accounts table
DROP POLICY IF EXISTS "accounts_policy" ON accounts;
CREATE POLICY "accounts_policy"
ON accounts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.org_id = accounts.org_id
  )
);

-- Contacts table
DROP POLICY IF EXISTS "contacts_policy" ON contacts;
CREATE POLICY "contacts_policy"
ON contacts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.org_id = contacts.org_id
  )
);

-- Activities table
DROP POLICY IF EXISTS "activities_policy" ON opportunity_activities;
CREATE POLICY "activities_policy"
ON opportunity_activities FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN users u ON u.org_id = o.org_id
    WHERE o.id = opportunity_activities.opportunity_id
    AND u.id = auth.uid()
  )
);

-- Tasks table
DROP POLICY IF EXISTS "tasks_policy" ON tasks;
CREATE POLICY "tasks_policy"
ON tasks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND (u.org_id = tasks.org_id OR tasks.assigned_to = u.id)
  )
);

-- Registration requests (public read for admins)
DROP POLICY IF EXISTS "registration_requests_policy" ON registration_requests;
CREATE POLICY "registration_requests_policy"
ON registration_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_duper_admin', 'super_admin')
  )
);

-- Verify policies created
SELECT 'Emergency RLS fix applied - tables should be accessible now' as status;

-- Test basic query that launcher needs
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as org_count FROM organisations;
SELECT COUNT(*) as opp_count FROM opportunities;
