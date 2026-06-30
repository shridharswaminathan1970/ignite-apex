-- Fix RLS policy for company registration (anon users should be able to INSERT)

-- Drop existing policy and recreate with correct permissions
DROP POLICY IF EXISTS "Anyone can submit company registration" ON company_registration_requests;

-- Allow anonymous (public) users to submit company registrations
CREATE POLICY "Anon can submit company registration"
ON company_registration_requests
FOR INSERT
TO anon, authenticated  -- Allow both anon and authenticated
WITH CHECK (true);

-- Also ensure the policy for individual registrations is correct
DROP POLICY IF EXISTS "Anyone can submit individual registration" ON registration_requests;

CREATE POLICY "Anon can submit individual registration"
ON registration_requests
FOR INSERT
TO anon, authenticated  -- Allow both anon and authenticated
WITH CHECK (true);

-- Verify policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('registration_requests', 'company_registration_requests')
  AND cmd = 'INSERT'
ORDER BY tablename, policyname;
