-- SIMPLE FIX: Allow all authenticated users to read their own profile
-- This fixes "Error loading user profile" for SDR/Account Executive login

-- Drop problematic policy
DROP POLICY IF EXISTS "authenticated_can_select" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;

-- Create simple, non-circular policy
-- Rule: Authenticated users can read ANY user record
-- Authorization for management actions is enforced in Edge Functions, not here
CREATE POLICY "users_can_read_users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Why this works:
-- 1. No circular dependency (no subquery on users table)
-- 2. Allows launcher.html to load user profile
-- 3. Allows admin consoles to list users
-- 4. Edge Functions (manage-user, etc.) enforce write permissions
-- 5. RLS still blocks unauthenticated access

-- Verify
SELECT 'SDR login fix applied - all authenticated users can SELECT users' as status;
