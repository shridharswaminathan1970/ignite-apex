-- Check if john@acme.test exists in auth
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'john@acme.test';

-- If exists, check profile
SELECT u.id, u.email, u.name, u.org_id, o.name as org_name
FROM users u
LEFT JOIN organisations o ON u.org_id = o.id
WHERE u.email = 'john@acme.test';
