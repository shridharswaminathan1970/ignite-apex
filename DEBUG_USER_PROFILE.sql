-- Debug nirmal.pandey008@yahoo.com login issue
-- Run this in Supabase SQL Editor

-- Step 1: Check if user exists in auth.users
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 2: Check if user exists in public.users table
SELECT
  id,
  email,
  name,
  role,
  org_id,
  team_id,
  manager_id,
  status,
  crm_enabled,
  crm_trial_activated_at
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 3: Check if IDs match between auth.users and public.users
SELECT
  au.id as auth_id,
  au.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  CASE
    WHEN au.id = u.id THEN '✅ IDs MATCH'
    ELSE '❌ IDs MISMATCH'
  END as id_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'nirmal.pandey008@yahoo.com';

-- Step 4: Check user's organization details
SELECT
  u.email,
  u.role,
  u.org_id,
  o.name as org_name,
  u.team_id,
  t.name as team_name
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email = 'nirmal.pandey008@yahoo.com';

-- Step 5: Check RLS policy allows reading this user
-- (Just check if SELECT works)
SELECT
  COUNT(*) as can_read_count,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ RLS allows reading this user'
    ELSE '❌ RLS blocking access'
  END as rls_status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- Step 6: Check if user has any NULL critical fields
SELECT
  email,
  CASE WHEN id IS NULL THEN '❌ NULL' ELSE '✅' END as has_id,
  CASE WHEN email IS NULL THEN '❌ NULL' ELSE '✅' END as has_email,
  CASE WHEN role IS NULL THEN '❌ NULL' ELSE '✅' END as has_role,
  CASE WHEN org_id IS NULL THEN '❌ NULL' ELSE '✅' END as has_org_id,
  CASE WHEN status IS NULL THEN '❌ NULL' ELSE '✅' END as has_status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';
