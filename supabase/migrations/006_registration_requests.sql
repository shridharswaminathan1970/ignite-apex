-- 006_registration_requests.sql
-- Secure registration flow: pending requests with admin approval

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create registration_requests table
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT DEFAULT 'NA',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON public.registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);

-- Enable RLS
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Only super_duper_admin can view/manage registration requests
CREATE POLICY registration_requests_select ON public.registration_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_duper_admin'
    )
  );

CREATE POLICY registration_requests_insert ON public.registration_requests
  FOR INSERT
  WITH CHECK (true); -- Allow anonymous registration requests

CREATE POLICY registration_requests_update ON public.registration_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_duper_admin'
    )
  );

CREATE POLICY registration_requests_delete ON public.registration_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'super_duper_admin'
    )
  );

-- Comment
COMMENT ON TABLE public.registration_requests IS 'Pending user registration requests awaiting admin approval (industry standard secure flow - no passwords stored)';
