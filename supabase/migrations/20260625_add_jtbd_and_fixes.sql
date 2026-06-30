  -- Migration: Add JTBD fields and fix schema issues
  -- Date: 2026-06-25

  -- 1. Add close_date to opportunities (if not exists)
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'opportunities' AND column_name = 'close_date'
    ) THEN
      ALTER TABLE opportunities ADD COLUMN close_date DATE;
    END IF;
  END $$;

  -- 2. Add JTBD fields to opportunities
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'opportunities' AND column_name = 'jtbd_when_situation'
    ) THEN
      ALTER TABLE opportunities ADD COLUMN jtbd_when_situation TEXT;
      ALTER TABLE opportunities ADD COLUMN jtbd_i_want TEXT;
      ALTER TABLE opportunities ADD COLUMN jtbd_so_i_can TEXT;
      ALTER TABLE opportunities ADD COLUMN jtbd_functional_job TEXT;
      ALTER TABLE opportunities ADD COLUMN jtbd_emotional_job TEXT;
      ALTER TABLE opportunities ADD COLUMN jtbd_social_job TEXT;
    END IF;
  END $$;

  -- 3. Add 6 IGNITE diagnostic boolean fields
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'opportunities' AND column_name = 'ignite_identify'
    ) THEN
      ALTER TABLE opportunities ADD COLUMN ignite_identify BOOLEAN DEFAULT false;
      ALTER TABLE opportunities ADD COLUMN ignite_go_deep BOOLEAN DEFAULT false;
      ALTER TABLE opportunities ADD COLUMN ignite_nurture BOOLEAN DEFAULT false;
      ALTER TABLE opportunities ADD COLUMN ignite_iterate BOOLEAN DEFAULT false;
      ALTER TABLE opportunities ADD COLUMN ignite_trigger BOOLEAN DEFAULT false;
      ALTER TABLE opportunities ADD COLUMN ignite_escalate BOOLEAN DEFAULT false;
    END IF;
  END $$;

  -- 4. Add AI coaching fields
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'opportunities' AND column_name = 'ai_coaching_history'
    ) THEN
      ALTER TABLE opportunities ADD COLUMN ai_coaching_history JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE opportunities ADD COLUMN last_ai_review_at TIMESTAMPTZ;
    END IF;
  END $$;

  -- 5. Add Peel the Onion fields for all 4 U's
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'opportunities' AND column_name = 'peel_u1_surface'
    ) THEN
      -- U1: Unworkable
      ALTER TABLE opportunities ADD COLUMN peel_u1_surface TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u1_layer2 TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u1_root TEXT;

      -- U2: Urgent
      ALTER TABLE opportunities ADD COLUMN peel_u2_surface TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u2_layer2 TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u2_root TEXT;

      -- U3: Unavoidable
      ALTER TABLE opportunities ADD COLUMN peel_u3_surface TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u3_layer2 TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u3_root TEXT;

      -- U4: Underserved
      ALTER TABLE opportunities ADD COLUMN peel_u4_surface TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u4_layer2 TEXT;
      ALTER TABLE opportunities ADD COLUMN peel_u4_root TEXT;
    END IF;
  END $$;

  -- 6. Add email reminder tracking to org_subscriptions
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'org_subscriptions' AND column_name = 'last_reminder_sent_at'
    ) THEN
      ALTER TABLE org_subscriptions ADD COLUMN last_reminder_sent_at TIMESTAMPTZ;
      ALTER TABLE org_subscriptions ADD COLUMN reminder_count INTEGER DEFAULT 0;
      ALTER TABLE org_subscriptions ADD COLUMN email_reminder_enabled BOOLEAN DEFAULT true;
    END IF;
  END $$;

  -- 7. Create index for faster trial lookups
  CREATE INDEX IF NOT EXISTS idx_org_subscriptions_trial_status
  ON org_subscriptions(status, trial_ends_at)
  WHERE status IN ('trial', 'active', 'cancelled', 'past_due');

  -- 8. Create index for faster opportunity queries
  CREATE INDEX IF NOT EXISTS idx_opportunities_methodology
  ON opportunities(methodology, stage, org_id);

  COMMENT ON COLUMN opportunities.close_date IS 'Expected close date for the opportunity';
  COMMENT ON COLUMN opportunities.jtbd_when_situation IS 'JTBD: When [situation]';
  COMMENT ON COLUMN opportunities.jtbd_i_want IS 'JTBD: I want to [action]';
  COMMENT ON COLUMN opportunities.jtbd_so_i_can IS 'JTBD: So I can [outcome]';
  COMMENT ON COLUMN opportunities.ai_coaching_history IS 'Array of AI coaching interactions';