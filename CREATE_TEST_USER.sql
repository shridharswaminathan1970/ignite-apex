-- Create a clean test user for Paddle checkout testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql

-- 1. Create test organization
INSERT INTO organisations (id, name, domain, status, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Corp',
  'testcorp.example',
  'active',
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create test user in auth.users (Supabase Auth)
-- Password: Test123! (hashed)
-- NOTE: You must create this user via Supabase Dashboard → Authentication → Users
-- Click "Add User" and use:
-- Email: test@testcorp.example
-- Password: Test123!
-- Confirm Password: Test123!
-- Auto-confirm user: YES

-- 3. After creating auth user, run this to create profile:
INSERT INTO users (
  id,
  email,
  name,
  role,
  org_id,
  status,
  created_at,
  last_login
)
SELECT
  auth.uid() as id,
  'test@testcorp.example',
  'Test User',
  'admin',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'active',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'test@testcorp.example'
);

-- 4. Create subscription record (in trial)
INSERT INTO org_subscriptions (
  org_id,
  status,
  plan,
  billing_cycle,
  max_users,
  trial_started_at,
  trial_ends_at,
  crm_enabled,
  b2b0_enabled,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'trial',
  'team_mini',
  'monthly',
  3,
  now(),
  now() + interval '99 days',
  false, -- Will be set to true after Paddle checkout
  false,
  now()
) ON CONFLICT (org_id) DO UPDATE SET
  status = 'trial',
  trial_started_at = now(),
  trial_ends_at = now() + interval '99 days';

-- 5. Verify test user
SELECT
  u.email,
  u.name,
  u.role,
  o.name as org_name,
  s.status,
  s.crm_enabled,
  s.trial_ends_at
FROM users u
JOIN organisations o ON u.org_id = o.id
JOIN org_subscriptions s ON o.id = s.org_id
WHERE u.email = 'test@testcorp.example';
