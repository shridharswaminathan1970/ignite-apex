-- Add CRM Trial Activation Function
-- User must manually activate CRM trial (then 99-day countdown starts)

-- Function: Activate CRM trial for organization
CREATE OR REPLACE FUNCTION activate_crm_trial(user_org_id UUID)
RETURNS JSON AS $$
DECLARE
  sub RECORD;
BEGIN
  -- Get subscription
  SELECT * INTO sub FROM org_subscriptions WHERE org_id = user_org_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No subscription found for this organization');
  END IF;

  -- Check if trial already activated
  IF sub.trial_started_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CRM trial already activated',
      'trial_started_at', sub.trial_started_at,
      'trial_ends_at', sub.trial_ends_at
    );
  END IF;

  -- Activate trial: Start 99-day countdown
  UPDATE org_subscriptions
  SET
    status = 'trial',
    trial_started_at = now(),
    trial_ends_at = now() + interval '99 days',
    crm_enabled = true, -- Enable CRM access
    updated_at = now()
  WHERE org_id = user_org_id;

  RETURN json_build_object(
    'success', true,
    'message', '99-day CRM trial activated',
    'trial_started_at', now(),
    'trial_ends_at', now() + interval '99 days',
    'days_remaining', 99
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trial reminder tracking table
CREATE TABLE IF NOT EXISTS trial_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'day_90_popup', 'day_120_email', 'day_130_email', 'day_140_email'
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_trial_reminders_org_id ON trial_reminders_sent(org_id);

COMMENT ON FUNCTION activate_crm_trial IS 'Activate 99-day CRM trial for user - countdown starts immediately';
COMMENT ON TABLE trial_reminders_sent IS 'Track which trial reminder emails/popups have been sent';
