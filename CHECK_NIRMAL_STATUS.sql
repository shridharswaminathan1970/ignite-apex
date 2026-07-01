-- Check current status of nirmal.pandey008@yahoo.com

-- Step 1: Check auth.users (should exist)
SELECT
  id as auth_id,
  email,
  'EXISTS IN AUTH' as status
FROM auth.users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 2: Check public.users (should exist with same ID)
SELECT
  id as users_id,
  email,
  role,
  org_id,
  team_id,
  status,
  'EXISTS IN USERS TABLE' as table_status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 3: Check if IDs match
SELECT
  (SELECT id FROM auth.users WHERE email = 'nirmal.pandey008@yahoo.com') as auth_id,
  (SELECT id FROM users WHERE email = 'nirmal.pandey008@yahoo.com') as users_id,
  CASE
    WHEN (SELECT id FROM auth.users WHERE email = 'nirmal.pandey008@yahoo.com') =
         (SELECT id FROM users WHERE email = 'nirmal.pandey008@yahoo.com')
    THEN '✅ IDs MATCH'
    WHEN (SELECT id FROM users WHERE email = 'nirmal.pandey008@yahoo.com') IS NULL
    THEN '❌ USER NOT IN USERS TABLE'
    ELSE '❌ ID MISMATCH'
  END as id_check;

-- Step 4: Count how many rows
SELECT
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ NO USER FOUND (trigger failed to create user)'
    WHEN COUNT(*) = 1 THEN '✅ EXACTLY ONE USER'
    ELSE '❌ DUPLICATE USERS (bad!)'
  END as status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 5: If user exists, show all details
SELECT * FROM users WHERE email = 'nirmal.pandey008@yahoo.com';
