-- 014_methodology_enum_gates.sql
-- Make methodology an ENUM with DEFAULT 'ignite_apex' and add gate tracking fields

DO $$
BEGIN
  -- Create methodology enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'methodology_type') THEN
    CREATE TYPE methodology_type AS ENUM ('ignite_apex', 'standard');
  END IF;
END $$;

-- Normalize existing methodology values before converting to enum
UPDATE public.opportunities SET methodology = 'ignite_apex' WHERE methodology IN ('IGNITE', 'ignite', 'ignite-apex', 'IGNITE-APEX');
UPDATE public.opportunities SET methodology = 'standard' WHERE methodology NOT IN ('ignite_apex', 'standard') AND methodology IS NOT NULL;
UPDATE public.opportunities SET methodology = 'ignite_apex' WHERE methodology IS NULL;

-- Update methodology column to use enum with default
ALTER TABLE public.opportunities
  ALTER COLUMN methodology DROP DEFAULT;

ALTER TABLE public.opportunities
  ALTER COLUMN methodology TYPE methodology_type USING methodology::methodology_type;

ALTER TABLE public.opportunities
  ALTER COLUMN methodology SET DEFAULT 'ignite_apex';

-- Add gate tracking fields for IGNITE-APEX methodology
DO $$
BEGIN
  -- Stage 1 Qualification gate fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_account_exists') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_account_exists BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_contact_exists') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_contact_exists BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_prospect_engaged') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_prospect_engaged BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_quantified_pain') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_quantified_pain BOOLEAN DEFAULT false;
  END IF;

  -- Stage 2 Discovery gate fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_economic_buyer_identified') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_economic_buyer_identified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_metrics_quantified') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_metrics_quantified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_champion_emerging') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_champion_emerging BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_pain_tied_to_outcome') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_pain_tied_to_outcome BOOLEAN DEFAULT false;
  END IF;

  -- Stage 3 Demo gate fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_demo_delivered') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_demo_delivered BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_prospect_confirms_fit') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_prospect_confirms_fit BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_decision_criteria_documented') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_decision_criteria_documented BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_decision_process_documented') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_decision_process_documented BOOLEAN DEFAULT false;
  END IF;

  -- Stage 4 Proposal gate fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_proposal_delivered') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_proposal_delivered BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_business_case_to_eb') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_business_case_to_eb BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_roi_tied_to_metrics') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_roi_tied_to_metrics BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_paper_process_mapped') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_paper_process_mapped BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_meddpicc_complete') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_meddpicc_complete BOOLEAN DEFAULT false;
  END IF;

  -- Stage 5 Negotiation gate fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_verbal_commitment') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_verbal_commitment BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_terms_in_negotiation') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_terms_in_negotiation BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_mutual_close_plan') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_mutual_close_plan BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_champion_eb_aligned') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_champion_eb_aligned BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_competition_neutralized') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_competition_neutralized BOOLEAN DEFAULT false;
  END IF;

  -- Stage 6 Closed Won gate field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_contract_signed') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_contract_signed BOOLEAN DEFAULT false;
  END IF;

  -- Standard methodology gates (simpler BANT)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_need_identified') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_need_identified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_authority_confirmed') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_authority_confirmed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_need_validated') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_need_validated BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_budget_confirmed') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_budget_confirmed BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_timeline_locked') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_timeline_locked BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing NULL methodologies to ignite_apex
UPDATE public.opportunities SET methodology = 'ignite_apex' WHERE methodology IS NULL;

COMMENT ON COLUMN public.opportunities.methodology IS 'Qualification methodology: ignite_apex (brutal IGNITE gates) or standard (BANT gates). Default: ignite_apex.';
