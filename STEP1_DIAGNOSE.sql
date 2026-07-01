-- STEP 1: COMPREHENSIVE DIAGNOSIS
-- Run this and paste ALL results back

-- ═══════════════════════════════════════════════════════════════════
-- Query 1: Is RLS actually enabled?
-- ═══════════════════════════════════════════════════════════════════

SELECT
  'Query 1: RLS Status' as query_label,
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity = true THEN 'ENABLED'
    ELSE 'DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('users', 'organisations', 'opportunities')
ORDER BY tablename;


-- ═══════════════════════════════════════════════════════════════════
-- Query 2: How many policies exist per table?
-- ═══════════════════════════════════════════════════════════════════

SELECT
  'Query 2: Policy Count' as query_label,
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ NO POLICIES (RLS blocks everything!)'
    ELSE '✅ Has policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('users', 'organisations', 'opportunities')
GROUP BY tablename
ORDER BY tablename;


-- ═══════════════════════════════════════════════════════════════════
-- Query 3: What policies exist on users table specifically?
-- ═══════════════════════════════════════════════════════════════════

SELECT
  'Query 3: Users Table Policies' as query_label,
  policyname,
  cmd as command,
  permissive,
  roles::text as applies_to_roles,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd, policyname;


-- ═══════════════════════════════════════════════════════════════════
-- Query 4: Can authenticated role SELECT from users table?
-- ═══════════════════════════════════════════════════════════════════

-- Note: This test bypasses RLS (runs as superuser)
-- But shows if the data is readable at all
SELECT
  'Query 4: Data Readability Test' as query_label,
  COUNT(*) as total_users,
  COUNT(CASE WHEN org_id IS NULL THEN 1 END) as users_without_org,
  COUNT(CASE WHEN role = 'public' THEN 1 END) as users_with_public_role,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Data exists'
    ELSE '❌ No users in table'
  END as status
FROM users;


-- ═══════════════════════════════════════════════════════════════════
-- Query 5: Test Nirmal's record specifically
-- ═══════════════════════════════════════════════════════════════════

SELECT
  'Query 5: Nirmal Record Check' as query_label,
  id,
  email,
  name,
  role,
  org_id,
  team_id,
  status,
  crm_enabled,
  CASE
    WHEN org_id IS NULL THEN '❌ Missing org_id'
    WHEN team_id IS NULL THEN '⚠️ Missing team_id'
    WHEN role = 'public' THEN '⚠️ Role is public'
    ELSE '✅ Record is valid'
  END as record_status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';


-- ═══════════════════════════════════════════════════════════════════
-- Query 6: Check for orphaned auth users
-- ═══════════════════════════════════════════════════════════════════

SELECT
  'Query 6: Orphaned Auth Users' as query_label,
  au.email,
  au.id as auth_id,
  'User exists in auth.users but NOT in users table' as problem
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
LIMIT 10;


-- ═══════════════════════════════════════════════════════════════════
-- DIAGNOSIS SUMMARY
-- ═══════════════════════════════════════════════════════════════════

SELECT
  '═══ DIAGNOSIS SUMMARY ═══' as summary_label,
  (SELECT CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END FROM pg_tables WHERE tablename = 'users' LIMIT 1) as rls_status,
  (SELECT COUNT(*)::text || ' policies' FROM pg_policies WHERE tablename = 'users') as policy_count,
  (SELECT COUNT(*)::text || ' users' FROM users) as total_users,
  (SELECT COUNT(*)::text FROM auth.users au LEFT JOIN users u ON au.id = u.id WHERE u.id IS NULL) || ' orphaned' as orphaned_users;
