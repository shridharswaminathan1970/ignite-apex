-- VERIFY RLS TRUTH: Ignore Dashboard UI, check actual database state
-- Run this in Supabase SQL Editor to see REAL RLS status

-- ===================================================================
-- SOURCE OF TRUTH: Query pg_tables directly
-- ===================================================================

SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ ENABLED (protected)'
    ELSE '❌ DISABLED (DANGER!)'
  END as actual_rls_status,
  rowsecurity as raw_boolean
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===================================================================
-- COUNT: How many are really enabled vs disabled?
-- ===================================================================

SELECT
  COUNT(*) FILTER (WHERE rowsecurity = true) as truly_enabled,
  COUNT(*) FILTER (WHERE rowsecurity = false) as truly_disabled,
  COUNT(*) as total_tables,
  CASE
    WHEN COUNT(*) FILTER (WHERE rowsecurity = false) = 0
    THEN '✅ ALL TABLES ARE PROTECTED'
    ELSE '❌ ' || COUNT(*) FILTER (WHERE rowsecurity = false) || ' TABLES EXPOSED!'
  END as verdict
FROM pg_tables
WHERE schemaname = 'public';

-- ===================================================================
-- POLICY CHECK: Do tables have policies?
-- ===================================================================

SELECT
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  CASE
    WHEN t.rowsecurity = false THEN '❌ RLS OFF - NO PROTECTION'
    WHEN COUNT(p.policyname) = 0 THEN '⚠️ RLS ON but NO POLICIES (blocks everything)'
    ELSE '✅ Protected with ' || COUNT(p.policyname) || ' policies'
  END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
