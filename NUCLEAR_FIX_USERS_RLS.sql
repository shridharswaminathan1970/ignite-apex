-- NUCLEAR OPTION: Complete reset of users table RLS
-- This fixes everything from the "tables disabled" incident

-- ===================================================================
-- STEP 1: Check current state
-- ===================================================================

SELECT
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- ===================================================================
-- STEP 2: DISABLE RLS (to clear any broken state)
-- ===================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ===================================================================
-- STEP 3: Drop ALL policies
-- ===================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- Verify all policies gone
SELECT
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All policies deleted'
    ELSE '❌ Still have policies!'
  END as status
FROM pg_policies
WHERE tablename = 'users';

-- ===================================================================
-- STEP 4: RE-ENABLE RLS (fresh start)
-- ===================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify RLS is ON
SELECT
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS RE-ENABLED'
    ELSE '❌ STILL DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- ===================================================================
-- STEP 5: Create ONLY the essential policies (nothing fancy)
-- ===================================================================

-- Policy 1: Authenticated users can SELECT all users (needed for launcher, dropdowns, etc.)
CREATE POLICY "users_select_all"
ON users FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Authenticated users can UPDATE only their own record
CREATE POLICY "users_update_self"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 3: Authenticated users can INSERT (for registration flows)
CREATE POLICY "users_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- ===================================================================
-- STEP 6: Verify policies created correctly
-- ===================================================================

SELECT
  policyname,
  cmd,
  permissive,
  roles::text,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Should show exactly 3 policies

-- ===================================================================
-- STEP 7: Test that the data is readable
-- ===================================================================

-- Test Nirmal's record can be read
SELECT
  id,
  email,
  name,
  role,
  org_id,
  crm_enabled,
  account_type,
  '✅ DATA READABLE' as test_result
FROM users
WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';

-- ===================================================================
-- STEP 8: Test anonymous access is blocked
-- ===================================================================

-- This should return 0 (anon cannot see users)
SET ROLE anon;
SELECT COUNT(*) as anon_can_see_count FROM users;
RESET ROLE;

-- If above = 0, anon is correctly blocked ✅

-- ===================================================================
-- FINAL STATUS
-- ===================================================================

SELECT
  'RLS: ' || CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END ||
  ' | Policies: ' || (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'users') ||
  ' | User record: ' || CASE WHEN EXISTS(SELECT 1 FROM users WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79') THEN 'EXISTS ✅' ELSE 'MISSING ❌' END as final_status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

SELECT '✅✅✅ NUCLEAR FIX COMPLETE - Nirmal must logout, close browser, reopen, login fresh' as instruction;
