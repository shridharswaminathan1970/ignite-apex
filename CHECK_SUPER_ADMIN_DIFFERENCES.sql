-- Compare the two super_duper_admin accounts

SELECT
  email,
  role,
  org_id,
  team_id,
  status,
  crm_enabled,
  crm_trial_activated_at,
  b2b0_enabled,
  b2b0_trial_activated_at,
  account_type,
  is_active,
  created_at
FROM users
WHERE email IN ('muhammad.shaamel@gmail.com', 'shaamel@shaamelz.com')
ORDER BY email;

-- Check what org shaamel@shaamelz.com belongs to
SELECT
  u.email,
  o.name as org_name,
  o.slug as org_slug,
  t.name as team_name
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.email IN ('muhammad.shaamel@gmail.com', 'shaamel@shaamelz.com')
ORDER BY u.email;
