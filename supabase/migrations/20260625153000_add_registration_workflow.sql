-- Registration Request Workflow for Public Users
-- Super Duper Admin (muhammad.shaamel@gmail.com) approves requests

-- Add super_duper_admin role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_duper_admin', 'super_admin', 'admin', 'manager', 'user');
  ELSE
    -- Add super_duper_admin to existing enum if needed
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_duper_admin';
  END IF;
END$$;

-- Registration requests table (for public individual users)
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  company TEXT DEFAULT 'NA', -- Always 'NA' for public users
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (anon) can submit registration request
DROP POLICY IF EXISTS "Anyone can submit registration request" ON registration_requests;
CREATE POLICY "Anyone can submit registration request"
ON registration_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Super Duper Admin can view all requests
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

-- Policy: Super Duper Admin can update requests (approve/reject)
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

-- Company registration requests table (for enterprise companies)
CREATE TABLE IF NOT EXISTS company_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company Information
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_url TEXT,
  company_phone TEXT NOT NULL,

  -- Senior Manager
  senior_manager_name TEXT NOT NULL,
  senior_manager_designation TEXT NOT NULL,
  senior_manager_email TEXT NOT NULL,
  senior_manager_phone TEXT NOT NULL,

  -- Super Admin (for this company)
  super_admin_name TEXT NOT NULL,
  super_admin_email TEXT NOT NULL,
  super_admin_phone TEXT NOT NULL,

  -- Users (JSON array)
  users JSONB DEFAULT '[]'::jsonb, -- [{ name, role, reports_to, team }]

  -- Teams (JSON array)
  teams JSONB DEFAULT '[]'::jsonb, -- [{ team_name, team_manager }]

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_registration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit company registration request
DROP POLICY IF EXISTS "Anyone can submit company request" ON company_registration_requests;
CREATE POLICY "Anyone can submit company request"
ON company_registration_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Super Duper Admin can view all company requests
DROP POLICY IF EXISTS "Super Duper Admin can view company requests" ON company_registration_requests;
CREATE POLICY "Super Duper Admin can view company requests"
ON company_registration_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- Policy: Super Duper Admin can update company requests
DROP POLICY IF EXISTS "Super Duper Admin can update company requests" ON company_registration_requests;
CREATE POLICY "Super Duper Admin can update company requests"
ON company_registration_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_company_registration_requests_status ON company_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_registration_requests_company_name ON company_registration_requests(company_name);

-- Function: Approve individual registration (public user)
CREATE OR REPLACE FUNCTION approve_individual_registration(request_id UUID)
RETURNS JSON AS $$
DECLARE
  req RECORD;
  org_uuid UUID;
BEGIN
  -- Get registration request
  SELECT * INTO req FROM registration_requests WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  -- Create organization with company = 'NA'
  INSERT INTO organisations (name, domain, status)
  VALUES (
    'NA',
    LOWER(REPLACE(req.email, '@', '_at_')) || '.individual',
    'active'
  )
  RETURNING id INTO org_uuid;

  -- Create subscription record (NO trial yet - trial starts when user activates CRM)
  INSERT INTO org_subscriptions (
    org_id,
    status,
    plan,
    billing_cycle,
    max_users,
    trial_started_at,
    trial_ends_at,
    crm_enabled,
    b2b0_enabled
  ) VALUES (
    org_uuid,
    'free', -- Free Sales OS only, no trial yet
    'team_mini',
    'monthly',
    1, -- Free tier: 1 user (Sales OS only)
    NULL, -- Trial NOT started yet
    NULL, -- Trial NOT started yet
    false, -- CRM disabled until user activates trial
    false
  );

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
    'message', 'Registration approved. Send password-set email to user.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE registration_requests IS 'Individual public user registration requests (Company = NA)';
COMMENT ON TABLE company_registration_requests IS 'Enterprise company registration requests (full company setup)';
COMMENT ON FUNCTION approve_individual_registration IS 'Approve individual user registration - Super Duper Admin only';
