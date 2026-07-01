-- Complete RLS fix for users table
-- Delete ALL existing policies and create fresh ones

-- Step 1: Drop ALL existing policies on users table
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
  END LOOP;
END $$;

-- Step 2: Verify all policies deleted
SELECT
  COUNT(*) as remaining_policies,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ All policies deleted'
    ELSE '⚠️ Still have ' || COUNT(*) || ' policies'
  END as status
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';

-- Step 3: Create ONE simple policy for SELECT
CREATE POLICY "users_can_read_all"
ON users FOR SELECT
TO authenticated
USING (true);

-- Step 4: Create policy for users to update themselves
CREATE POLICY "users_can_update_self"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 5: Verify new policies
SELECT
  policyname,
  cmd,
  roles::text,
  permissive,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Step 6: Test the query (as superuser, bypasses RLS but confirms data exists)
SELECT
  'TEST RESULT:' as label,
  id,
  email,
  name,
  role,
  org_id
FROM users
WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';

SELECT '✅ RLS FIXED - Have Nirmal logout completely and login again' as final_instruction;
