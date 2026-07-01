-- Direct fix for nirmal.pandey008@yahoo.com
-- Simple UPDATE with hardcoded values

-- Step 1: Find or create org "NA"
INSERT INTO organisations (name, slug)
VALUES ('NA', 'na')
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- If org already exists, get its ID
SELECT id FROM organisations WHERE name = 'NA';
-- Copy this ID, you'll use it below

-- Step 2: Create Team Alpha in org NA (replace <org_id> with ID from above)
-- First try to get existing team
SELECT id FROM teams WHERE name = 'Team Alpha' AND org_id = (SELECT id FROM organisations WHERE name = 'NA');

-- If no team found, create it
INSERT INTO teams (name, org_id)
VALUES ('Team Alpha', (SELECT id FROM organisations WHERE name = 'NA'))
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 3: Direct UPDATE (no subqueries, simple)
UPDATE users
SET
  role = 'sdr',
  org_id = (SELECT id FROM organisations WHERE name = 'NA'),
  team_id = (SELECT id FROM teams WHERE org_id = (SELECT id FROM organisations WHERE name = 'NA') LIMIT 1),
  status = 'active',
  crm_enabled = true
WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';

-- Step 4: Verify
SELECT
  id,
  email,
  role,
  org_id,
  team_id,
  status,
  crm_enabled
FROM users
WHERE id = '397c4079-6415-4957-bc2f-6d761538bd79';
