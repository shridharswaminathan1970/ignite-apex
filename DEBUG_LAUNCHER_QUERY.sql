-- Test the exact query launcher.html is running
-- Run this as authenticated user to see if RLS blocks it

-- Simulate what launcher.html does
-- Replace with Nirmal's actual auth.users ID

-- Step 1: Check auth.users ID matches users.id
SELECT
  au.id as auth_id,
  au.email as auth_email,
  u.id as users_id,
  u.email as users_email,
  CASE
    WHEN au.id = u.id THEN '✅ IDs MATCH'
    WHEN u.id IS NULL THEN '❌ NO USER RECORD'
    ELSE '❌ ID MISMATCH'
  END as id_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'nirmal.pandey008@yahoo.com';

-- Step 2: Test the exact SELECT launcher.html runs
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

-- Step 3: Test with .single() behavior (must return exactly 1 row)
SELECT
  COUNT(*) as row_count,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ NO ROWS (RLS blocking or user deleted)'
    WHEN COUNT(*) = 1 THEN '✅ EXACTLY 1 ROW (correct for .single())'
    ELSE '❌ MULTIPLE ROWS (will fail .single())'
  END as single_check
FROM users
WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';

-- Step 4: Check if anonymous role can see anything (should be 0)
SET ROLE anon;
SELECT COUNT(*) as anon_can_see FROM users WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';
RESET ROLE;

-- Step 5: Final status
SELECT
  '✅ If Steps 2 and 3 show data, then browser cache is the issue. Have Nirmal hard refresh (Ctrl+Shift+R)' as recommendation;
