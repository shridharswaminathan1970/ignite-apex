-- Fix RLS policies to allow signup
-- Run this in Supabase SQL Editor

-- Allow anyone to INSERT new organizations during signup
DROP POLICY IF EXISTS "Allow insert during signup" ON organisations;
CREATE POLICY "Allow insert during signup"
ON organisations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to read their own organization
DROP POLICY IF EXISTS "Users can view their own org" ON organisations;
CREATE POLICY "Users can view their own org"
ON organisations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  )
);

-- Allow users to INSERT their own user profile during signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to create org_subscriptions during signup
DROP POLICY IF EXISTS "Allow subscription creation during signup" ON org_subscriptions;
CREATE POLICY "Allow subscription creation during signup"
ON org_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  )
);

-- Allow users to view their org subscription
DROP POLICY IF EXISTS "Users can view their org subscription" ON org_subscriptions;
CREATE POLICY "Users can view their org subscription"
ON org_subscriptions
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  )
);
