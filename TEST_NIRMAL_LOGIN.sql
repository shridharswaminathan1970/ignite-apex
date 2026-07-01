-- Test if Nirmal's profile can be loaded via RLS
-- This simulates what launcher.html does

-- Step 1: Verify user exists and has correct data
SELECT
  id,
  email,
  name,
  role,
  org_id,
  team_id,
  crm_enabled,
  account_type,
  status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 2: Check current RLS policy on users table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 3: Test the exact query launcher.html runs
-- (As authenticated user with this ID)
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

-- Step 4: Check if org_id exists in organisations table
SELECT
  o.id,
  o.name,
  o.slug,
  'Org exists' as status
FROM organisations o
WHERE o.id = (SELECT org_id FROM users WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79');

-- Step 5: Check if team_id exists in teams table
SELECT
  t.id,
  t.name,
  t.org_id,
  'Team exists' as status
FROM teams t
WHERE t.id = (SELECT team_id FROM users WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79');
