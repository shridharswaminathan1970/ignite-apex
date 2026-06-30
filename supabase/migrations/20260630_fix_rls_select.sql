-- FIX: RLS SELECT circular dependency
-- Problem: SELECT policies check role from users table, but need SELECT to read role
-- Solution: Allow SELECT for authenticated users, enforce authorization in Edge Functions

-- Drop all SELECT policies
DROP POLICY IF EXISTS "super_duper_admin_select_all" ON users;
DROP POLICY IF EXISTS "super_admin_select_org" ON users;
DROP POLICY IF EXISTS "admin_select_downline" ON users;
DROP POLICY IF EXISTS "admin_m_select_org" ON users;
DROP POLICY IF EXISTS "regular_user_select_self" ON users;

-- Simple permissive SELECT policy
CREATE POLICY "authenticated_can_select"
ON users FOR SELECT
TO authenticated
USING (true);

-- Keep strict UPDATE/DELETE policies (they work because they don't need to query users to check caller role during USING evaluation)
-- The Edge Functions handle authorization checks before calling UPDATE/DELETE

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
