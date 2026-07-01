-- Fix nirmal.pandey008@yahoo.com user profile
-- Assign to organization "NA" as SDR

-- Step 1: Find the "NA" organization
SELECT id, name FROM organisations WHERE name = 'NA';

-- Step 2: Get a team in that org (or create one if needed)
-- First check if Team Alpha exists
SELECT id, name FROM teams WHERE org_id = (SELECT id FROM organisations WHERE name = 'NA') LIMIT 1;

-- If no team exists, create default team (uncomment if needed)
-- INSERT INTO teams (name, org_id)
-- VALUES ('Team Alpha', (SELECT id FROM organisations WHERE name = 'NA'))
-- RETURNING id;

-- Step 3: Update user with correct org_id, role, and team
UPDATE users
SET
  org_id = (SELECT id FROM organisations WHERE name = 'NA'),
  role = 'sdr',
  team_id = (SELECT id FROM teams WHERE org_id = (SELECT id FROM organisations WHERE name = 'NA') LIMIT 1),
  crm_enabled = true,
  crm_trial_activated_at = NOW()  -- Activate 90-day trial
WHERE email = 'nirmal.pandey008@yahoo.com'
RETURNING id, email, role, org_id, team_id;

-- Step 4: Verify the fix
SELECT
  u.email,
  u.role,
  o.name as org_name,
  t.name as team_name,
  u.crm_enabled,
  CASE
    WHEN u.crm_trial_activated_at IS NOT NULL
    THEN EXTRACT(DAY FROM (u.crm_trial_activated_at + INTERVAL '90 days' - NOW()))::int || ' days remaining'
    ELSE 'No trial'
  END as trial_status
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email = 'nirmal.pandey008@yahoo.com';
