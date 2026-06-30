-- Migration: Add B2B0 independent entitlements
-- Date: 2026-06-25
-- Purpose: B2B0 is independently entitled - can be purchased WITHOUT CRM

-- Add B2B0 entitlement flags to org_subscriptions
DO $$
BEGIN
  -- b2b0_enabled: independent flag, NOT dependent on crm_enabled
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_subscriptions' AND column_name = 'b2b0_enabled'
  ) THEN
    ALTER TABLE org_subscriptions ADD COLUMN b2b0_enabled BOOLEAN DEFAULT false;
    ALTER TABLE org_subscriptions ADD COLUMN b2b0_plan TEXT; -- 'mini', 'midi', 'maxi'
    ALTER TABLE org_subscriptions ADD COLUMN b2b0_seats INTEGER DEFAULT 0; -- number of seats purchased
    ALTER TABLE org_subscriptions ADD COLUMN b2b0_trial_started_at TIMESTAMPTZ;
    ALTER TABLE org_subscriptions ADD COLUMN b2b0_trial_ends_at TIMESTAMPTZ;
    ALTER TABLE org_subscriptions ADD COLUMN b2b0_subscription_started_at TIMESTAMPTZ;
  END IF;
END $$;

-- Remove old b2b_outreach_addon column (replaced by b2b0_enabled)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_subscriptions' AND column_name = 'b2b_outreach_addon'
  ) THEN
    ALTER TABLE org_subscriptions DROP COLUMN b2b_outreach_addon;
  END IF;
END $$;

-- Create index for B2B0 entitlement lookups
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_b2b0
ON org_subscriptions(b2b0_enabled, b2b0_plan)
WHERE b2b0_enabled = true;

COMMENT ON COLUMN org_subscriptions.b2b0_enabled IS 'B2B0 entitlement - INDEPENDENT of crm_enabled. User can have B2B0 without CRM.';
COMMENT ON COLUMN org_subscriptions.b2b0_plan IS 'B2B0 plan tier: mini (5 seats), midi (15 seats), maxi (50 seats)';
COMMENT ON COLUMN org_subscriptions.b2b0_seats IS 'Number of B2B0 seats purchased';
COMMENT ON COLUMN org_subscriptions.b2b0_trial_started_at IS 'B2B0 7-day trial start (independent of CRM 99-day trial)';
COMMENT ON COLUMN org_subscriptions.b2b0_trial_ends_at IS 'B2B0 trial end date (7 days from start)';

-- Supported entitlement combinations:
-- 1. sales_os_free=true, crm_enabled=false, b2b0_enabled=false (Sales OS only)
-- 2. sales_os_free=true, crm_enabled=true,  b2b0_enabled=false (Sales OS + CRM)
-- 3. sales_os_free=true, crm_enabled=false, b2b0_enabled=true  (Sales OS + B2B0, NO CRM) ← KEY CASE
-- 4. sales_os_free=true, crm_enabled=true,  b2b0_enabled=true  (All three modules)
