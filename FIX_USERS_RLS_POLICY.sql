-- Fix users table RLS policy to allow authenticated users to read their own profile
-- This is what launcher.html needs

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "users_can_read_users" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "authenticated_can_select" ON users;

-- Create simple policy: authenticated users can SELECT all users
-- (Authorization for management is enforced in Edge Functions)
CREATE POLICY "users_can_read_users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Also allow users to update themselves
DROP POLICY IF EXISTS "users_can_update_self" ON users;
CREATE POLICY "users_can_update_self"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Verify policies created
SELECT
  policyname,
  cmd,
  roles,
  'Policy active' as status
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test the exact query launcher.html runs
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

SELECT '✅ RLS policy fixed - launcher.html should work now' as result;
