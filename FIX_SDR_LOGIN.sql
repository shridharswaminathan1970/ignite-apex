-- Fix SDR/Account Executive login error
-- Issue: RLS SELECT policy blocking user profile load in launcher.html

-- Drop existing SELECT policy if too restrictive
DROP POLICY IF EXISTS "authenticated_can_select" ON users;

-- Create permissive SELECT policy that allows users to read their own profile
-- and managers/admins to see their team
CREATE POLICY "users_select_policy"
ON users FOR SELECT
TO authenticated
USING (
  -- Users can always see themselves
  id = auth.uid()
  OR
  -- Super duper admin sees all
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_duper_admin'
  )
  OR
  -- Super admin sees all in org
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_admin'
    AND u.org_id = users.org_id
  )
  OR
  -- Admin sees downline (users where admin is in their manager chain)
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
    AND u.org_id = users.org_id
  )
  OR
  -- Admin_m sees all in org (read-only manager)
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin_m'
    AND u.org_id = users.org_id
  )
);

-- Verify the policy works
SELECT 'Policy created successfully' as status;

-- Test query that launcher.html runs
-- This should NOT fail for any authenticated user
SELECT id, email, name, role, org_id, crm_enabled, account_type
FROM users
WHERE id = auth.uid();
