-- Check RLS policies on users table

-- Step 1: Is RLS enabled?
SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'users';

-- Step 2: What policies exist?
SELECT
  policyname,
  cmd as command,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Step 3: Count policies
SELECT
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES (RLS blocks everything!)'
    WHEN COUNT(*) >= 1 THEN '✅ Has ' || COUNT(*) || ' policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';
