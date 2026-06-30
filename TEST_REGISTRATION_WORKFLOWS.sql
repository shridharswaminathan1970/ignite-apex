-- TEST REGISTRATION WORKFLOWS
-- Run this in Supabase SQL Editor to verify everything works

-- ============================================
-- TEST 1: Check if tables exist
-- ============================================

SELECT 'Registration Tables Status' as test;

SELECT
  'registration_requests' as table_name,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected
FROM registration_requests;

SELECT
  'company_registration_requests' as table_name,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected
FROM company_registration_requests;

-- ============================================
-- TEST 2: Insert test individual registration
-- ============================================

INSERT INTO registration_requests (
  full_name,
  email,
  phone,
  country,
  company,
  status,
  requested_at
) VALUES (
  'Test Individual User',
  'test.individual@example.com',
  '+1 234 567 8900',
  'United States',
  'NA',
  'pending',
  now()
) ON CONFLICT (email) DO NOTHING
RETURNING id, email, status;

-- ============================================
-- TEST 3: Insert test company registration
-- ============================================

INSERT INTO company_registration_requests (
  company_name,
  company_address,
  company_url,
  company_phone,
  senior_manager_name,
  senior_manager_designation,
  senior_manager_email,
  senior_manager_phone,
  super_admin_name,
  super_admin_email,
  super_admin_phone,
  users,
  teams,
  status,
  requested_at
) VALUES (
  'Test Corporation Inc',
  '123 Business Avenue, Tech City, TC 12345',
  'https://testcorp.example.com',
  '+1 555 123 4567',
  'John Smith',
  'VP of Sales',
  'john.smith@testcorp.example',
  '+1 555 123 4568',
  'Jane Doe',
  'jane.doe@testcorp.example',
  '+1 555 123 4569',
  '[{"name":"Bob Wilson","role":"manager","reports_to":"Jane Doe","team":"Sales Team A"},{"name":"Alice Johnson","role":"user","reports_to":"Bob Wilson","team":"Sales Team A"}]'::jsonb,
  '[{"team_name":"Sales Team A","team_manager":"Bob Wilson"}]'::jsonb,
  'pending',
  now()
) RETURNING id, company_name, status;

-- ============================================
-- TEST 4: Check RLS policies work
-- ============================================

SELECT 'RLS Policy Check' as test;

-- Check if anon can insert (should work)
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('registration_requests', 'company_registration_requests')
ORDER BY tablename, policyname;

-- ============================================
-- TEST 5: Test approval function
-- ============================================

-- Get a pending request
SELECT
  id,
  email,
  full_name,
  status
FROM registration_requests
WHERE status = 'pending'
LIMIT 1;

-- Uncomment to test approval (replace REQUEST_ID with actual ID from above)
-- SELECT approve_individual_registration('REQUEST_ID'::uuid);

-- ============================================
-- TEST 6: View all pending requests
-- ============================================

SELECT 'PENDING INDIVIDUAL REQUESTS' as category;

SELECT
  id,
  full_name,
  email,
  phone,
  country,
  company,
  status,
  requested_at
FROM registration_requests
WHERE status = 'pending'
ORDER BY requested_at DESC;

SELECT 'PENDING COMPANY REQUESTS' as category;

SELECT
  id,
  company_name,
  senior_manager_name,
  senior_manager_email,
  super_admin_name,
  super_admin_email,
  status,
  requested_at
FROM company_registration_requests
WHERE status = 'pending'
ORDER BY requested_at DESC;

-- ============================================
-- TEST 7: Check user roles
-- ============================================

SELECT 'USER ROLES CHECK' as test;

SELECT
  email,
  role,
  status
FROM users
WHERE role IN ('super_duper_admin', 'super_admin')
ORDER BY
  CASE role
    WHEN 'super_duper_admin' THEN 1
    WHEN 'super_admin' THEN 2
    ELSE 3
  END;

-- ============================================
-- EXPECTED RESULTS
-- ============================================

/*
TEST 1: Should show both tables exist with counts
TEST 2: Should insert test individual user
TEST 3: Should insert test company
TEST 4: Should show RLS policies for anon INSERT
TEST 5: Should show pending request
TEST 6: Should list all pending requests
TEST 7: Should show muhammad.shaamel@gmail.com as super_duper_admin

If any test fails, check:
1. Migration ran successfully
2. RLS policies created
3. User roles assigned correctly
*/
