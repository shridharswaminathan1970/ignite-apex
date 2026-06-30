-- Recreate registration tables with correct schema
-- Drop and recreate to ensure all columns exist

-- Drop existing tables (cascade will handle dependencies)
DROP TABLE IF EXISTS registration_requests CASCADE;
DROP TABLE IF EXISTS company_registration_requests CASCADE;
DROP TABLE IF EXISTS trial_reminders_sent CASCADE;

-- Create registration_requests table (INDIVIDUAL PUBLIC USERS)
CREATE TABLE registration_requests (
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create company_registration_requests table (ENTERPRISE COMPANIES)
CREATE TABLE company_registration_requests (
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

  -- Company Super Admin
  super_admin_name TEXT NOT NULL,
  super_admin_email TEXT NOT NULL,
  super_admin_phone TEXT NOT NULL,

  -- Users and Teams (JSON)
  users JSONB DEFAULT '[]'::jsonb,
  teams JSONB DEFAULT '[]'::jsonb,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trial reminders tracking table
CREATE TABLE trial_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'day_90_popup', 'day_120_email', 'day_130_email', 'day_140_email'
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, reminder_type)
);

-- Enable RLS on all tables
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_reminders_sent ENABLE ROW LEVEL SECURITY;

-- RLS Policies: registration_requests (Individual)
CREATE POLICY "Anyone can submit individual registration"
ON registration_requests
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Super Duper Admin can view individual requests"
ON registration_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

CREATE POLICY "Super Duper Admin can update individual requests"
ON registration_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- RLS Policies: company_registration_requests (Enterprise)
CREATE POLICY "Anyone can submit company registration"
ON company_registration_requests
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Super Duper Admin can view company requests"
ON company_registration_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

CREATE POLICY "Super Duper Admin can update company requests"
ON company_registration_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'
  )
);

-- RLS Policies: trial_reminders_sent
CREATE POLICY "System can manage trial reminders"
ON trial_reminders_sent
FOR ALL
TO authenticated
WITH CHECK (true)
USING (true);

-- Create indexes
CREATE INDEX idx_registration_requests_status ON registration_requests(status);
CREATE INDEX idx_registration_requests_email ON registration_requests(email);
CREATE INDEX idx_company_registration_requests_status ON company_registration_requests(status);
CREATE INDEX idx_company_registration_requests_company_name ON company_registration_requests(company_name);
CREATE INDEX idx_trial_reminders_org_id ON trial_reminders_sent(org_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON TABLE registration_requests IS 'Individual public user registration requests (Company = NA)';
COMMENT ON TABLE company_registration_requests IS 'Enterprise company registration requests';
COMMENT ON TABLE trial_reminders_sent IS 'Track which trial reminder emails/popups have been sent';
