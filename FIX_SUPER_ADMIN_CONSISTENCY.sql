-- Step 1: Show current differences
SELECT
  email,
  role,
  org_id,
  team_id,
  crm_enabled,
  b2b0_enabled,
  status,
  is_active,
  account_type
FROM users
WHERE email IN ('muhammad.shaamel@gmail.com', 'shaamel@shaamelz.com')
ORDER BY email;

-- Step 2: Fix shaamel@shaamelz.com to match muhammad.shaamel@gmail.com
-- Remove org/team assignment (super duper admins don't belong to orgs)
UPDATE users
SET
  org_id = NULL,
  team_id = NULL,
  crm_enabled = true,  -- Super duper admins have all features
  b2b0_enabled = true,
  status = 'active',
  is_active = true
WHERE email = 'shaamel@shaamelz.com';

-- Also ensure muhammad.shaamel@gmail.com has same flags
UPDATE users
SET
  crm_enabled = true,
  b2b0_enabled = true,
  status = 'active',
  is_active = true
WHERE email = 'muhammad.shaamel@gmail.com';

-- Step 3: Verify both accounts now match
SELECT
  email,
  role,
  org_id IS NULL as no_org,
  team_id IS NULL as no_team,
  crm_enabled,
  b2b0_enabled,
  status,
  is_active,
  CASE
    WHEN org_id IS NULL AND team_id IS NULL AND crm_enabled AND b2b0_enabled
    THEN '✅ CORRECT (above all orgs)'
    ELSE '⚠️ NEEDS FIX'
  END as super_admin_status
FROM users
WHERE email IN ('muhammad.shaamel@gmail.com', 'shaamel@shaamelz.com')
ORDER BY email;
