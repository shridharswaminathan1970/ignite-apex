-- Single query to check Nirmal's complete profile

SELECT
  u.id as user_id,
  u.email,
  u.name,
  u.role,
  u.status as user_status,
  u.org_id,
  u.team_id,
  u.crm_enabled,
  u.account_type,
  o.name as org_name,
  o.slug as org_slug,
  t.name as team_name,
  CASE
    WHEN u.id IS NULL THEN '❌ USER NOT FOUND'
    WHEN u.org_id IS NULL THEN '❌ NO ORG_ID'
    WHEN u.team_id IS NULL THEN '⚠️ NO TEAM_ID'
    WHEN u.role = 'public' THEN '⚠️ ROLE STILL PUBLIC'
    WHEN o.id IS NULL THEN '❌ ORG DOESNT EXIST'
    WHEN t.id IS NULL THEN '⚠️ TEAM DOESNT EXIST'
    ELSE '✅ ALL GOOD'
  END as diagnosis
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email = 'nirmal.pandey008@yahoo.com';
