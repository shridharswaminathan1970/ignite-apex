-- 015_add_missing_gate_fields.sql
-- Add gate fields that were referenced in gate-engine.js but not created in migration 014

DO $$
BEGIN
  -- Fields used by Standard methodology that were missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_proposal_delivered') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_proposal_delivered BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_demo_delivered') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_demo_delivered BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_need_validated') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_need_validated BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'gate_contract_signed') THEN
    ALTER TABLE public.opportunities ADD COLUMN gate_contract_signed BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN public.opportunities.gate_demo_delivered IS 'Demo/POC delivered to prospect (Standard methodology)';
COMMENT ON COLUMN public.opportunities.gate_need_validated IS 'Need validated against solution - prospect confirmed fit (Standard methodology)';
COMMENT ON COLUMN public.opportunities.gate_proposal_delivered IS 'Proposal delivered to economic buyer (Standard methodology)';
COMMENT ON COLUMN public.opportunities.gate_contract_signed IS 'Contract signed - deal closed won (both methodologies)';
