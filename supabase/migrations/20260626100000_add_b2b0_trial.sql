-- Add B2B0 trial tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS b2b0_trial_activated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS b2b0_enabled BOOLEAN DEFAULT false;

-- B2B0 trial request table (similar to registration_requests)
CREATE TABLE IF NOT EXISTS b2b0_trial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE b2b0_trial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit B2B0 trial request"
ON b2b0_trial_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super Duper Admin can view B2B0 requests"
ON b2b0_trial_requests FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'));

CREATE POLICY "Super Duper Admin can update B2B0 requests"
ON b2b0_trial_requests FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_duper_admin'));

GRANT INSERT ON b2b0_trial_requests TO authenticated;
GRANT SELECT, UPDATE ON b2b0_trial_requests TO authenticated;
