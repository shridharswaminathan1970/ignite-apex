-- Set muhammad.shaamel@gmail.com as Super Duper Admin
-- Run this in Supabase SQL Editor

-- First, check if super_duper_admin role exists in enum
DO $$
BEGIN
  -- Add super_duper_admin to user_role enum if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_duper_admin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_duper_admin';
    RAISE NOTICE 'Added super_duper_admin to user_role enum';
  ELSE
    RAISE NOTICE 'super_duper_admin already exists in enum';
  END IF;
END $$;

-- Update muhammad.shaamel@gmail.com to super_duper_admin
UPDATE users
SET
  role = 'super_duper_admin',
  updated_at = now()
WHERE email = 'muhammad.shaamel@gmail.com';

-- Verify the update
SELECT
  email,
  name,
  role,
  org_id,
  status,
  created_at
FROM users
WHERE email = 'muhammad.shaamel@gmail.com';

-- Also check shridhar as regular super_admin (company level)
SELECT
  email,
  name,
  role,
  org_id,
  status
FROM users
WHERE email = 'shridhar.swaminathan1970@gmail.com';

-- Show all admin-level users
SELECT
  email,
  role,
  status,
  (SELECT name FROM organisations WHERE id = users.org_id) as company
FROM users
WHERE role IN ('super_duper_admin', 'super_admin', 'admin')
ORDER BY
  CASE role
    WHEN 'super_duper_admin' THEN 1
    WHEN 'super_admin' THEN 2
    WHEN 'admin' THEN 3
  END;
