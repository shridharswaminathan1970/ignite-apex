-- ========================================
-- EMERGENCY FIX: PostgREST Schema Cache Reload
-- ========================================
-- Run this in Supabase SQL Editor to fix PGRST204 error
-- Error: "Could not find the 'phone' column of 'registration_requests'"

-- Step 1: Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Verify all columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'registration_requests'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (uuid)
-- - full_name (text)
-- - email (text)
-- - phone (text) ← THIS SHOULD EXIST
-- - country (text) ← THIS SHOULD EXIST
-- - company (text)
-- - status (text)
-- - requested_at (timestamptz)
-- - approved_at (timestamptz)
-- - approved_by (uuid)
-- - rejection_reason (text)
-- - created_at (timestamptz)
-- - updated_at (timestamptz)

-- Step 3: If columns are missing, recreate table (BACKUP FIRST!)
-- DO NOT RUN THIS UNLESS COLUMNS ARE ACTUALLY MISSING:
/*
DROP TABLE IF EXISTS registration_requests CASCADE;

CREATE TABLE registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  company TEXT DEFAULT 'NA',
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anon can insert
DROP POLICY IF EXISTS "Anon can submit individual registration" ON registration_requests;
CREATE POLICY "Anon can submit individual registration"
ON registration_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Super Duper Admin can view all
DROP POLICY IF EXISTS "Super Duper Admin can view all requests" ON registration_requests;
CREATE POLICY "Super Duper Admin can view all requests"
ON registration_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- Policy: Super Duper Admin can update
DROP POLICY IF EXISTS "Super Duper Admin can update requests" ON registration_requests;
CREATE POLICY "Super Duper Admin can update requests"
ON registration_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- After recreation, notify again
NOTIFY pgrst, 'reload schema';
*/
