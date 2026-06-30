-- User Management RLS Policies
-- Enforces role hierarchy: super_duper_admin > super_admin > admin > admin_m/sdr/account_executive

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Super admins can view org users" ON users;
DROP POLICY IF EXISTS "Admins can view team users" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SELECT POLICIES (who can VIEW users)
-- ============================================

-- 1. super_duper_admin: View ALL users across ALL orgs
CREATE POLICY "super_duper_admin_select_all"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'super_duper_admin'
  )
);

-- 2. super_admin: View ALL users in THEIR org
CREATE POLICY "super_admin_select_org"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'super_admin'
    AND caller.org_id = users.org_id
  )
);

-- 3. admin: View users in THEIR downline (manager_id chain) + themselves
CREATE POLICY "admin_select_downline"
ON users FOR SELECT
TO authenticated
USING (
  users.id = auth.uid() -- Can see self
  OR
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'admin'
    AND caller.org_id = users.org_id
    AND (
      users.manager_id = caller.id -- Direct reports
      OR users.id IN ( -- Indirect reports (recursive via manager chain)
        WITH RECURSIVE downline AS (
          SELECT id FROM users WHERE manager_id = caller.id
          UNION
          SELECT u.id FROM users u
          INNER JOIN downline d ON u.manager_id = d.id
        )
        SELECT id FROM downline
      )
    )
  )
);

-- 4. admin_m: View ALL users in THEIR org (read-only)
CREATE POLICY "admin_m_select_org"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'admin_m'
    AND caller.org_id = users.org_id
  )
);

-- 5. sdr/account_executive: View ONLY themselves
CREATE POLICY "regular_user_select_self"
ON users FOR SELECT
TO authenticated
USING (
  users.id = auth.uid()
  AND users.role IN ('sdr', 'account_executive')
);

-- ============================================
-- INSERT POLICIES (who can CREATE users)
-- ============================================

-- Only super_duper_admin, super_admin, and admin can create users
-- Enforced by Edge Function, not RLS (RLS blocks all inserts from client)
CREATE POLICY "block_direct_user_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (false); -- All inserts must go through Edge Functions

-- ============================================
-- UPDATE POLICIES (who can MODIFY users)
-- ============================================

-- 1. super_duper_admin: Update ANY user
CREATE POLICY "super_duper_admin_update_all"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_duper_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_duper_admin'
  )
);

-- 2. super_admin: Update users in THEIR org (including admin_m, but not other super_admins)
CREATE POLICY "super_admin_update_org"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'super_admin'
    AND caller.org_id = users.org_id
    AND users.role != 'super_duper_admin' -- Cannot modify platform master
    AND users.role != 'super_admin' -- Cannot modify peer super_admins
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'super_admin'
    AND caller.org_id = users.org_id
    AND users.role NOT IN ('super_duper_admin', 'super_admin')
  )
);

-- 3. admin: Update users in THEIR downline ONLY (excluding admin_m, admin, super_admin)
CREATE POLICY "admin_update_downline"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'admin'
    AND caller.org_id = users.org_id
    AND users.role NOT IN ('super_duper_admin', 'super_admin', 'admin', 'admin_m') -- Protected roles
    AND (
      users.manager_id = caller.id
      OR users.id IN (
        WITH RECURSIVE downline AS (
          SELECT id FROM users WHERE manager_id = caller.id
          UNION
          SELECT u.id FROM users u
          INNER JOIN downline d ON u.manager_id = d.id
        )
        SELECT id FROM downline
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'admin'
    AND caller.org_id = users.org_id
    AND users.role NOT IN ('super_duper_admin', 'super_admin', 'admin', 'admin_m')
  )
);

-- 4. admin_m: NO updates (read-only)
-- No policy needed - defaults to deny

-- 5. Regular users: Update ONLY their own non-sensitive fields
CREATE POLICY "user_update_self_limited"
ON users FOR UPDATE
TO authenticated
USING (users.id = auth.uid())
WITH CHECK (
  users.id = auth.uid()
  AND users.role = (SELECT role FROM users WHERE id = auth.uid()) -- Cannot change own role
  AND users.org_id = (SELECT org_id FROM users WHERE id = auth.uid()) -- Cannot change org
  AND users.manager_id = (SELECT manager_id FROM users WHERE id = auth.uid()) -- Cannot change manager
);

-- ============================================
-- DELETE POLICIES (who can DELETE users)
-- ============================================

-- Only super_duper_admin and super_admin can delete
-- admin cannot delete (can only suspend/deactivate)

CREATE POLICY "super_duper_admin_delete_all"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'super_duper_admin'
  )
);

CREATE POLICY "super_admin_delete_org"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users caller
    WHERE caller.id = auth.uid()
    AND caller.role = 'super_admin'
    AND caller.org_id = users.org_id
    AND users.role NOT IN ('super_duper_admin', 'super_admin') -- Cannot delete peers or superiors
  )
);

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT DELETE ON users TO authenticated;
-- INSERT blocked by policy (must use Edge Functions)

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
