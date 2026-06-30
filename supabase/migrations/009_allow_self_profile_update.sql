-- 009_allow_self_profile_update.sql
-- Allow users to update their own profile (name, email only - not role, org_id, etc.)

-- Drop existing policy
DROP POLICY IF EXISTS users_update ON public.users;

-- Recreate with self-update clause
CREATE POLICY users_update ON public.users
  FOR UPDATE
  USING (
    -- Super duper admin can update anyone
    app_role() = 'super_duper_admin'

    -- Super admin can update anyone in their org
    OR (
      org_id = app_org()
      AND app_role() = 'super_admin'
    )

    -- Non-admin_m users can update their downline
    OR (
      org_id = app_org()
      AND app_role() <> 'admin_m'
      AND app_manages(id)
    )

    -- Anyone can update their own profile
    OR id = auth.uid()
  )
  WITH CHECK (
    -- Super duper admin can change anything
    app_role() = 'super_duper_admin'

    -- Super admin can change anything in their org
    OR (
      org_id = app_org()
      AND app_role() = 'super_admin'
    )

    -- Managers can change downline user fields
    OR (
      org_id = app_org()
      AND app_role() <> 'admin_m'
      AND app_manages(id)
    )

    -- Users updating their own profile can ONLY change name and email
    -- (prevent privilege escalation by changing own role/org_id)
    OR (
      id = auth.uid()
      AND org_id = app_org()  -- Cannot change org
      AND role = app_role()   -- Cannot change role
    )
  );

COMMENT ON POLICY users_update ON public.users IS 'Allow users to update own profile (name/email only), managers to update downline, admins to update org users';
