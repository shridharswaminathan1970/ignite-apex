-- 017_lead_management.sql
-- Lead management: separate from opportunities, pre-pipeline qualification

-- Add lead-specific fields to opportunities table (when pipeline_stage='Lead')
DO $$
BEGIN
  -- Lead source tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'lead_source') THEN
    ALTER TABLE public.opportunities ADD COLUMN lead_source TEXT;
  END IF;

  -- Lead score (0-100) - calculated from qualification readiness
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'lead_score') THEN
    ALTER TABLE public.opportunities ADD COLUMN lead_score INTEGER DEFAULT 0;
  END IF;

  -- Lead status: new, contacted, qualified, nurture, disqualified
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'lead_status') THEN
    ALTER TABLE public.opportunities ADD COLUMN lead_status TEXT DEFAULT 'new';
  END IF;

  -- Disqualification reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'disqualified_reason') THEN
    ALTER TABLE public.opportunities ADD COLUMN disqualified_reason TEXT;
  END IF;

  -- Nurture notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'nurture_notes') THEN
    ALTER TABLE public.opportunities ADD COLUMN nurture_notes TEXT;
  END IF;

  -- Last contacted timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'last_contacted_at') THEN
    ALTER TABLE public.opportunities ADD COLUMN last_contacted_at TIMESTAMPTZ;
  END IF;

  -- Converted to opportunity timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'converted_at') THEN
    ALTER TABLE public.opportunities ADD COLUMN converted_at TIMESTAMPTZ;
  END IF;

  -- Pre-qualification answers (before full IGNITE/BANT)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'prequal_budget_range') THEN
    ALTER TABLE public.opportunities ADD COLUMN prequal_budget_range TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'prequal_timeline') THEN
    ALTER TABLE public.opportunities ADD COLUMN prequal_timeline TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'prequal_pain_point') THEN
    ALTER TABLE public.opportunities ADD COLUMN prequal_pain_point TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'prequal_decision_maker') THEN
    ALTER TABLE public.opportunities ADD COLUMN prequal_decision_maker TEXT;
  END IF;
END $$;

-- Create lead_sources enum type for tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source_type') THEN
    CREATE TYPE lead_source_type AS ENUM (
      'inbound_web',
      'inbound_form',
      'inbound_chat',
      'outbound_cold_call',
      'outbound_email',
      'referral',
      'event',
      'partner',
      'social_media',
      'other'
    );
  END IF;
END $$;

-- Create lead_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status_type') THEN
    CREATE TYPE lead_status_type AS ENUM (
      'new',
      'contacted',
      'qualified',
      'nurture',
      'disqualified'
    );
  END IF;
END $$;

-- Add indexes for lead queries
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_status ON public.opportunities(lead_status) WHERE pipeline_stage = 'Lead';
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_score ON public.opportunities(lead_score) WHERE pipeline_stage = 'Lead';
CREATE INDEX IF NOT EXISTS idx_opportunities_last_contacted ON public.opportunities(last_contacted_at) WHERE pipeline_stage = 'Lead';

COMMENT ON COLUMN public.opportunities.lead_source IS 'Where this lead came from (inbound/outbound/referral/etc)';
COMMENT ON COLUMN public.opportunities.lead_score IS 'Auto-calculated score 0-100 based on qualification readiness';
COMMENT ON COLUMN public.opportunities.lead_status IS 'Lead lifecycle: new, contacted, qualified, nurture, disqualified';
COMMENT ON COLUMN public.opportunities.disqualified_reason IS 'Why this lead was disqualified';
COMMENT ON COLUMN public.opportunities.last_contacted_at IS 'Last time rep contacted this lead';
COMMENT ON COLUMN public.opportunities.converted_at IS 'When lead converted to opportunity (passed pre-pipeline gate)';
