-- ========================================
-- RESET registration_requests RLS to Clean State
-- ========================================

-- Step 1: Drop ALL policies (clean slate)
DROP POLICY IF EXISTS "anon_insert" ON registration_requests;
DROP POLICY IF EXISTS "Allow public anon inserts" ON registration_requests;
DROP POLICY IF EXISTS "Allow anon insert" ON registration_requests;
DROP POLICY IF EXISTS "Anon can submit registration" ON registration_requests;
DROP POLICY IF EXISTS "Anyone can submit registration request" ON registration_requests;
DROP POLICY IF EXISTS "Anon can submit individual registration" ON registration_requests;
DROP POLICY IF EXISTS "Super Duper Admin can view all requests" ON registration_requests;
DROP POLICY IF EXISTS "Super Duper Admin can update requests" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_select" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_insert" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_update" ON registration_requests;
DROP POLICY IF EXISTS "registration_requests_delete" ON registration_requests;

-- Step 2: Enable RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Step 3: Create clean policies matching original migration design
-- Policy 1: Anon can INSERT registration requests
CREATE POLICY "Anon can submit individual registration"
ON registration_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Super Duper Admin can SELECT all requests
CREATE POLICY "Super Duper Admin can view all requests"
ON registration_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- Policy 3: Super Duper Admin can UPDATE requests (approve/reject)
CREATE POLICY "Super Duper Admin can update requests"
ON registration_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- Step 4: Grant explicit permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON registration_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON registration_requests TO authenticated;

-- Step 5: Verify setup
SELECT
    policyname,
    roles,
    cmd,
    CASE
        WHEN with_check = 'true' THEN 'true (allows all)'
        ELSE 'conditional'
    END as access_type
FROM pg_policies
WHERE tablename = 'registration_requests'
ORDER BY cmd, policyname;
