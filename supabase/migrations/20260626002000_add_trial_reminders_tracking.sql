-- Add trial_reminders_sent tracking column to org_subscriptions
-- Stores JSON object with reminder timestamps: { day90, day120, day130, day140 }

ALTER TABLE org_subscriptions
ADD COLUMN IF NOT EXISTS trial_reminders_sent JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN org_subscriptions.trial_reminders_sent IS 'Tracks when trial reminders were sent: { day90: timestamp, day120: timestamp, day130: timestamp, day140: timestamp }';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trial_reminders_day90
ON org_subscriptions((trial_reminders_sent->>'day90'))
WHERE status = 'trial' AND crm_enabled = true;

CREATE INDEX IF NOT EXISTS idx_trial_reminders_day120
ON org_subscriptions((trial_reminders_sent->>'day120'))
WHERE status = 'expired' AND crm_enabled = false;

CREATE INDEX IF NOT EXISTS idx_trial_reminders_day130
ON org_subscriptions((trial_reminders_sent->>'day130'))
WHERE status = 'expired' AND crm_enabled = false;

CREATE INDEX IF NOT EXISTS idx_trial_reminders_day140
ON org_subscriptions((trial_reminders_sent->>'day140'))
WHERE status = 'expired' AND crm_enabled = false;
