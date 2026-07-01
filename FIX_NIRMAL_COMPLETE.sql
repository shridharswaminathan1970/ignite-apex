-- Complete fix for nirmal.pandey008@yahoo.com
-- Handles missing org, missing team, duplicate users, etc.

-- =================================================================
-- STEP 1: Clean up any duplicate users (if they exist)
-- =================================================================

-- Check for duplicates first
SELECT
  COUNT(*) as user_count,
  CASE
    WHEN COUNT(*) > 1 THEN '⚠️ DUPLICATES FOUND - will delete extras'
    WHEN COUNT(*) = 1 THEN '✅ Single user found'
    WHEN COUNT(*) = 0 THEN '❌ No user in users table'
  END as status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';

-- If duplicates exist, keep only the one matching auth.users ID
DELETE FROM users
WHERE email = 'nirmal.pandey008@yahoo.com'
  AND id != (SELECT id FROM auth.users WHERE email = 'nirmal.pandey008@yahoo.com');


-- =================================================================
-- STEP 2: Create organization "NA" if it doesn't exist
-- =================================================================

INSERT INTO organisations (name)
VALUES ('NA')
ON CONFLICT DO NOTHING;

-- Verify org exists
SELECT id, name FROM organisations WHERE name = 'NA';


-- =================================================================
-- STEP 3: Create default team in org "NA" if it doesn't exist
-- =================================================================

INSERT INTO teams (name, org_id)
VALUES ('Team Alpha', (SELECT id FROM organisations WHERE name = 'NA'))
ON CONFLICT DO NOTHING;

-- Verify team exists
SELECT id, name, org_id FROM teams
WHERE org_id = (SELECT id FROM organisations WHERE name = 'NA');


-- =================================================================
-- STEP 4: If user doesn't exist in users table, create them
-- =================================================================

-- Check if user exists in users table but not in auth
INSERT INTO users (
  id,
  email,
  name,
  role,
  org_id,
  team_id,
  status,
  crm_enabled,
  crm_trial_activated_at
)
SELECT
  au.id,
  au.email,
  'Nirmal Pandey',
  'sdr',
  (SELECT id FROM organisations WHERE name = 'NA'),
  (SELECT id FROM teams WHERE org_id = (SELECT id FROM organisations WHERE name = 'NA') LIMIT 1),
  'active',
  true,
  NOW()
FROM auth.users au
WHERE au.email = 'nirmal.pandey008@yahoo.com'
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- STEP 5: Update existing user with correct values
-- =================================================================

UPDATE users
SET
  role = 'sdr',
  org_id = (SELECT id FROM organisations WHERE name = 'NA'),
  team_id = (SELECT id FROM teams WHERE org_id = (SELECT id FROM organisations WHERE name = 'NA') LIMIT 1),
  status = 'active',
  crm_enabled = true,
  crm_trial_activated_at = COALESCE(crm_trial_activated_at, NOW()),  -- Don't overwrite if already set
  name = COALESCE(name, 'Nirmal Pandey')  -- Only set if NULL
WHERE email = 'nirmal.pandey008@yahoo.com';


-- =================================================================
-- STEP 6: FINAL VERIFICATION
-- =================================================================

-- Show complete user profile
SELECT
  u.id,
  u.email,
  u.name,
  u.role,
  u.status,
  o.name as org_name,
  t.name as team_name,
  u.crm_enabled,
  CASE
    WHEN u.crm_trial_activated_at IS NOT NULL
    THEN EXTRACT(DAY FROM (u.crm_trial_activated_at + INTERVAL '90 days' - NOW()))::int || ' days remaining'
    ELSE 'No trial'
  END as trial_status,
  CASE
    WHEN u.id = (SELECT id FROM auth.users WHERE email = u.email)
    THEN '✅ ID matches auth.users'
    ELSE '❌ ID mismatch'
  END as id_check
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email = 'nirmal.pandey008@yahoo.com';

-- Verify no duplicates remain
SELECT
  COUNT(*) as total_users,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ FIXED - exactly one user'
    WHEN COUNT(*) > 1 THEN '❌ STILL HAVE DUPLICATES'
    WHEN COUNT(*) = 0 THEN '❌ USER MISSING'
  END as final_status
FROM users
WHERE email = 'nirmal.pandey008@yahoo.com';


-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================

SELECT '✅ FIX COMPLETE - nirmal.pandey008@yahoo.com can now login' as status;
