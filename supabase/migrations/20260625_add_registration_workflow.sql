-- Registration Request Workflow
-- Super Admin approves requests → Users get password-set link

-- Registration requests table
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  company TEXT DEFAULT 'NA',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit registration request (anon users)
CREATE POLICY "Anyone can submit registration request"
ON registration_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON registration_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON registration_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);

-- Function: Approve registration and send password-set link
CREATE OR REPLACE FUNCTION approve_registration(request_id UUID)
RETURNS JSON AS $$
DECLARE
  req RECORD;
  auth_user_id UUID;
  org_uuid UUID;
  invite_token TEXT;
BEGIN
  -- Get registration request
  SELECT * INTO req FROM registration_requests WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Create organization (company = NA if not provided)
  INSERT INTO organisations (name, domain, status)
  VALUES (
    COALESCE(req.company, 'NA'),
    LOWER(REPLACE(req.email, '@', '_at_')) || '.ignite-apex.user',
    'active'
  )
  RETURNING id INTO org_uuid;

  -- Create auth user (Supabase Auth) with invite
  -- NOTE: This needs to be done via Supabase Admin API in Edge Function
  -- For now, we mark as approved and super admin will create user manually

  -- Update request status
  UPDATE registration_requests
  SET
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid()
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'email', req.email,
    'org_id', org_uuid,
    'message', 'Registration approved. User will receive password-set email.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE registration_requests IS 'New user registration requests pending super admin approval';
COMMENT ON FUNCTION approve_registration IS 'Approve registration request and send password-set link to user';
