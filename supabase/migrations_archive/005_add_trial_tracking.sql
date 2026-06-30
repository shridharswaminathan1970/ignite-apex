-- Add trial tracking to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Set trial dates for existing users
UPDATE users
SET
  trial_start_date = created_at,
  trial_end_date = created_at + INTERVAL '180 days',
  subscription_status = 'trial'
WHERE trial_start_date IS NULL;

-- Create function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  trial_end TIMESTAMPTZ;
  sub_status TEXT;
BEGIN
  SELECT trial_end_date, subscription_status
  INTO trial_end, sub_status
  FROM users
  WHERE id = user_id;

  IF sub_status = 'active' THEN
    RETURN 'active';
  ELSIF trial_end IS NULL THEN
    RETURN 'trial';
  ELSIF NOW() > trial_end THEN
    -- Update status to expired
    UPDATE users SET subscription_status = 'expired' WHERE id = user_id;
    RETURN 'expired';
  ELSE
    RETURN 'trial';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON COLUMN users.trial_start_date IS 'When the 180-day trial started';
COMMENT ON COLUMN users.trial_end_date IS 'When the 180-day trial ends';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: trial, active, expired, cancelled';
COMMENT ON COLUMN users.last_login IS 'Last time user logged in';
