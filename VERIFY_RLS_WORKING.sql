-- Verify RLS policy is actually working

-- Step 1: Check policy exists and is correct
SELECT
  policyname,
  cmd,
  roles,
  permissive,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Test if authenticated role can read users table at all
-- This simulates what happens when Nirmal is logged in
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "397c4079-6415-4957-bc2f-6d761538bd79", "role": "authenticated"}';

-- Try to select Nirmal's record
SELECT
  id,
  email,
  name,
  role,
  org_id,
  crm_enabled,
  account_type
FROM users
WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';

ROLLBACK;

-- Step 3: Check if there are any RESTRICTIVE policies that override PERMISSIVE ones
SELECT
  policyname,
  permissive,
  CASE
    WHEN permissive = 'PERMISSIVE' THEN '✅ Allows access'
    WHEN permissive = 'RESTRICTIVE' THEN '⚠️ Blocks access (overrides permissive policies)'
  END as policy_type
FROM pg_policies
WHERE tablename = 'users'
ORDER BY permissive, policyname;

-- Step 4: List ALL policies that could affect SELECT
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN '✅ Affects SELECT queries'
    WHEN cmd = 'ALL' THEN '✅ Affects SELECT queries'
    ELSE '○ Does not affect SELECT'
  END as affects_select
FROM pg_policies
WHERE tablename = 'users'
  AND (cmd = 'SELECT' OR cmd = 'ALL');
