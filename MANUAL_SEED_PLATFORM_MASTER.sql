-- MANUAL SEED: Create Platform Master User
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/gokslnrvxqledagcwghq/sql)
--
-- PREREQUISITES:
-- 1. Create auth user muhammad.shaamel@gmail.com in Supabase Auth dashboard
-- 2. Set a password for that user
-- 3. Copy the user's UUID from auth.users
-- 4. Run this script

-- Step 1: Find the auth user ID
-- Run this first to get the UUID:
SELECT id, email, created_at
FROM auth.users
WHERE email = 'muhammad.shaamel@gmail.com';

-- Step 2: Insert user profile (REPLACE 'YOUR-UUID-HERE' with the ID from Step 1)
-- Example UUID format: '123e4567-e89b-12d3-a456-426614174000'

INSERT INTO public.users (
  id,
  email,
  name,
  role,
  org_id,
  manager_id,
  crm_enabled,
  is_active,
  account_type,
  created_at
) VALUES (
  'YOUR-UUID-HERE', -- ⚠️ REPLACE THIS with the UUID from Step 1
  'muhammad.shaamel@gmail.com',
  'Muhammad Shaamel',
  'super_duper_admin',
  NULL,
  NULL,
  true,
  true,
  'platform_master',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_duper_admin',
  is_active = true;

-- Step 3: Verify the user was created
SELECT id, email, name, role, is_active
FROM public.users
WHERE email = 'muhammad.shaamel@gmail.com';

-- Expected output:
-- id | email | name | role | is_active
-- YOUR-UUID | muhammad.shaamel@gmail.com | Muhammad Shaamel | super_duper_admin | true
